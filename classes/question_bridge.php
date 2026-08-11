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
 * Question Data Bridge for AI Quiz
 * Transforms flat database records into JavaScript-ready structured format
 *
 * @package    mod_aiquiz
 * @copyright  2025 AI Grader
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_aiquiz;

defined('MOODLE_INTERNAL') || die();

class question_bridge {
    
    /** @var \moodle_database */
    protected $db;
    
    /** @var bool Whether to shuffle answers */
    protected $shuffleanswers;
    
    /** @var int Seed for consistent shuffling */
    protected $shuffleseed;
    
    /**
     * Constructor
     * 
     * @param bool $shuffleanswers Whether to shuffle answer options
     * @param int $shuffleseed Seed for consistent random shuffling
     */
    public function __construct($shuffleanswers = true, $shuffleseed = 0) {
        global $DB;
        $this->db = $DB;
        $this->shuffleanswers = $shuffleanswers;
        $this->shuffleseed = $shuffleseed;
    }
    
    /**
     * Convert a database question record to JavaScript format
     * 
     * @param object $question Question record from aiquiz_questions
     * @return array JavaScript-ready question data
     */
    public function transform($question) {
        $answers = $this->db->get_records('aiquiz_answers', 
            ['questionid' => $question->id], 
            'sortorder ASC'
        );
        
        $method = 'transform_' . $question->qtype;
        if (method_exists($this, $method)) {
            return $this->$method($question, $answers);
        }
        
        // Default to MCQ if unknown type
        return $this->transform_mcq($question, $answers);
    }
    
    /**
     * Transform multiple questions
     * 
     * @param array $questions Array of question records
     * @return array Array of JavaScript-ready question data
     */
    public function transformAll($questions) {
        $result = [];
        foreach ($questions as $question) {
            $result[] = $this->transform($question);
        }
        return $result;
    }
    
