/**
 * AI Quiz Maker  -  Synonym Normalisation
 * Handles short answer synonym matching and normalisation
 * 
 * @module     mod_aiquiz/ai/synonyms
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ai/synonyms', ['mod_aiquiz/core/api'], function(Api) {
    'use strict';

    var commonSynonyms = {
        'organisation': ['organization', 'org', 'company', 'business'],
        'organisation': ['organization'],
        'colour': ['color'],
        'behaviour': ['behavior'],
        'centre': ['center'],
        'metre': ['meter'],
        'litre': ['liter'],
        'analyse': ['analyze'],
        'organise': ['organize'],
        'recognise': ['recognize'],
        'programme': ['program'],
        'labour': ['labor'],
        'favour': ['favor'],
        'licence': ['license'],
        'defence': ['defense'],
        'offence': ['offense'],
        
        'workplace': ['work place', 'worksite', 'work site', 'job site'],
        'employer': ['boss', 'manager', 'supervisor'],
        'employee': ['worker', 'staff member', 'team member'],
        'hazard': ['danger', 'risk', 'threat'],
        'incident': ['accident', 'event', 'occurrence'],
        'ppe': ['personal protective equipment', 'safety gear', 'protective equipment'],
        'whs': ['work health safety', 'ohs', 'occupational health safety'],
        'msds': ['sds', 'safety data sheet', 'material safety data sheet']
    };

    function normaliseText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    function areEquivalent(answer1, answer2) {
        var norm1 = normaliseText(answer1);
        var norm2 = normaliseText(answer2);

        if (norm1 === norm2) {
            return true;
        }

        if (commonSynonyms[norm1] && commonSynonyms[norm1].includes(norm2)) {
            return true;
        }
        if (commonSynonyms[norm2] && commonSynonyms[norm2].includes(norm1)) {
            return true;
        }

        return false;
    }

    function matchAnswer(userAnswer, correctAnswers) {
        var normUser = normaliseText(userAnswer);

        for (var i = 0; i < correctAnswers.length; i++) {
            var correct = correctAnswers[i];
            var normCorrect = normaliseText(correct.text || correct);
            var weight = correct.weight || 1.0;

            if (normUser === normCorrect) {
                return { match: true, weight: weight, matchedAnswer: correct.text || correct };
            }

            if (areEquivalent(normUser, normCorrect)) {
                return { match: true, weight: weight * 0.9, matchedAnswer: correct.text || correct };
            }
        }

        return { match: false, weight: 0, matchedAnswer: null };
    }

    function generateSynonyms(term) {
        var normTerm = normaliseText(term);
        var synonyms = [term];

        if (commonSynonyms[normTerm]) {
            synonyms = synonyms.concat(commonSynonyms[normTerm]);
        }

        for (var key in commonSynonyms) {
            if (commonSynonyms[key].includes(normTerm)) {
                synonyms.push(key);
            }
        }

        return [...new Set(synonyms)];
    }

    function requestAISynonyms(term, context) {
        return Api.request('generate_synonyms', {
            term: term,
            context: context || ''
        }).then(function(response) {
            return response.synonyms || [];
        });
    }

    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        var matrix = [];

        for (var i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (var j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    function similarityScore(a, b) {
        var normA = normaliseText(a);
        var normB = normaliseText(b);
        
        if (normA === normB) return 1.0;
        
        var distance = levenshteinDistance(normA, normB);
        var maxLen = Math.max(normA.length, normB.length);
        
        return maxLen > 0 ? 1 - (distance / maxLen) : 0;
    }

    function fuzzyMatch(userAnswer, correctAnswers, threshold) {
        threshold = threshold || 0.8;
        var normUser = normaliseText(userAnswer);

        for (var i = 0; i < correctAnswers.length; i++) {
            var correct = correctAnswers[i];
            var normCorrect = normaliseText(correct.text || correct);
            var score = similarityScore(normUser, normCorrect);
            
            if (score >= threshold) {
                return {
                    match: true,
                    score: score,
                    weight: (correct.weight || 1.0) * score,
                    matchedAnswer: correct.text || correct
                };
            }
        }

        return { match: false, score: 0, weight: 0, matchedAnswer: null };
    }

    return {
        normaliseText: normaliseText,
        areEquivalent: areEquivalent,
        matchAnswer: matchAnswer,
        generateSynonyms: generateSynonyms,
        requestAISynonyms: requestAISynonyms,
        similarityScore: similarityScore,
        fuzzyMatch: fuzzyMatch,
        levenshteinDistance: levenshteinDistance
    };
});
