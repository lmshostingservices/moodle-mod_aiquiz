/**
 * AI Quiz Maker  -  Analytics Engine
 * Question statistics, difficulty tracking, and evolution
 * 
 * Implements:
 * - Item difficulty (p-value)
 * - Item discrimination (point-biserial correlation)
 * - Distractor effectiveness analysis
 * - Time-based analytics
 * - Learning curve tracking
 * 
 * @module     mod_aiquiz/analytics/stats
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/analytics/stats', [], function() {
    'use strict';

    var DIFFICULTY_THRESHOLDS = {
        VERY_EASY: 0.9,
        EASY: 0.7,
        MODERATE: 0.4,
        DIFFICULT: 0.2,
        VERY_DIFFICULT: 0
    };

    var DISCRIMINATION_THRESHOLDS = {
        EXCELLENT: 0.4,
        GOOD: 0.3,
        ACCEPTABLE: 0.2,
        POOR: 0.1,
        NEGATIVE: 0
    };

    function QuestionStats(data) {
        this.questionId = data.questionId;
        this.questionType = data.questionType || 'mcq';
        this.responses = data.responses || [];
        this.totalAttempts = data.totalAttempts || 0;
        this.correctCount = data.correctCount || 0;
        this.partialCount = data.partialCount || 0;
        this.incorrectCount = data.incorrectCount || 0;
        this.answerDistribution = data.answerDistribution || {};
        this.timings = data.timings || [];
        this.scores = data.scores || [];
    }

    QuestionStats.prototype.calculateDifficulty = function() {
        if (this.totalAttempts === 0) return null;
        return this.correctCount / this.totalAttempts;
    };

    QuestionStats.prototype.getDifficultyLabel = function() {
        var p = this.calculateDifficulty();
        if (p === null) return 'Unknown';

        if (p >= DIFFICULTY_THRESHOLDS.VERY_EASY) return 'Very Easy';
        if (p >= DIFFICULTY_THRESHOLDS.EASY) return 'Easy';
        if (p >= DIFFICULTY_THRESHOLDS.MODERATE) return 'Moderate';
        if (p >= DIFFICULTY_THRESHOLDS.DIFFICULT) return 'Difficult';
        return 'Very Difficult';
    };

    QuestionStats.prototype.getDifficultyClass = function() {
        var label = this.getDifficultyLabel();
        return 'aiq-difficulty-' + label.toLowerCase().replace(/\s+/g, '-');
    };

    QuestionStats.prototype.calculateDiscrimination = function(overallScores) {
        if (this.responses.length < 10 || !overallScores || overallScores.length < 10) {
            return null;
        }

        var n = this.responses.length;
        var questionScores = this.responses.map(function(r) { return r.fraction; });
        
        var meanQ = questionScores.reduce(function(a, b) { return a + b; }, 0) / n;
        var meanO = overallScores.reduce(function(a, b) { return a + b; }, 0) / n;

        var sumQO = 0;
        var sumQ2 = 0;
        var sumO2 = 0;

        for (var i = 0; i < n; i++) {
            var devQ = questionScores[i] - meanQ;
            var devO = overallScores[i] - meanO;
            sumQO += devQ * devO;
            sumQ2 += devQ * devQ;
            sumO2 += devO * devO;
        }

        var denominator = Math.sqrt(sumQ2 * sumO2);
        if (denominator === 0) return 0;

        return sumQO / denominator;
    };

    QuestionStats.prototype.getDiscriminationLabel = function(value) {
        if (value === null) return 'Insufficient Data';

        if (value >= DISCRIMINATION_THRESHOLDS.EXCELLENT) return 'Excellent';
        if (value >= DISCRIMINATION_THRESHOLDS.GOOD) return 'Good';
        if (value >= DISCRIMINATION_THRESHOLDS.ACCEPTABLE) return 'Acceptable';
        if (value >= DISCRIMINATION_THRESHOLDS.POOR) return 'Poor';
        if (value < 0) return 'Negative (Review)';
        return 'Very Poor';
    };

    QuestionStats.prototype.getDistractorAnalysis = function() {
        var self = this;
        var analysis = [];
        var distribution = this.answerDistribution;
        var total = this.totalAttempts;

        if (total === 0) return analysis;

        Object.keys(distribution).forEach(function(answerId) {
            var data = distribution[answerId];
            var selectionRate = data.count / total;
            var effectiveness = 'Unused';

            if (data.isCorrect) {
                effectiveness = selectionRate >= 0.5 ? 'Good' : 'Underselected';
            } else {
                if (selectionRate >= 0.05 && selectionRate <= 0.35) {
                    effectiveness = 'Effective';
                } else if (selectionRate > 0.35) {
                    effectiveness = 'Too Attractive';
                } else if (selectionRate > 0) {
                    effectiveness = 'Weak';
                }
            }

            analysis.push({
                answerId: answerId,
                answerText: data.text || '',
                isCorrect: data.isCorrect,
                count: data.count,
                selectionRate: selectionRate,
                percentage: Math.round(selectionRate * 100),
                effectiveness: effectiveness
            });
        });

        return analysis.sort(function(a, b) {
            return b.selectionRate - a.selectionRate;
        });
    };

    QuestionStats.prototype.getTimeStats = function() {
        if (this.timings.length === 0) {
            return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
        }

        var sorted = this.timings.slice().sort(function(a, b) { return a - b; });
        var n = sorted.length;
        var sum = sorted.reduce(function(a, b) { return a + b; }, 0);
        var mean = sum / n;

        var median;
        if (n % 2 === 0) {
            median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        } else {
            median = sorted[Math.floor(n / 2)];
        }

        var variance = sorted.reduce(function(acc, val) {
            return acc + Math.pow(val - mean, 2);
        }, 0) / n;
        var stdDev = Math.sqrt(variance);

        return {
            mean: Math.round(mean),
            median: Math.round(median),
            min: sorted[0],
            max: sorted[n - 1],
            stdDev: Math.round(stdDev)
        };
    };

    QuestionStats.prototype.getSummary = function(overallScores) {
        var difficulty = this.calculateDifficulty();
        var discrimination = this.calculateDiscrimination(overallScores);
        var timeStats = this.getTimeStats();
        var distractors = this.getDistractorAnalysis();

        var qualityScore = 0;
        var issues = [];

        if (difficulty !== null) {
            if (difficulty >= 0.3 && difficulty <= 0.7) {
                qualityScore += 25;
            } else if (difficulty < 0.1 || difficulty > 0.9) {
                issues.push('Extreme difficulty level');
            } else {
                qualityScore += 10;
            }
        }

        if (discrimination !== null) {
            if (discrimination >= 0.3) {
                qualityScore += 25;
            } else if (discrimination >= 0.2) {
                qualityScore += 15;
            } else if (discrimination < 0.1) {
                issues.push('Poor discrimination');
            }
        }

        var effectiveDistractors = distractors.filter(function(d) {
            return !d.isCorrect && d.effectiveness === 'Effective';
        }).length;
        
        if (this.questionType === 'mcq' || this.questionType === 'truefalse') {
            if (effectiveDistractors >= 2) {
                qualityScore += 25;
            } else if (effectiveDistractors >= 1) {
                qualityScore += 15;
            } else {
                issues.push('Ineffective distractors');
            }
        } else {
            qualityScore += 25;
        }

        if (this.totalAttempts >= 30) {
            qualityScore += 25;
        } else if (this.totalAttempts >= 10) {
            qualityScore += 15;
        } else {
            issues.push('Insufficient attempts for reliable statistics');
        }

        var qualityLabel = 'Poor';
        if (qualityScore >= 90) qualityLabel = 'Excellent';
        else if (qualityScore >= 70) qualityLabel = 'Good';
        else if (qualityScore >= 50) qualityLabel = 'Acceptable';

        return {
            questionId: this.questionId,
            totalAttempts: this.totalAttempts,
            correctCount: this.correctCount,
            difficulty: difficulty,
            difficultyLabel: this.getDifficultyLabel(),
            difficultyClass: this.getDifficultyClass(),
            discrimination: discrimination,
            discriminationLabel: this.getDiscriminationLabel(discrimination),
            timeStats: timeStats,
            distractors: distractors,
            qualityScore: qualityScore,
            qualityLabel: qualityLabel,
            issues: issues,
            recommendations: this.getRecommendations(difficulty, discrimination, effectiveDistractors)
        };
    };

    QuestionStats.prototype.getRecommendations = function(difficulty, discrimination, effectiveDistractors) {
        var recommendations = [];

        if (difficulty !== null) {
            if (difficulty > 0.9) {
                recommendations.push({
                    type: 'difficulty',
                    severity: 'warning',
                    message: 'Question is too easy. Consider increasing complexity or adding more challenging aspects.'
                });
            } else if (difficulty < 0.2) {
                recommendations.push({
                    type: 'difficulty',
                    severity: 'warning',
                    message: 'Question is too difficult. Review for clarity, simplify language, or provide better distractors.'
                });
            }
        }

        if (discrimination !== null) {
            if (discrimination < 0) {
                recommendations.push({
                    type: 'discrimination',
                    severity: 'error',
                    message: 'Negative discrimination detected. High performers are getting this wrong more often than low performers. Review the correct answer and question clarity.'
                });
            } else if (discrimination < 0.1) {
                recommendations.push({
                    type: 'discrimination',
                    severity: 'warning',
                    message: 'Question does not differentiate between high and low performers. Consider revising to better assess understanding.'
                });
            }
        }

        if (this.questionType === 'mcq' && effectiveDistractors < 2) {
            recommendations.push({
                type: 'distractors',
                severity: 'info',
                message: 'Some distractors are not being selected. Consider making them more plausible or replacing with better alternatives.'
            });
        }

        return recommendations;
    };

    function QuizStats(options) {
        this.quizId = options.quizId;
        this.questions = options.questions || [];
        this.attempts = options.attempts || [];
    }

    QuizStats.prototype.calculate = function() {
        var self = this;
        var results = {
            quizId: this.quizId,
            totalAttempts: this.attempts.length,
            avgScore: 0,
            scoreDistribution: { buckets: [], counts: [] },
            completionRate: 0,
            avgTime: 0,
            questions: []
        };

        if (this.attempts.length === 0) {
            return results;
        }

        var scores = this.attempts.map(function(a) { return a.grade || 0; });
        var times = this.attempts.filter(function(a) { return a.timefinished; })
            .map(function(a) { return a.timefinished - a.timecreated; });

        results.avgScore = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
        results.scoreDistribution = this.calculateScoreDistribution(scores);
        
        var completed = this.attempts.filter(function(a) { return a.state === 'finished'; });
        results.completionRate = completed.length / this.attempts.length;

        if (times.length > 0) {
            results.avgTime = times.reduce(function(a, b) { return a + b; }, 0) / times.length;
        }

        this.questions.forEach(function(q) {
            var questionStats = new QuestionStats(q);
            results.questions.push(questionStats.getSummary(scores));
        });

        return results;
    };

    QuizStats.prototype.calculateScoreDistribution = function(scores) {
        var buckets = ['0-10%', '11-20%', '21-30%', '31-40%', '41-50%', 
                       '51-60%', '61-70%', '71-80%', '81-90%', '91-100%'];
        var counts = new Array(10).fill(0);

        scores.forEach(function(score) {
            var bucket = Math.min(9, Math.floor(score / 10));
            counts[bucket]++;
        });

        return { buckets: buckets, counts: counts };
    };

    QuizStats.prototype.getLearningCurve = function() {
        var self = this;
        var attemptsByUser = {};

        this.attempts.forEach(function(a) {
            if (!attemptsByUser[a.userid]) {
                attemptsByUser[a.userid] = [];
            }
            attemptsByUser[a.userid].push(a);
        });

        var maxAttempts = Math.max.apply(null, Object.values(attemptsByUser).map(function(a) { return a.length; }));
        var curveData = [];

        for (var i = 0; i < Math.min(maxAttempts, 10); i++) {
            var scoresForAttempt = [];
            Object.values(attemptsByUser).forEach(function(userAttempts) {
                userAttempts.sort(function(a, b) { return a.timecreated - b.timecreated; });
                if (userAttempts[i]) {
                    scoresForAttempt.push(userAttempts[i].grade || 0);
                }
            });

            if (scoresForAttempt.length > 0) {
                curveData.push({
                    attemptNumber: i + 1,
                    avgScore: scoresForAttempt.reduce(function(a, b) { return a + b; }, 0) / scoresForAttempt.length,
                    count: scoresForAttempt.length
                });
            }
        }

        return curveData;
    };

    return {
        QuestionStats: QuestionStats,
        QuizStats: QuizStats,
        DIFFICULTY_THRESHOLDS: DIFFICULTY_THRESHOLDS,
        DISCRIMINATION_THRESHOLDS: DISCRIMINATION_THRESHOLDS,

        createQuestionStats: function(data) {
            return new QuestionStats(data);
        },

        createQuizStats: function(options) {
            return new QuizStats(options);
        }
    };
});