    /**
     * Transform MCQ question
     * Database: Each answer row is a choice with fraction=1 for correct
     */
    protected function transform_mcq($question, $answers) {
        $choices = [];
        $correctAnswer = null;
        $correctAnswers = [];
        $multiSelect = false;
        
        foreach ($answers as $answer) {
            $choiceId = 'c' . $answer->id;
            $choices[] = [
                'id' => $choiceId,
                'text' => format_text($answer->answertext, $answer->answertextformat),
                'icon' => null
            ];
            
            if ($answer->fraction > 0) {
                $correctAnswers[] = $choiceId;
            }
        }
        
        // If multiple correct answers, it's multi-select
        if (count($correctAnswers) > 1) {
            $multiSelect = true;
            $correctAnswer = $correctAnswers;
        } else {
            $correctAnswer = !empty($correctAnswers) ? $correctAnswers[0] : null;
        }
        
        // Shuffle if enabled
        if ($this->shuffleanswers && !empty($choices)) {
            $choices = $this->shuffle_with_seed($choices, $question->id);
        }
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'mcq',
            'questionText' => format_text($question->questiontext, $question->questiontextformat),
            'choices' => $choices,
            'correctAnswer' => $correctAnswer,
            'multiSelect' => $multiSelect,
            'columns' => count($choices) <= 4 ? 2 : 1,
            'showLetters' => true,
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    /**
     * Transform True/False question
     * For single T/F: Two answers (True/False), one with fraction=1
     * For multi-statement: Each statement is an answer, fraction indicates True/False for correct
     */
    protected function transform_truefalse($question, $answers) {
        // Check if it's a multi-statement T/F block or simple T/F
        if (count($answers) <= 2) {
            // Simple True/False - convert to MCQ-style
            return $this->transform_mcq($question, $answers);
        }
        
        // Multi-statement True/False block
        $statements = [];
        foreach ($answers as $index => $answer) {
            $statements[] = [
                'id' => 's' . $answer->id,
                'text' => format_text($answer->answertext, $answer->answertextformat),
                'correct' => $answer->fraction > 0
            ];
        }
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'truefalse',
            'scenario' => format_text($question->questiontext, $question->questiontextformat),
            'statements' => $statements,
            'showPartialScore' => true,
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    /**
     * Transform Matching question
     * Database convention: Even sortorder = stem (left), Odd sortorder = choice (right)
     * The fraction field on stems contains the index of the correct choice
     */
    protected function transform_matching($question, $answers) {
        $leftItems = [];
        $rightItems = [];
        $correctMatches = [];
        
        $answerList = array_values($answers);
        
        // Group by sortorder: even = stems (left), odd = choices (right)
        foreach ($answerList as $answer) {
            if ($answer->sortorder % 2 == 0) {
                // Stem (left side)
                $leftItems[] = [
                    'id' => 'l' . $answer->id,
                    'text' => format_text($answer->answertext, $answer->answertextformat),
                    '_correctIndex' => (int)$answer->fraction // Store for building correctMatches
                ];
            } else {
                // Choice (right side)
                $rightItems[] = [
                    'id' => 'r' . $answer->id,
                    'text' => format_text($answer->answertext, $answer->answertextformat)
                ];
            }
        }
        
        // Build correct matches
        foreach ($leftItems as $leftItem) {
            $correctIndex = $leftItem['_correctIndex'];
            if (isset($rightItems[$correctIndex])) {
                $correctMatches[$leftItem['id']] = $rightItems[$correctIndex]['id'];
            }
            unset($leftItem['_correctIndex']);
        }
        
        // Clean up left items
        $leftItems = array_map(function ($item) {
            unset($item['_correctIndex']);
            return $item;
        }, $leftItems);
        
        // Shuffle right items if enabled
        if ($this->shuffleanswers && !empty($rightItems)) {
            $rightItems = $this->shuffle_with_seed($rightItems, $question->id);
        }
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'matching',
            'questionText' => format_text($question->questiontext, $question->questiontextformat),
            'leftItems' => $leftItems,
            'rightItems' => $rightItems,
            'correctMatches' => (object)$correctMatches,
            'shuffleRight' => false, // Already shuffled
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    /**
     * Transform Ordering question
     * Database: Each answer is a step, sortorder determines correct position
     */
    protected function transform_ordering($question, $answers) {
        $steps = [];
        $correctOrder = [];
        
        // Answers are already sorted by sortorder ASC from database
        foreach ($answers as $answer) {
            $stepId = 'step' . $answer->id;
            $steps[] = [
                'id' => $stepId,
                'text' => format_text($answer->answertext, $answer->answertextformat),
                'description' => !empty($answer->feedback) ? format_text($answer->feedback, $answer->feedbackformat) : null
            ];
            $correctOrder[] = $stepId;
        }
        
        // For display, shuffle steps (correct order is preserved separately)
        $displaySteps = $this->shuffle_with_seed($steps, $question->id);
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'ordering',
            'questionText' => format_text($question->questiontext, $question->questiontextformat),
            'processTitle' => '', // Could extract from question text
            'steps' => $displaySteps,
            'correctOrder' => $correctOrder,
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    /**
     * Transform Gap Select / Dropdown question
     * Database: questiontext contains {{gap0}}, {{gap1}} placeholders
     * Each answer is a gap with options stored in feedback as JSON
     */
    protected function transform_gapselect($question, $answers) {
        $gaps = [];
        $sentence = $question->questiontext;
        
        foreach ($answers as $index => $answer) {
            $gapId = 'gap' . $answer->id;
            
            // Parse options from feedback field (stored as JSON)
            $options = [];
            $correctId = null;
            
            if (!empty($answer->feedback)) {
                $optionsData = json_decode($answer->feedback, true);
                if (is_array($optionsData)) {
                    foreach ($optionsData as $optIndex => $optText) {
                        $optId = 'opt' . $answer->id . '_' . $optIndex;
                        $options[] = [
                            'id' => $optId,
                            'text' => $optText
                        ];
                        // First option is typically correct
                        if ($optIndex === 0) {
                            $correctId = $optId;
                        }
                    }
                }
            }
            
            // If no options from feedback, use answertext as the correct answer
            if (empty($options)) {
                $correctOptId = 'opt' . $answer->id . '_0';
                $options[] = [
                    'id' => $correctOptId,
                    'text' => format_text($answer->answertext, $answer->answertextformat)
                ];
                $correctId = $correctOptId;
            }
            
            $gaps[] = [
                'id' => $gapId,
                'options' => $options,
                'correctId' => $correctId
            ];
        }
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'gapselect',
            'questionText' => '',
            'sentence' => format_text($sentence, $question->questiontextformat),
            'gaps' => $gaps,
            'shuffleOptions' => $this->shuffleanswers,
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    // Alias for gapselect
    protected function transform_selectmissingwords($question, $answers) {
        return $this->transform_gapselect($question, $answers);
    }
    
    /**
     * Transform Drag & Drop question
     * Similar structure to gap select but rendered as draggable items
     */
    protected function transform_dragdrop($question, $answers) {
        $result = $this->transform_gapselect($question, $answers);
        $result['type'] = 'ddwtos';
        return $result;
    }
    
    // Alias
    protected function transform_ddwtos($question, $answers) {
        return $this->transform_dragdrop($question, $answers);
    }
    
    /**
     * Transform Short Answer question
     * Database: Each answer is an accepted answer, fraction indicates how correct
     */
    protected function transform_shortanswer($question, $answers) {
        $correctAnswers = [];
        $acceptedVariations = [];
        
        foreach ($answers as $answer) {
            if ($answer->fraction >= 1) {
                $correctAnswers[] = trim($answer->answertext);
            } else if ($answer->fraction > 0) {
                $acceptedVariations[] = trim($answer->answertext);
            }
        }
        
        return [
            'questionId' => 'q' . $question->id,
            'type' => 'shortanswer',
            'questionText' => format_text($question->questiontext, $question->questiontextformat),
            'correctAnswers' => $correctAnswers,
            'acceptedVariations' => $acceptedVariations,
            'placeholder' => 'Type your answer...',
            'maxLength' => 100,
            'caseSensitive' => false,
            'feedback' => !empty($question->feedback) ? format_text($question->feedback, $question->feedbackformat) : null
        ];
    }
    
    /**
     * Transform Numerical question
     * Similar to short answer but expects numeric input
     */
    protected function transform_numerical($question, $answers) {
        $result = $this->transform_shortanswer($question, $answers);
        $result['type'] = 'numeric';
        $result['placeholder'] = 'Enter a number...';
        return $result;
    }
    
    /**
     * Shuffle array with consistent seed
     * Ensures same user sees same order within attempt
     */
    protected function shuffle_with_seed($array, $questionId) {
        $seed = $this->shuffleseed + $questionId;
        mt_srand($seed);
        
        $shuffled = $array;
        $count = count($shuffled);
        
        for ($i = $count - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            $temp = $shuffled[$i];
            $shuffled[$i] = $shuffled[$j];
            $shuffled[$j] = $temp;
        }
        
        // Reset random seed
        mt_srand();
        
        return $shuffled;
    }
    
    /**
     * Get saved answers for an attempt
     * 
     * @param int $attemptid
     * @return array Saved answers keyed by question ID
     */
    public function getSavedAnswers($attemptid) {
        $responses = $this->db->get_records('aiquiz_responses', ['attemptid' => $attemptid]);
        
        $savedAnswers = [];
        foreach ($responses as $response) {
            $qKey = 'q' . $response->questionid;
            $savedData = json_decode($response->response, true);
            
            // Transform answer IDs to match JS format
            if (is_array($savedData)) {
                $transformedData = [];
                foreach ($savedData as $key => $value) {
                    // Handle various answer formats
                    if (is_numeric($value)) {
                        $transformedData[$key] = 'c' . $value;
                    } else {
                        $transformedData[$key] = $value;
                    }
                }
                $savedAnswers[$qKey] = $transformedData;
            } else if (is_numeric($savedData)) {
                $savedAnswers[$qKey] = 'c' . $savedData;
            } else {
                $savedAnswers[$qKey] = $savedData;
            }
        }
        
        return $savedAnswers;
    }
}
