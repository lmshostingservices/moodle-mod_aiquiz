<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * AI Quiz - TGA Training Component API.
 * 
 * Hybrid approach using 3 data sources:
 * 1. XML Files (Primary, fastest): https://training.gov.au/TrainingComponentFiles/{Package}/{Code}_R{Release}.xml
 * 2. REST API (Metadata): https://training.gov.au/api/Training/{code} - Returns title, release dates
 * 3. SOAP API (Fallback): V13 endpoint with WS-Security - Only used if XML fails
 *
 * @package    mod_aiquiz
 * @copyright  2025 AI Grader <support@lmshostingservices.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_aiquiz\tga;

defined('MOODLE_INTERNAL') || die();

class training_component {
    private const WSDL = 'https://ws.training.gov.au/Deewr.Tga.Webservices/TrainingComponentServiceV13.svc?wsdl';
    private const XML_BASE = 'https://training.gov.au/TrainingComponentFiles/';
    private const REST_BASE = 'https://training.gov.au/api/Training/';
    private const CACHE_TTL = 2592000; // 30 days

    private $client = null;
    private $username;
    private $password;

    public function __construct() {
        global $CFG;
        $this->username = get_config('aiquiz', 'tga_username');
        $this->password = get_config('aiquiz', 'tga_password');
        
        if (empty($this->username) && !empty($CFG->TGA_USERNAME)) {
            $this->username = $CFG->TGA_USERNAME;
        }
        if (empty($this->password) && !empty($CFG->TGA_PASSWORD)) {
            $this->password = $CFG->TGA_PASSWORD;
        }
    }

