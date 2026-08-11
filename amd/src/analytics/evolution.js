/**
 * AI Quiz Maker  -  Question Evolution Engine
 * Automatic question improvement based on analytics
 * 
 * Features:
 * - Detection of problematic questions
 * - AI-powered improvement suggestions
 * - A/B testing framework for question variants
 * - Learning curve optimization
 * 
 * @module     mod_aiquiz/analytics/evolution
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['mod_aiquiz/analytics/stats', 'mod_aiquiz/core/api'], function(Stats, Api) {
    'use strict';

    var ISSUE_TYPES = {
        TOO_EASY: 'too_easy',
        TOO_HARD: 'too_hard',
        POOR_DISCRIMINATION: 'poor_discrimination',
        NEGATIVE_DISCRIMINATION: 'negative_discrimination',
        INEFFECTIVE_DISTRACTORS: 'ineffective_distractors',
        AMBIGUOUS: 'ambiguous',
        TIME_OUTLIER: 'time_outlier'
    };

    var THRESHOLDS = {
        MIN_ATTEMPTS: 20,
        DIFFICULTY_TOO_EASY: 0.85,
        DIFFICULTY_TOO_HARD: 0.15,
        DISCRIMINATION_POOR: 0.15,
        TIME_OUTLIER_FACTOR: 2.5
    };

    function Evolution(options) {
        this.options = Object.assign({
            autoDetect: true,
            suggestImprovements: true,
            enableABTesting: false
        }, options);

        this.issues = [];
        this.suggestions = [];
    }

    Evolution.prototype.analyzeQuestion = function(questionStats, quizContext) {
        var issues = [];
        var summary = questionStats.getSummary(quizContext.overallScores);

        if (summary.totalAttempts < THRESHOLDS.MIN_ATTEMPTS) {
            return {
                questionId: summary.questionId,
                status: 'insufficient_data',
                issues: [],
                suggestions: [],
                message: 'Need at least ' + THRESHOLDS.MIN_ATTEMPTS + ' attempts for reliable analysis'
            };
        }

        if (summary.difficulty > THRESHOLDS.DIFFICULTY_TOO_EASY) {
            issues.push({
                type: ISSUE_TYPES.TOO_EASY,
                severity: 'warning',
                value: summary.difficulty,
                message: 'Question is too easy (' + Math.round(summary.difficulty * 100) + '% correct)'
            });
        }

        if (summary.difficulty < THRESHOLDS.DIFFICULTY_TOO_HARD) {
            issues.push({
                type: ISSUE_TYPES.TOO_HARD,
                severity: 'warning',
                value: summary.difficulty,
                message: 'Question is too difficult (' + Math.round(summary.difficulty * 100) + '% correct)'
            });
        }

        if (summary.discrimination !== null) {
            if (summary.discrimination < 0) {
                issues.push({
                    type: ISSUE_TYPES.NEGATIVE_DISCRIMINATION,
                    severity: 'error',
                    value: summary.discrimination,
                    message: 'Negative discrimination - high performers get this wrong more often'
                });
            } else if (summary.discrimination < THRESHOLDS.DISCRIMINATION_POOR) {
                issues.push({
                    type: ISSUE_TYPES.POOR_DISCRIMINATION,
                    severity: 'warning',
                    value: summary.discrimination,
                    message: 'Question does not differentiate between high and low performers'
                });
            }
        }

        var weakDistractors = summary.distractors.filter(function(d) {
            return !d.isCorrect && (d.effectiveness === 'Weak' || d.effectiveness === 'Unused');
        });

        if (weakDistractors.length >= 2) {
            issues.push({
                type: ISSUE_TYPES.INEFFECTIVE_DISTRACTORS,
                severity: 'info',
                value: weakDistractors.length,
                message: weakDistractors.length + ' distractor(s) are rarely selected'
            });
        }

        if (summary.timeStats.stdDev > summary.timeStats.mean * THRESHOLDS.TIME_OUTLIER_FACTOR) {
            issues.push({
                type: ISSUE_TYPES.TIME_OUTLIER,
                severity: 'info',
                value: summary.timeStats,
                message: 'Large variation in response times may indicate confusion'
            });
        }

        var suggestions = this.generateSuggestions(issues, summary);

        return {
            questionId: summary.questionId,
            status: issues.length > 0 ? 'needs_review' : 'healthy',
            qualityScore: summary.qualityScore,
            issues: issues,
            suggestions: suggestions,
            summary: summary
        };
    };

    Evolution.prototype.generateSuggestions = function(issues, summary) {
        var self = this;
        var suggestions = [];

        issues.forEach(function(issue) {
            switch (issue.type) {
                case ISSUE_TYPES.TOO_EASY:
                    suggestions.push({
                        type: 'modify',
                        priority: 'medium',
                        action: 'increase_difficulty',
                        description: 'Consider making distractors more plausible or adding complexity to the question stem.',
                        aiPrompt: self.buildAIPrompt('increase_difficulty', summary)
                    });
                    break;

                case ISSUE_TYPES.TOO_HARD:
                    suggestions.push({
                        type: 'modify',
                        priority: 'high',
                        action: 'decrease_difficulty',
                        description: 'Simplify the question, clarify wording, or make distractors more obviously incorrect.',
                        aiPrompt: self.buildAIPrompt('decrease_difficulty', summary)
                    });
                    break;

                case ISSUE_TYPES.NEGATIVE_DISCRIMINATION:
                    suggestions.push({
                        type: 'review',
                        priority: 'critical',
                        action: 'verify_answer',
                        description: 'Verify the marked correct answer is actually correct. Review for ambiguity.',
                        aiPrompt: null
                    });
                    suggestions.push({
                        type: 'modify',
                        priority: 'high',
                        action: 'rewrite_question',
                        description: 'Consider rewriting the question to remove potential confusion.',
                        aiPrompt: self.buildAIPrompt('clarify', summary)
                    });
                    break;

                case ISSUE_TYPES.POOR_DISCRIMINATION:
                    suggestions.push({
                        type: 'modify',
                        priority: 'medium',
                        action: 'improve_discrimination',
                        description: 'Create more nuanced distractors that test deeper understanding.',
                        aiPrompt: self.buildAIPrompt('improve_discrimination', summary)
                    });
                    break;

                case ISSUE_TYPES.INEFFECTIVE_DISTRACTORS:
                    suggestions.push({
                        type: 'modify',
                        priority: 'low',
                        action: 'replace_distractors',
                        description: 'Replace weak distractors with more plausible alternatives.',
                        aiPrompt: self.buildAIPrompt('replace_distractors', summary)
                    });
                    break;

                case ISSUE_TYPES.TIME_OUTLIER:
                    suggestions.push({
                        type: 'review',
                        priority: 'low',
                        action: 'review_clarity',
                        description: 'Review question for potential sources of confusion or lengthy processing.',
                        aiPrompt: null
                    });
                    break;
            }
        });

        suggestions.sort(function(a, b) {
            var priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return suggestions;
    };

    Evolution.prototype.buildAIPrompt = function(action, summary) {
        var baseContext = [
            'Question Analysis Data:',
            '- Difficulty: ' + Math.round((summary.difficulty || 0) * 100) + '% correct',
            '- Attempts: ' + summary.totalAttempts,
            '- Average time: ' + Math.round((summary.timeStats.mean || 0) / 1000) + 's',
            '',
            'Distractor Performance:'
        ];

        summary.distractors.forEach(function(d) {
            baseContext.push('- ' + (d.isCorrect ? '[CORRECT] ' : '') + d.answerText.substring(0, 50) + '... (' + d.percentage + '% selected)');
        });

        baseContext.push('');

        var actionPrompts = {
            increase_difficulty: [
                'Task: Generate improved distractors that are more challenging while remaining clearly incorrect.',
                'Requirements:',
                '- Distractors should be more plausible to students with surface-level understanding',
                '- Correct answer should still be clearly correct to those who truly understand',
                '- Maintain similar option lengths'
            ],
            decrease_difficulty: [
                'Task: Simplify this question while maintaining its educational value.',
                'Requirements:',
                '- Clarify any ambiguous wording in the stem',
                '- Make incorrect options more obviously wrong',
                '- Ensure the question tests the intended concept clearly'
            ],
            clarify: [
                'Task: Rewrite this question to eliminate ambiguity.',
                'Requirements:',
                '- Identify and fix any unclear wording',
                '- Ensure only one answer is defensibly correct',
                '- Remove any "trick" elements that confuse good students'
            ],
            improve_discrimination: [
                'Task: Create distractors that better differentiate understanding levels.',
                'Requirements:',
                '- Include common misconceptions as distractors',
                '- Ensure distractors appeal to incomplete understanding',
                '- The correct answer should require genuine comprehension'
            ],
            replace_distractors: [
                'Task: Replace ineffective distractors with better alternatives.',
                'Weak distractors to replace: ' + summary.distractors.filter(function(d) {
                    return !d.isCorrect && d.percentage < 10;
                }).map(function(d) { return d.answerText.substring(0, 30); }).join(', '),
                '',
                'Requirements:',
                '- New distractors should be plausible but clearly incorrect',
                '- Base them on common errors or misconceptions',
                '- Match the length and style of other options'
            ]
        };

        return baseContext.concat(actionPrompts[action] || []).join('\n');
    };

    Evolution.prototype.applyAISuggestion = function(questionId, suggestion) {
        if (!suggestion.aiPrompt) {
            return Promise.reject(new Error('No AI prompt available for this suggestion'));
        }

        return Api.request('evolve_question', {
            questionId: questionId,
            prompt: suggestion.aiPrompt,
            suggestionType: suggestion.action
        });
    };

    Evolution.prototype.createVariant = function(originalQuestion, modifications) {
        return {
            originalId: originalQuestion.id,
            variantId: 'v_' + Date.now(),
            questionText: modifications.questionText || originalQuestion.questionText,
            answers: modifications.answers || originalQuestion.answers,
            createdAt: new Date().toISOString(),
            status: 'testing',
            attempts: 0,
            stats: null
        };
    };

    Evolution.prototype.compareVariants = function(original, variant) {
        if (original.attempts < 30 || variant.attempts < 30) {
            return {
                status: 'insufficient_data',
                winner: null,
                confidence: 0
            };
        }

        var originalScore = this.calculateVariantScore(original);
        var variantScore = this.calculateVariantScore(variant);

        var difference = variantScore - originalScore;
        var confidence = Math.min(100, Math.abs(difference) * 10);

        return {
            status: 'complete',
            winner: difference > 5 ? 'variant' : difference < -5 ? 'original' : 'tie',
            originalScore: originalScore,
            variantScore: variantScore,
            difference: difference,
            confidence: confidence,
            recommendation: this.getVariantRecommendation(difference, confidence)
        };
    };

    Evolution.prototype.calculateVariantScore = function(questionData) {
        var stats = new Stats.QuestionStats(questionData);
        var summary = stats.getSummary();

        var difficultyScore = 100 - Math.abs(50 - (summary.difficulty || 0.5) * 100);

        var discriminationScore = Math.min(100, ((summary.discrimination || 0) + 0.5) * 100);

        var distractorScore = 0;
        if (summary.distractors) {
            var effective = summary.distractors.filter(function(d) {
                return !d.isCorrect && d.effectiveness === 'Effective';
            }).length;
            distractorScore = Math.min(100, effective * 33);
        }

        return (difficultyScore * 0.35) + (discriminationScore * 0.4) + (distractorScore * 0.25);
    };

    Evolution.prototype.getVariantRecommendation = function(difference, confidence) {
        if (confidence < 70) {
            return 'Continue testing - more data needed for reliable comparison';
        }

        if (difference > 10) {
            return 'Variant significantly outperforms original. Consider adopting.';
        } else if (difference > 5) {
            return 'Variant performs better. Consider replacing original.';
        } else if (difference > -5) {
            return 'No significant difference. Keep original or choose based on preference.';
        } else {
            return 'Original performs better. Discard variant.';
        }
    };

    return {
        Evolution: Evolution,
        ISSUE_TYPES: ISSUE_TYPES,
        THRESHOLDS: THRESHOLDS,

        create: function(options) {
            return new Evolution(options);
        }
    };
});
