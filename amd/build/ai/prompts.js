/**
 * AI Quiz Maker  -  AI Prompt Templates
 * Criterion-based prompt generation for different question types
 * 
 * Supports:
 * - Performance criteria (RTO/VET)
 * - Knowledge evidence (RTO/VET)
 * - Learning outcomes (Higher Ed)
 * - Custom competencies
 * 
 * @module     mod_aiquiz/ai/prompts
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('mod_aiquiz/ai/prompts', [], function() {
    'use strict';

    var CRITERION_TYPES = {
        PERFORMANCE: 'performance',
        KNOWLEDGE: 'knowledge',
        LEARNING_OUTCOME: 'learning_outcome',
        SKILL: 'skill',
        CUSTOM: 'custom'
    };

    var QUESTION_TYPES = {
        MCQ: 'mcq',
        TRUE_FALSE: 'truefalse',
        MATCHING: 'matching',
        ORDERING: 'ordering',
        SHORT_ANSWER: 'shortanswer',
        NUMERIC: 'numeric',
        FILL_GAP: 'fillgap',
        DRAG_TABLE: 'dragtable',
        CATEGORY_SORT: 'categorysort',
        DRAG_DROP: 'dragdrop',
        HOTSPOT: 'hotspot',
        ESSAY: 'essay'
    };

    var BLOOM_LEVELS = {
        REMEMBER: { keywords: ['identify', 'list', 'name', 'define', 'recall', 'state'], level: 1 },
        UNDERSTAND: { keywords: ['explain', 'describe', 'summarise', 'interpret', 'classify'], level: 2 },
        APPLY: { keywords: ['apply', 'demonstrate', 'use', 'implement', 'execute'], level: 3 },
        ANALYSE: { keywords: ['analyse', 'compare', 'contrast', 'examine', 'distinguish'], level: 4 },
        EVALUATE: { keywords: ['evaluate', 'assess', 'justify', 'critique', 'judge'], level: 5 },
        CREATE: { keywords: ['create', 'design', 'develop', 'construct', 'produce'], level: 6 }
    };

    function detectCriterionType(criterion) {
        var text = (criterion.text || '').toLowerCase();
        var code = (criterion.code || '').toLowerCase();

        if (code.match(/^pc\d/) || text.includes('performance criteria')) {
            return CRITERION_TYPES.PERFORMANCE;
        }
        if (code.match(/^ke\d/) || text.includes('knowledge evidence')) {
            return CRITERION_TYPES.KNOWLEDGE;
        }
        if (code.match(/^lo\d/) || text.includes('learning outcome')) {
            return CRITERION_TYPES.LEARNING_OUTCOME;
        }
        if (text.includes('skill') || text.includes('able to')) {
            return CRITERION_TYPES.SKILL;
        }
        return CRITERION_TYPES.CUSTOM;
    }

    function detectBloomLevel(text) {
        text = text.toLowerCase();
        for (var level in BLOOM_LEVELS) {
            var keywords = BLOOM_LEVELS[level].keywords;
            for (var i = 0; i < keywords.length; i++) {
                if (text.includes(keywords[i])) {
                    return { name: level, level: BLOOM_LEVELS[level].level };
                }
            }
        }
        return { name: 'UNDERSTAND', level: 2 };
    }

    /**
     * Get language-specific spelling guidance
     */
    function getLanguageGuidance(language) {
        var langCode = language || 'en-AU';
        var spellingGuide = {
            'en-AU': 'Australian English spelling (organisation, colour, behaviour, metre)',
            'en-GB': 'British English spelling (organisation, colour, behaviour, metre)',
            'en-US': 'American English spelling (organization, color, behavior, meter)',
            'en-IN': 'Indian English spelling (organisation, colour, behaviour, metre)'
        };
        return spellingGuide[langCode] || 'Use ' + langCode + ' language conventions';
    }

    /**
     * Get context-specific guidance for vocational or academic
     */
    function getContextGuidance(options) {
        if (!options) return '';

        if (options.learningContext === 'vocational') {
            var industry = options.industry || 'general';
            var qualLevel = options.qualificationLevel || 'cert-iii';
            var workplace = options.workplaceContext || 'both';

            var qualLabels = {
                'cert-i': 'Certificate I (entry-level, supervised work)',
                'cert-ii': 'Certificate II (routine tasks, some autonomy)',
                'cert-iii': 'Certificate III (skilled work, problem-solving)',
                'cert-iv': 'Certificate IV (supervisory, specialized)',
                'diploma': 'Diploma (professional, technical depth)',
                'adv-diploma': 'Advanced Diploma (management, complex analysis)'
            };

            return [
                '',
                '## Vocational Context',
                '- Industry: ' + industry.charAt(0).toUpperCase() + industry.slice(1),
                '- Qualification: ' + (qualLabels[qualLevel] || qualLevel),
                '- Workplace: ' + workplace,
                '- Focus on real workplace scenarios and practical application',
                '- Use industry-specific terminology appropriate for the qualification level',
                '- Align with Australian VET competency standards'
            ].join('\n');
        }

        if (options.learningContext === 'academic') {
            var subject = options.subjectArea || 'general';
            var yearLevel = options.yearLevel || 'undergraduate';

            var yearLabels = {
                'year-7-8': 'Year 7-8 (simple concepts, concrete examples)',
                'year-9-10': 'Year 9-10 (developing complexity, abstract thinking)',
                'year-11-12': 'Year 11-12 (advanced concepts, critical analysis)',
                'undergraduate': 'Undergraduate (theoretical foundations, research skills)',
                'postgraduate': 'Postgraduate (advanced research, expert analysis)'
            };

            return [
                '',
                '## Academic Context',
                '- Subject: ' + subject.charAt(0).toUpperCase() + subject.slice(1),
                '- Level: ' + (yearLabels[yearLevel] || yearLevel),
                '- Focus on theoretical understanding and analytical thinking',
                '- Use academic terminology appropriate for the year level',
                '- Align with curriculum standards and learning outcomes'
            ].join('\n');
        }

        return '';
    }

    /**
     * Get difficulty guidance based on selected distribution
     */
    function getDifficultyGuidance(difficultyMix, targetDifficulty) {
        var guides = {
            'balanced': '30% easy (recall/recognition), 50% medium (application), 20% hard (analysis/evaluation)',
            'easy-focused': '50% easy (recall/recognition), 40% medium (application), 10% hard (analysis)',
            'hard-focused': '20% easy (recall), 40% medium (application), 40% hard (analysis/evaluation)'
        };

        var difficulty = targetDifficulty || 'medium';
        var difficultyDesc = {
            'easy': 'Simple recall or recognition question. Should be answerable by anyone who has read the content.',
            'medium': 'Application question. Requires understanding and ability to apply knowledge to a scenario.',
            'hard': 'Analysis or evaluation question. Requires deeper thinking, comparison, or judgment.'
        };

        return [
            '',
            '## Difficulty',
            '- Distribution target: ' + (guides[difficultyMix] || guides['balanced']),
            '- This question: ' + difficulty.toUpperCase() + ' - ' + (difficultyDesc[difficulty] || difficultyDesc['medium'])
        ].join('\n');
    }

    /**
     * Enhanced base system prompt with psychometric distractor rules
     */
    function getBaseSystemPrompt(options) {
        options = options || {};
        var language = options.language || 'en-AU';

        return [
            'You are an expert instructional designer, psychometrician, and assessment specialist.',
            'You create high-quality, psychometrically sound assessment questions that meet professional standards.',
            '',
            '## Language',
            '- ' + getLanguageGuidance(language),
            '',
            '## Core Assessment Principles',
            '- Questions must directly assess the stated criterion/outcome',
            '- Questions should be unambiguous with exactly one clearly correct answer',
            '- Stem should be meaningful alone (make sense without reading options)',
            '- Avoid negative phrasing ("Which is NOT...") unless testing safety-critical content',
            '',
            '## Psychometric Distractor Rules (MUST FOLLOW)',
            '1. ALL distractors must be plausible to learners who have NOT mastered the content',
            '2. Distractors should represent common misconceptions or errors',
            '3. ALL options (including correct answer) must be within +/-20% word count of each other',
            '4. ALL options must use parallel grammatical structure',
            '5. NO obvious outliers (avoid one very short or very long option)',
            '6. NO absolute terms (always, never, all, none) unless testing absolute rules',
            '7. NO "all of the above" or "none of the above" options',
            '8. NO overlapping options (if A is true, B cannot also be true)',
            '9. Correct answer position should vary (not always B or C)',
            '10. Distractors should be wrong for specific, educational reasons (not nonsense)',
            '',
            '## Explanation Quality',
            '- Explain WHY the correct answer is right (not just that it is)',
            '- Explain WHY each distractor is wrong (identify the misconception)',
            '- Use educational language that helps learning',
            '',
            '## Assessment Quality Standards',
            '- Valid: Measures what it claims to measure',
            '- Reliable: Consistent results across attempts',
            '- Fair: Accessible, unbiased, no cultural assumptions',
            '- Flexible: Appropriate for diverse learners',
            getContextGuidance(options)
        ].join('\n');
    }

    function getMCQPrompt(criterion, options) {
        options = options || {};
        var bloom = detectBloomLevel(criterion.text);
        var criterionType = detectCriterionType(criterion);
        var difficulty = options.difficulty || 'medium';
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate ' + (options.count || 1) + ' multiple choice question(s) for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '- Bloom\'s Level: ' + bloom.name + ' (Level ' + bloom.level + ')',
                getDifficultyGuidance(options.difficultyMix, difficulty),
                '',
                '## Requirements',
                '- 4 options (A, B, C, D)',
                '- Exactly 1 correct answer',
                '- ALL options within +/-20% word count (psychometric balance)',
                '- ALL options use parallel grammatical structure',
                '- Distractors represent common misconceptions',
                '- Include brief explanation for why each option is correct/incorrect',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "stem": "Question text here?",',
                '      "difficulty": "' + difficulty + '",',
                '      "options": [',
                '        { "text": "Option A", "correct": false, "explanation": "Why wrong" },',
                '        { "text": "Option B", "correct": true, "explanation": "Why correct" },',
                '        { "text": "Option C", "correct": false, "explanation": "Why wrong" },',
                '        { "text": "Option D", "correct": false, "explanation": "Why wrong" }',
                '      ],',
                '      "criterion_code": "' + (criterion.code || '') + '",',
                '      "bloom_level": "' + bloom.name + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getTrueFalsePrompt(criterion, options) {
        options = options || {};
        var bloom = detectBloomLevel(criterion.text);
        var criterionType = detectCriterionType(criterion);
        var difficulty = options.difficulty || 'medium';
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate ' + (options.count || 1) + ' True/False statement(s) for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '- Bloom\'s Level: ' + bloom.name,
                getDifficultyGuidance(options.difficultyMix, difficulty),
                '',
                '## Requirements',
                '- Create clear, unambiguous statements',
                '- Mix of true and false statements',
                '- Include explanation for the correct answer',
                '- Avoid absolute words like "always" or "never" unless appropriate',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "statement": "Statement text here.",',
                '      "difficulty": "' + difficulty + '",',
                '      "correct_answer": true,',
                '      "explanation": "Explanation of why this is true/false",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getMatchingPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate a matching question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Create 4-6 matching pairs',
                '- Left column: terms, concepts, or scenarios',
                '- Right column: definitions, actions, or outcomes',
                '- Each pair must have exactly one correct match',
                '- Include distractor options (more right-side items than left)',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "instruction": "Match each item on the left with its correct pair on the right.",',
                '      "pairs": [',
                '        { "left": "Term 1", "right": "Definition 1" },',
                '        { "left": "Term 2", "right": "Definition 2" },',
                '        { "left": "Term 3", "right": "Definition 3" },',
                '        { "left": "Term 4", "right": "Definition 4" }',
                '      ],',
                '      "distractors": ["Extra option 1", "Extra option 2"],',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getOrderingPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate an ordering/sequence question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Create 4-6 steps that must be arranged in correct order',
                '- Steps should represent a logical sequence (process, timeline, priority)',
                '- Each step should be clear and distinct',
                '- Include explanation for the correct order',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "instruction": "Arrange the following steps in the correct order.",',
                '      "correct_order": [',
                '        "First step description",',
                '        "Second step description",',
                '        "Third step description",',
                '        "Fourth step description"',
                '      ],',
                '      "explanation": "Explanation of why this order is correct",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getShortAnswerPrompt(criterion, options) {
        options = options || {};
        var bloom = detectBloomLevel(criterion.text);
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate ' + (options.count || 1) + ' short answer question(s) for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '- Bloom\'s Level: ' + bloom.name,
                '',
                '## Requirements',
                '- Answer should be 1-3 words',
                '- Question must have a single, definitive answer',
                '- Include acceptable synonyms and alternative phrasings',
                '- Avoid ambiguous questions with multiple valid answers',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "stem": "Question text requiring a short answer?",',
                '      "correct_answers": [',
                '        { "text": "primary answer", "weight": 1.0 },',
                '        { "text": "synonym 1", "weight": 1.0 },',
                '        { "text": "alternative phrasing", "weight": 0.8 }',
                '      ],',
                '      "case_sensitive": false,',
                '      "explanation": "Explanation of the correct answer",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getNumericPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate ' + (options.count || 1) + ' numeric answer question(s) for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Question requires a numerical answer',
                '- Specify acceptable tolerance range (e.g., +/-5%)',
                '- Include units if applicable',
                '- Provide worked solution/explanation',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "stem": "Calculate the value of X given...",',
                '      "correct_answer": 42.5,',
                '      "tolerance": 0.5,',
                '      "tolerance_type": "absolute",',
                '      "unit": "kg",',
                '      "explanation": "Step-by-step solution...",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getFillGapPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate a fill-in-the-gap question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Create a paragraph with 2-4 gaps',
                '- Each gap should test understanding of key concepts',
                '- Provide 3-4 options per gap (including distractors)',
                '- Gaps should be meaningful, not just removing random words',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "text": "The [[1]] is responsible for [[2]] in the workplace. This includes [[3]] and reporting [[4]].",',
                '      "gaps": [',
                '        {',
                '          "id": 1,',
                '          "correct": "supervisor",',
                '          "options": ["supervisor", "cleaner", "visitor", "contractor"]',
                '        },',
                '        {',
                '          "id": 2,',
                '          "correct": "safety",',
                '          "options": ["safety", "entertainment", "decoration", "catering"]',
                '        }',
                '      ],',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getCategorySortPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate a category sorting question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Create 2-3 categories with clear distinctions',
                '- Provide 4-6 items that must be sorted into the correct categories',
                '- Items should be clearly assignable to one category only',
                '- Include explanation for the correct categorisation',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "instruction": "Sort the following items into the correct categories.",',
                '      "categories": ["Category A", "Category B", "Category C"],',
                '      "items": [',
                '        { "text": "Item 1", "category": "Category A" },',
                '        { "text": "Item 2", "category": "Category B" },',
                '        { "text": "Item 3", "category": "Category A" },',
                '        { "text": "Item 4", "category": "Category C" }',
                '      ],',
                '      "explanation": "Explanation of the correct categorisation",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getDragDropPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate a drag and drop question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Create a scenario or diagram description with drop zones',
                '- Provide draggable items that must be placed in correct zones',
                '- Include 4-6 items and 4-6 drop zones',
                '- Items should map clearly to specific zones',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "instruction": "Drag each item to its correct location.",',
                '      "background_description": "Description of the workplace/scenario",',
                '      "drop_zones": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],',
                '      "items": [',
                '        { "text": "Item A", "correct_zone": "Zone 1" },',
                '        { "text": "Item B", "correct_zone": "Zone 2" },',
                '        { "text": "Item C", "correct_zone": "Zone 3" }',
                '      ],',
                '      "explanation": "Explanation of correct placements",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getHotspotPrompt(criterion, options) {
        options = options || {};
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate a hotspot/image-based question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '',
                '## Requirements',
                '- Describe a workplace scenario or image that could be used',
                '- Identify specific areas/hotspots the learner must select',
                '- Provide clear instructions on what to identify',
                '- Include explanation for correct hotspot selection',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "instruction": "Click on the hazard in the workplace image.",',
                '      "image_description": "Description of workplace image showing...",',
                '      "hotspots": [',
                '        {',
                '          "label": "Correct hotspot",',
                '          "description": "Location description",',
                '          "is_correct": true',
                '        },',
                '        {',
                '          "label": "Distractor hotspot",',
                '          "description": "Location description",',
                '          "is_correct": false',
                '        }',
                '      ],',
                '      "explanation": "Why this area is the correct answer",',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getEssayPrompt(criterion, options) {
        options = options || {};
        var bloom = detectBloomLevel(criterion.text);
        var criterionType = detectCriterionType(criterion);
        
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate an essay/extended response question for the following criterion.',
                '',
                '## Criterion',
                '- Code: ' + (criterion.code || 'N/A'),
                '- Text: ' + criterion.text,
                '- Type: ' + criterionType,
                '- Bloom\'s Level: ' + bloom.name,
                '',
                '## Requirements',
                '- Question should require a detailed written response (100-300 words)',
                '- Provide clear assessment criteria/rubric',
                '- Include sample response points for marking guide',
                '- Question should assess higher-order thinking (analysis, evaluation, synthesis)',
                '',
                '## Output Format (JSON)',
                '```json',
                '{',
                '  "questions": [',
                '    {',
                '      "stem": "Extended response question here...",',
                '      "word_limit": 250,',
                '      "rubric": [',
                '        { "criterion": "Understanding", "max_marks": 3, "descriptors": ["Poor", "Satisfactory", "Good", "Excellent"] },',
                '        { "criterion": "Application", "max_marks": 3, "descriptors": ["Poor", "Satisfactory", "Good", "Excellent"] },',
                '        { "criterion": "Communication", "max_marks": 2, "descriptors": ["Poor", "Satisfactory", "Good"] }',
                '      ],',
                '      "sample_response_points": [',
                '        "Key point 1 that should be included",',
                '        "Key point 2 that should be included",',
                '        "Key point 3 that should be included"',
                '      ],',
                '      "criterion_code": "' + (criterion.code || '') + '"',
                '    }',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    function getDistractorRefinementPrompt(question, feedback) {
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Improve the distractors for this question based on psychometric feedback.',
                '',
                '## Original Question',
                JSON.stringify(question, null, 2),
                '',
                '## Feedback',
                feedback || 'Distractors are too easy to eliminate. Make them more plausible.',
                '',
                '## Requirements',
                '- Keep the correct answer unchanged',
                '- Create new distractors that are:',
                '  - Similar length to the correct answer',
                '  - Plausible based on common misconceptions',
                '  - Related to the topic but clearly incorrect',
                '- Maintain 4 total options',
                '',
                '## Output Format (JSON)',
                'Return the complete question with improved options.'
            ].join('\n')
        };
    }

    function getExplanationPrompt(question) {
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Generate detailed explanations for each option in this question.',
                '',
                '## Question',
                JSON.stringify(question, null, 2),
                '',
                '## Requirements',
                '- Explain why the correct answer is correct',
                '- Explain why each distractor is incorrect',
                '- Use educational language that helps learning',
                '- Reference the criterion being assessed',
                '- Keep explanations concise (2-3 sentences each)',
                '',
                '## Output Format (JSON)',
                '{',
                '  "explanations": [',
                '    { "option_index": 0, "text": "Explanation for option A..." },',
                '    { "option_index": 1, "text": "Explanation for option B..." },',
                '    { "option_index": 2, "text": "Explanation for option C..." },',
                '    { "option_index": 3, "text": "Explanation for option D..." }',
                '  ],',
                '  "general_feedback": "Overall feedback about this concept..."',
                '}'
            ].join('\n')
        };
    }

    function getRegenerationPrompt(question, reason) {
        return {
            system: getBaseSystemPrompt(options),
            user: [
                '## Task',
                'Regenerate this question based on the following feedback.',
                '',
                '## Original Question',
                JSON.stringify(question, null, 2),
                '',
                '## Reason for Regeneration',
                reason || 'Question needs improvement.',
                '',
                '## Requirements',
                '- Address the specific feedback provided',
                '- Maintain the same criterion mapping',
                '- Keep the same question type',
                '- Ensure improved quality and validity',
                '',
                '## Output Format',
                'Return the complete regenerated question in the same JSON format.'
            ].join('\n')
        };
    }

    function buildPrompt(criterion, questionType, options) {
        options = options || {};
        
        switch (questionType) {
            case QUESTION_TYPES.MCQ:
                return getMCQPrompt(criterion, options);
            case QUESTION_TYPES.TRUE_FALSE:
                return getTrueFalsePrompt(criterion, options);
            case QUESTION_TYPES.MATCHING:
                return getMatchingPrompt(criterion, options);
            case QUESTION_TYPES.ORDERING:
                return getOrderingPrompt(criterion, options);
            case QUESTION_TYPES.SHORT_ANSWER:
                return getShortAnswerPrompt(criterion, options);
            case QUESTION_TYPES.NUMERIC:
                return getNumericPrompt(criterion, options);
            case QUESTION_TYPES.FILL_GAP:
                return getFillGapPrompt(criterion, options);
            case QUESTION_TYPES.CATEGORY_SORT:
                return getCategorySortPrompt(criterion, options);
            case QUESTION_TYPES.DRAG_DROP:
                return getDragDropPrompt(criterion, options);
            case QUESTION_TYPES.HOTSPOT:
                return getHotspotPrompt(criterion, options);
            case QUESTION_TYPES.ESSAY:
                return getEssayPrompt(criterion, options);
            default:
                return getMCQPrompt(criterion, options);
        }
    }

    /**
     * REFERENCE PROMPT - Implemented server-side in lms-labs.com API
     * 
     * This prompt is used by the /api/aiquiz/lookup-unit endpoint to flatten
     * nested TGA evidence into clean one-line criteria BEFORE returning to Moodle.
     * 
     * Flow: TGA SOAP  ->  raw evidence  ->  AI flattening  ->  clean criteria  ->  Moodle
     * 
     * Keeping here as documentation for the external API implementation.
     * 
     * @param {string} knowledgeEvidence - Raw knowledge evidence text from TGA
     * @param {string} performanceEvidence - Raw performance evidence text from TGA (optional)
     * @returns {Object} System and user prompts for AI flattening
     */
    function getEvidenceFlatteningPrompt(knowledgeEvidence, performanceEvidence) {
        return {
            system: [
                'You are an expert VET assessment designer specialising in Australian RTOs.',
                'You convert complex unit of competency evidence requirements into clear, assessable criteria.',
                '',
                'Your output is used for:',
                '- Assessment mapping tables',
                '- Quiz question generation',
                '- SCORM compliance tracking',
                '- Practical assessment checklists',
                '',
                'You must produce clean, actionable criteria that assessors can easily verify.'
            ].join('\n'),
            user: [
                '## Task',
                'Convert the following Knowledge Evidence and Performance Evidence from a Unit of Competency into clear, simple one-line assessment criteria.',
                '',
                '## Rules (must follow):',
                '1. Produce two sections only: "knowledge_criteria" and "performance_criteria"',
                '2. Write one criterion per line',
                '3. Use plain, assessor-friendly language',
                '4. Start every line with a strong action verb (identify, explain, describe, apply, demonstrate)',
                '5. Keep each criterion to one sentence only',
                '6. Flatten nested dot points into single, clear criteria',
                '7. Combine related sub-points where appropriate without losing meaning',
                '8. Do not repeat the original wording verbatim - rewrite for clarity',
                '9. Use Australian English spelling',
                '10. Each criterion should be independently assessable',
                '',
                '## Knowledge Evidence:',
                knowledgeEvidence || '(none provided)',
                '',
                '## Performance Evidence:',
                performanceEvidence || '(none provided)',
                '',
                '## Output Format (JSON):',
                '```json',
                '{',
                '  "knowledge_criteria": [',
                '    "Identify key legislation required to work safely at heights",',
                '    "Explain statutory and regulatory authority requirements for heights work",',
                '    "Describe heights safety systems and their applications",',
                '    "Identify safe work methods for working at heights"',
                '  ],',
                '  "performance_criteria": [',
                '    "Select and inspect appropriate personal protective equipment",',
                '    "Apply correct procedures for setting up heights safety systems",',
                '    "Demonstrate safe techniques for working at heights"',
                '  ]',
                '}',
                '```'
            ].join('\n')
        };
    }

    return {
        CRITERION_TYPES: CRITERION_TYPES,
        QUESTION_TYPES: QUESTION_TYPES,
        BLOOM_LEVELS: BLOOM_LEVELS,

        detectCriterionType: detectCriterionType,
        detectBloomLevel: detectBloomLevel,
        buildPrompt: buildPrompt,

        getMCQPrompt: getMCQPrompt,
        getTrueFalsePrompt: getTrueFalsePrompt,
        getMatchingPrompt: getMatchingPrompt,
        getOrderingPrompt: getOrderingPrompt,
        getShortAnswerPrompt: getShortAnswerPrompt,
        getNumericPrompt: getNumericPrompt,
        getFillGapPrompt: getFillGapPrompt,
        getCategorySortPrompt: getCategorySortPrompt,
        getDragDropPrompt: getDragDropPrompt,
        getHotspotPrompt: getHotspotPrompt,
        getEssayPrompt: getEssayPrompt,

        getDistractorRefinementPrompt: getDistractorRefinementPrompt,
        getExplanationPrompt: getExplanationPrompt,
        getRegenerationPrompt: getRegenerationPrompt,
        getEvidenceFlatteningPrompt: getEvidenceFlatteningPrompt
    };
});