    /**
     * Get unit of competency data using hybrid approach.
     * Priority: XML file -> REST API (metadata) -> SOAP API (fallback)
     */
    public function get_unit(string $code): ?array {
        $code = strtoupper(trim($code));
        $cache = \cache::make('mod_aiquiz', 'tga_units');
        $cached = $cache->get($code);

        if ($cached !== false) {
            return $cached;
        }

        try {
            // Step 1: Try XML file for full content (fastest, no auth needed)
            $xmldata = $this->fetch_xml_content($code);
            
            // Step 2: Get metadata from REST API (fast, no auth needed)
            $metadata = $this->fetch_rest_metadata($code);
            
            if ($xmldata && !empty($xmldata['elements'])) {
                // Combine XML content with REST metadata
                $result = [
                    'code' => $code,
                    'title' => $metadata['title'] ?? "Unit $code",
                    'releaseDate' => $metadata['releaseDate'] ?? date('Y-m-d'),
                    'description' => $xmldata['application'] ?? '',
                    'elements' => $xmldata['elements'],
                    'performanceEvidence' => $xmldata['performanceEvidence'] ?? [],
                    'knowledgeEvidence' => $xmldata['knowledgeEvidence'] ?? [],
                    'assessmentConditions' => $xmldata['assessmentConditions'] ?? [],
                    'occasions' => 1
                ];
                $cache->set($code, $result);
                return $result;
            }
            
            // Step 3: Fallback to SOAP API if XML failed
            $result = $this->call_soap_api($code);
            if ($result) {
                $cache->set($code, $result);
            }
            return $result;
            
        } catch (\Exception $e) {
            debugging('TGA API error: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return null;
        }
    }

    /**
     * Fetch unit content from XML file.
     * URL: https://training.gov.au/TrainingComponentFiles/{Package}/{Code}_R{Release}.xml
     */
    private function fetch_xml_content(string $code, int $release = 1): ?array {
        $package = $this->extract_package_code($code);
        $url = self::XML_BASE . $package . '/' . $code . '_R' . $release . '.xml';
        
        $xml = $this->http_get($url, 15);
        if (!$xml) {
            // Try alternative package codes
            $altpackages = ['BSB', 'ICT', 'TAE', 'HLT', 'CHC', 'SIT', 'AHC', 'CPC', 'RII', 'TLI', 'AUR', 'MEM', 'MSM', 'UEE', 'CPP'];
            foreach ($altpackages as $pkg) {
                if ($pkg === $package) continue;
                $alturl = self::XML_BASE . $pkg . '/' . $code . '_R' . $release . '.xml';
                $xml = $this->http_get($alturl, 10);
                if ($xml) break;
            }
        }
        
        if (!$xml) {
            return null;
        }
        
        return $this->parse_xml_content($xml);
    }

    /**
     * Parse AuthorIT XML format to extract elements and performance criteria.
     */
    private function parse_xml_content(string $xml): array {
        $elements = [];
        $performanceEvidence = [];
        $knowledgeEvidence = [];
        $assessmentConditions = [];
        $application = '';
        
        // Extract all paragraph content
        preg_match_all('/<p[^>]*>(.*?)<\/p>/si', $xml, $matches);
        $textContent = [];
        foreach ($matches[1] as $p) {
            $text = trim(strip_tags($p));
            if (!empty($text)) {
                $textContent[] = $text;
            }
        }
        
        $currentElement = null;
        $inElementsSection = false;
        $inPerformanceEvidence = false;
        $inKnowledgeEvidence = false;
        $inAssessmentConditions = false;
        $inApplication = false;
        
        foreach ($textContent as $text) {
            $lower = strtolower($text);
            
            // Detect section headers
            if (strpos($lower, 'elements and performance criteria') !== false) {
                $inElementsSection = true;
                $inPerformanceEvidence = $inKnowledgeEvidence = $inAssessmentConditions = $inApplication = false;
                continue;
            }
            if (strpos($lower, 'performance evidence') !== false) {
                if ($currentElement) {
                    $elements[] = $currentElement;
                    $currentElement = null;
                }
                $inPerformanceEvidence = true;
                $inElementsSection = $inKnowledgeEvidence = $inAssessmentConditions = $inApplication = false;
                continue;
            }
            if (strpos($lower, 'knowledge evidence') !== false) {
                $inKnowledgeEvidence = true;
                $inElementsSection = $inPerformanceEvidence = $inAssessmentConditions = $inApplication = false;
                continue;
            }
            if (strpos($lower, 'assessment conditions') !== false) {
                $inAssessmentConditions = true;
                $inElementsSection = $inPerformanceEvidence = $inKnowledgeEvidence = $inApplication = false;
                continue;
            }
            if ($lower === 'application') {
                $inApplication = true;
                $inElementsSection = $inPerformanceEvidence = $inKnowledgeEvidence = $inAssessmentConditions = false;
                continue;
            }
            
            // Skip header descriptions
            if (strpos($lower, 'elements describe the essential outcomes') !== false ||
                strpos($lower, 'performance criteria describe the performance') !== false) {
                continue;
            }
            
            // Parse content based on current section
            if ($inElementsSection) {
                // Element header: "1. Element title"
                if (preg_match('/^(\d+)\.\s+(.+)/', $text, $m)) {
                    if ($currentElement) {
                        $elements[] = $currentElement;
                    }
                    $currentElement = [
                        'code' => $m[1],
                        'name' => trim($m[2]),
                        'performanceCriteria' => []
                    ];
                    continue;
                }
                // Performance criteria: "1.1 PC text"
                if (preg_match('/^(\d+\.\d+)\s+(.+)/', $text, $m) && $currentElement) {
                    $currentElement['performanceCriteria'][] = $m[1] . ' ' . trim($m[2]);
                    continue;
                }
            }
            
            if ($inPerformanceEvidence && strlen($text) > 10 && strpos($lower, 'must be assessed') === false) {
                $performanceEvidence[] = $text;
            }
            
            if ($inKnowledgeEvidence && strlen($text) > 10) {
                $knowledgeEvidence[] = $text;
            }
            
            if ($inAssessmentConditions && strlen($text) > 10) {
                $assessmentConditions[] = $text;
            }
            
            if ($inApplication && strlen($text) > 20) {
                $application .= ($application ? ' ' : '') . $text;
            }
        }
        
        if ($currentElement) {
            $elements[] = $currentElement;
        }
        
        return [
            'elements' => $elements,
            'performanceEvidence' => $performanceEvidence,
            'knowledgeEvidence' => $knowledgeEvidence,
            'assessmentConditions' => $assessmentConditions,
            'application' => $application
        ];
    }

    /**
     * Fetch metadata from REST API (title, release date).
     * URL: https://training.gov.au/api/Training/{code}
     */
    private function fetch_rest_metadata(string $code): ?array {
        $url = self::REST_BASE . $code;
        $json = $this->http_get($url, 5);
        
        if (!$json) {
            return null;
        }
        
        $data = json_decode($json, true);
        if (!$data) {
            return null;
        }
        
        return [
            'title' => $data['title'] ?? ($data['mappingInformation'][0]['title'] ?? null),
            'releaseDate' => $data['releases'][0]['releaseDate'] ?? null
        ];
    }

    /**
     * Fallback: Call SOAP API for unit data.
     */
    private function call_soap_api(string $code): ?array {
        if (empty($this->username) || empty($this->password)) {
            return null;
        }

        if ($this->client === null) {
            $this->client = new \SoapClient(self::WSDL, [
                'trace' => true,
                'exceptions' => true,
                'connection_timeout' => 25,
                'login' => $this->username,
                'password' => $this->password
            ]);
        }

        $request = new \stdClass();
        $request->trainingComponentRequest = new \stdClass();
        $request->trainingComponentRequest->Code = $code;

        $response = $this->client->GetDetails($request);

        if (empty($response->GetDetailsResult->TrainingComponent)) {
            return null;
        }

        return $this->normalize_soap_unit($response->GetDetailsResult->TrainingComponent);
    }

    private function normalize_soap_unit($tc): array {
        $unit = [
            'code' => $tc->Code ?? '',
            'title' => $tc->Title ?? '',
            'description' => $tc->Description ?? '',
            'elements' => [],
            'performanceEvidence' => [],
            'knowledgeEvidence' => [],
            'assessmentConditions' => [],
            'occasions' => 1
        ];

        if (!empty($tc->Releases->Release)) {
            $releases = is_array($tc->Releases->Release)
                ? $tc->Releases->Release
                : [$tc->Releases->Release];

            $latestRelease = end($releases);

            if (!empty($latestRelease->UnitElements->UnitElement)) {
                $elements = is_array($latestRelease->UnitElements->UnitElement)
                    ? $latestRelease->UnitElements->UnitElement
                    : [$latestRelease->UnitElements->UnitElement];

                foreach ($elements as $element) {
                    $el = [
                        'code' => $element->Code ?? '',
                        'name' => $element->Name ?? '',
                        'performanceCriteria' => []
                    ];

                    if (!empty($element->PerformanceCriteria->PerformanceCriterion)) {
                        $criteria = is_array($element->PerformanceCriteria->PerformanceCriterion)
                            ? $element->PerformanceCriteria->PerformanceCriterion
                            : [$element->PerformanceCriteria->PerformanceCriterion];

                        foreach ($criteria as $pc) {
                            $el['performanceCriteria'][] = $pc->Name ?? $pc;
                        }
                    }

                    $unit['elements'][] = $el;
                }
            }

            if (!empty($latestRelease->PerformanceEvidence)) {
                $unit['performanceEvidence'] = $this->parse_evidence_list($latestRelease->PerformanceEvidence);
            }

            if (!empty($latestRelease->KnowledgeEvidence)) {
                $unit['knowledgeEvidence'] = $this->parse_evidence_list($latestRelease->KnowledgeEvidence);
            }

            if (!empty($latestRelease->AssessmentConditions)) {
                $unit['assessmentConditions'] = $this->parse_evidence_list($latestRelease->AssessmentConditions);
            }
        }

        return $unit;
    }

    private function parse_evidence_list($text): array {
        if (is_array($text)) {
            return $text;
        }

        $text = strip_tags($text);
        $lines = preg_split('/[\r\n]+/', $text);
        $evidence = [];

        foreach ($lines as $line) {
            $line = trim($line);
            $line = preg_replace('/^[\-\•\*]\s*/', '', $line);
            if (!empty($line) && strlen($line) > 3) {
                $evidence[] = $line;
            }
        }

        return $evidence;
    }

    private function extract_package_code(string $code): string {
        if (preg_match('/^([A-Z]{2,3})/', $code, $m)) {
            return $m[1];
        }
        return 'BSB';
    }

    private function http_get(string $url, int $timeout): ?string {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'User-Agent: Mozilla/5.0 (compatible; TGA-Client/1.0)',
            'Accept: application/json, text/xml, */*'
        ]);
        
        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpcode !== 200 || empty($response)) {
            return null;
        }
        
        return $response;
    }

    public function search_units(string $query): array {
        return [];
    }
}
