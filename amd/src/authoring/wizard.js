/**
 * AI Quiz Maker  -  Authoring Wizard
 * 7-screen wizard for criterion-based question generation
 * 
 * Screens:
 * 0. Entry Point - Assessment name, type
 * 1. Source Selection - TGA API or paste criteria
 * 2. Criteria Review - Normalise and confirm criteria
 * 3. Allocation Matrix - Questions per criterion
 * 4. AI Generation - Progressive loading
 * 5. Review & Edit - Edit generated questions
 * 6. Compliance Summary - Coverage report
 * 
 * @module     mod_aiquiz/authoring/wizard
 * @copyright  2025 NCT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'mod_aiquiz/core/state',
    'mod_aiquiz/core/api',
    'mod_aiquiz/core/animations',
    'mod_aiquiz/ui/Button'
], function(State, Api, Animations, Button) {
    'use strict';

    // -- Industry & Sector Data  -  kept in sync with Content Creator --------------
    var AIQ_INDUSTRIES = [
        'Aged Care', 'Agriculture', 'Automotive', 'Aviation', 'Building & Construction',
        'Business Services', 'Childcare', 'Community Services', 'Education', 'Electrical',
        'Engineering', 'Finance', 'Food Processing', 'Government', 'Healthcare',
        'Hospitality', 'Information Technology', 'Logistics', 'Manufacturing', 'Mining',
        'Plumbing', 'Retail', 'Security', 'Sport & Recreation', 'Tourism', 'Transport',
        'Utilities', 'Warehousing', 'Other'
    ];
    var AIQ_INDUSTRY_SUBCATEGORIES = {
        'Aged Care': ['Residential Aged Care','Home Care Services','Dementia Care','Palliative Care','Community Aged Care','Retirement Living','Respite Care','Allied Health in Aged Care'],
        'Agriculture': ['Cropping & Grain','Livestock & Cattle','Dairy Farming','Horticulture','Viticulture & Wine','Aquaculture','Poultry','Shearing & Wool','Agricultural Contracting','Irrigation & Water Management'],
        'Automotive': ['Light Vehicle Mechanical','Heavy Vehicle Mechanical','Auto Electrical','Panel Beating & Spray Painting','Motorcycle Technician','Marine Mechanical','Automotive Parts & Accessories','Vehicle Sales','Tyre Fitting'],
        'Aviation': ['Commercial Aviation','General Aviation','Aircraft Maintenance','Ground Operations','Air Traffic Control','Cabin Crew','Aviation Security','Helicopter Operations'],
        'Building & Construction': ['Residential Construction','Commercial Construction','Civil Construction','Mining Construction','Industrial Construction','High-Rise Construction','Renovation & Refurbishment','Demolition','Scaffolding','Formwork','Concreting','Steel Fixing','Carpentry','Bricklaying','Tiling','Painting & Decorating','Plastering','Roofing','Glazing','Waterproofing'],
        'Business Services': ['Accounting & Bookkeeping','Human Resources','Marketing & Advertising','Legal Services','Consulting','Recruitment','Training & Development','Property Management','Cleaning Services','Security Services'],
        'Childcare': ['Long Day Care','Family Day Care','Outside School Hours Care','Kindergarten/Preschool','Occasional Care','In-Home Care','Special Needs Support','Early Intervention'],
        'Community Services': ['Disability Support','Mental Health Support','Youth Work','Family Services','Homelessness Services','Drug & Alcohol Services','Aboriginal & Torres Strait Islander Services','Refugee & Migrant Services','Domestic Violence Support','Case Management'],
        'Education': ['Primary Education','Secondary Education','Vocational Education (VET)','Higher Education/University','TAFE','Adult Education','Special Education','Early Childhood Education','Online/Distance Education','Education Support','Training Administration','School Administration','Private Training Provider (RTO)'],
        'Electrical': ['Domestic Electrical','Commercial Electrical','Industrial Electrical','Instrumentation','Refrigeration & Air Conditioning','Solar Installation','Data & Communications','Fire Protection Systems','Lift Installation'],
        'Engineering': ['Mechanical Engineering','Civil Engineering','Structural Engineering','Electrical Engineering','Chemical Engineering','Mining Engineering','Environmental Engineering','Project Engineering','Maintenance Engineering'],
        'Finance': ['Banking','Insurance','Financial Planning','Mortgage Broking','Credit & Lending','Superannuation','Investment Management','Payroll','Accounts Payable/Receivable','Auditing'],
        'Food Processing': ['Meat Processing','Seafood Processing','Dairy Processing','Bakery','Beverage Manufacturing','Confectionery','Fruit & Vegetable Processing','Ready Meals & Convenience Foods','Quality Assurance','Food Safety'],
        'Government': ['Local Government','State Government','Federal Government','Emergency Services','Regulatory & Compliance','Policy & Planning','Customer Service','Parks & Recreation','Infrastructure','Community Engagement'],
        'Healthcare': ['Acute Care/Hospital','Primary Care/GP','Allied Health','Mental Health','Community Health','Dental','Pharmacy','Pathology','Radiology','Emergency Services','Surgical','Rehabilitation','Infection Control','Aged Care Nursing','Midwifery','Disability Health','Aboriginal Health'],
        'Hospitality': ['Hotels & Accommodation','Restaurants & Cafes','Bars & Pubs','Catering','Events & Functions','Fast Food & Quick Service','Clubs & Gaming','Commercial Cookery','Patisserie','Front Office','Housekeeping'],
        'Information Technology': ['Software Development','Network Administration','Cybersecurity','Cloud Computing','Database Administration','IT Support/Help Desk','Web Development','Data Analytics','Systems Administration','IT Project Management'],
        'Logistics': ['Supply Chain Management','Freight Forwarding','Customs & Border','Inventory Management','Distribution','Third-Party Logistics (3PL)','Last Mile Delivery','Cold Chain Logistics','Dangerous Goods'],
        'Manufacturing': ['Food & Beverage Manufacturing','Pharmaceutical Manufacturing','Chemical Manufacturing','Metal Fabrication','Plastics & Rubber','Textiles','Furniture Manufacturing','Electronics Manufacturing','Printing','Packaging','Process Manufacturing'],
        'Mining': ['Open Cut Mining','Underground Mining','Coal Mining','Iron Ore','Gold Mining','Mineral Processing','Exploration','Drilling','Mine Site Services','Tailings Management','Mine Rehabilitation'],
        'Plumbing': ['Domestic Plumbing','Commercial Plumbing','Industrial Plumbing','Gas Fitting','Roofing & Drainage','Fire Protection Plumbing','Irrigation','Water Treatment','Mechanical Services'],
        'Retail': ['Supermarkets & Grocery','Fashion & Apparel','Electronics & Technology','Hardware & Building','Pharmacy Retail','Furniture & Homewares','Automotive Retail','Sporting Goods','Online/E-commerce','Luxury Retail'],
        'Security': ['Static Security','Mobile Patrol','Event Security','Close Protection','Loss Prevention','Corporate Security','Cash in Transit','CCTV & Monitoring','Access Control','Cybersecurity Operations'],
        'Sport & Recreation': ['Fitness & Personal Training','Aquatics','Outdoor Recreation','Sports Coaching','Sports Administration','Community Recreation','Event Management','Golf & Turf Management','Sports Medicine Support'],
        'Tourism': ['Travel Agencies','Tour Operations','Attractions & Theme Parks','Eco-Tourism','Adventure Tourism','Cultural Tourism','Cruise Operations','Tourism Marketing','Visitor Information Services','Indigenous Tourism'],
        'Transport': ['Road Transport','Rail Transport','Maritime Transport','Air Transport','Public Transport','Taxi & Rideshare','Courier Services','Bus Operations','Heavy Vehicle Operations','Transport Administration'],
        'Utilities': ['Electricity Generation','Electricity Distribution','Gas Distribution','Water Supply','Wastewater Treatment','Renewable Energy','Smart Grid','Meter Reading','Network Maintenance'],
        'Warehousing': ['General Warehousing','Cold Storage','Distribution Centres','Cross-Docking','Hazardous Goods Storage','Automated Warehousing','Order Fulfillment','Returns Processing','Inventory Control'],
        'Other': ['General Industry','Cross-Industry','Emerging Industry']
    };
    function getAiqIndustrySectors(industry) { return AIQ_INDUSTRY_SUBCATEGORIES[industry] || []; }
    // ----------------------------------------------------------------------------

    var SCREENS = [
        'entry',
        'source',
        'criteria',
        'allocation',
        'generation',
        'review',
        'summary'
    ];

    function Wizard(options) {
        this.container = null;
        this.currentScreen = 0;
        this.screenInstances = [];
        this.navButtons = {};

        this.data = {
            assessmentName: '',
            assessmentType: 'quiz',
            sourceType: '',
            unitCode: '',
            criteria: [],
            allocations: {},
            generatedQuestions: [],
            editedQuestions: [],
            // New: Language & Context Configuration
            language: 'en-AU',
            learningContext: 'vocational', // 'vocational' or 'academic'
            // Vocational-specific
            industry: '',
            industrySector: '',
            qualificationLevel: 'cert-iii',
            workplaceContext: 'both',
            // Academic-specific
            subjectArea: 'general',
            yearLevel: 'undergraduate',
            // Difficulty distribution
            difficultyMix: 'balanced', // 'balanced', 'easy-focused', 'hard-focused'
            // Question types to include (all enabled by default for MCQ, T/F, Short, Gap; others opt-in)
            enabledQuestionTypes: {
                mcq: true,
                truefalse: true,
                shortanswer: true,
                gapfill: true,
                ordering: false,
                matching: false,
                categorysort: false,
                numeric: false,
                dragtable: false,
                dragdrop: false,
                hotspot: false,
                essay: false
            }
        };
        
        // Question type definitions with labels and descriptions
        this.questionTypeInfo = {
            mcq: { label: 'MCQ', name: 'Multiple Choice', desc: '4 options, 1 correct answer' },
            truefalse: { label: 'T/F', name: 'True/False', desc: 'Binary true or false' },
            shortanswer: { label: 'Short', name: 'Short Answer', desc: 'Text input, exact match' },
            gapfill: { label: 'Gap', name: 'Fill the Gap', desc: 'Complete the sentence' },
            ordering: { label: 'Order', name: 'Ordering', desc: 'Put items in sequence' },
            matching: { label: 'Match', name: 'Matching', desc: 'Match pairs together' },
            categorysort: { label: 'Sort', name: 'Category Sort', desc: 'Sort items into groups' },
            numeric: { label: 'Num', name: 'Numeric', desc: 'Number with tolerance' },
            dragtable: { label: 'DragT', name: 'Drag Table', desc: 'Drag into table cells' },
            dragdrop: { label: 'D&D', name: 'Drag & Drop', desc: 'Drag onto targets' },
            hotspot: { label: 'Hot', name: 'Hotspot', desc: 'Click on image area' },
            essay: { label: 'Essay', name: 'Essay', desc: 'Long-form response' }
        };

        // 52 Chirp 3 HD supported languages
        this.languages = [
            { code: 'en-AU', name: 'English (Australia)', flag: '[AU]' },
            { code: 'en-US', name: 'English (United States)', flag: '[US]' },
            { code: 'en-GB', name: 'English (United Kingdom)', flag: '[GB]' },
            { code: 'en-IN', name: 'English (India)', flag: '[IN]' },
            { code: 'af-ZA', name: 'Afrikaans', flag: '[ZA]' },
            { code: 'ar-XA', name: 'Arabic', flag: '[SA]' },
            { code: 'bg-BG', name: 'Bulgarian', flag: '[BG]' },
            { code: 'bn-IN', name: 'Bengali', flag: '[IN]' },
            { code: 'ca-ES', name: 'Catalan', flag: '[ES]' },
            { code: 'cs-CZ', name: 'Czech', flag: '[CZ]' },
            { code: 'da-DK', name: 'Danish', flag: '[DK]' },
            { code: 'de-DE', name: 'German', flag: '[DE]' },
            { code: 'el-GR', name: 'Greek', flag: '[GR]' },
            { code: 'es-ES', name: 'Spanish (Spain)', flag: '[ES]' },
            { code: 'es-US', name: 'Spanish (United States)', flag: '[US]' },
            { code: 'et-EE', name: 'Estonian', flag: '[EE]' },
            { code: 'eu-ES', name: 'Basque', flag: '[ES]' },
            { code: 'fi-FI', name: 'Finnish', flag: '[FI]' },
            { code: 'fil-PH', name: 'Filipino', flag: '[PH]' },
            { code: 'fr-CA', name: 'French (Canada)', flag: '[CA]' },
            { code: 'fr-FR', name: 'French (France)', flag: '[FR]' },
            { code: 'gl-ES', name: 'Galician', flag: '[ES]' },
            { code: 'gu-IN', name: 'Gujarati', flag: '[IN]' },
            { code: 'he-IL', name: 'Hebrew', flag: '[IL]' },
            { code: 'hi-IN', name: 'Hindi', flag: '[IN]' },
            { code: 'hu-HU', name: 'Hungarian', flag: '[HU]' },
            { code: 'id-ID', name: 'Indonesian', flag: '[ID]' },
            { code: 'is-IS', name: 'Icelandic', flag: '[IS]' },
            { code: 'it-IT', name: 'Italian', flag: '[IT]' },
            { code: 'ja-JP', name: 'Japanese', flag: '[JP]' },
            { code: 'kn-IN', name: 'Kannada', flag: '[IN]' },
            { code: 'ko-KR', name: 'Korean', flag: '[KR]' },
            { code: 'lt-LT', name: 'Lithuanian', flag: '[LT]' },
            { code: 'lv-LV', name: 'Latvian', flag: '[LV]' },
            { code: 'ml-IN', name: 'Malayalam', flag: '[IN]' },
            { code: 'mr-IN', name: 'Marathi', flag: '[IN]' },
            { code: 'ms-MY', name: 'Malay', flag: '[MY]' },
            { code: 'nb-NO', name: 'Norwegian', flag: '[NO]' },
            { code: 'nl-BE', name: 'Dutch (Belgium)', flag: '[BE]' },
            { code: 'nl-NL', name: 'Dutch (Netherlands)', flag: '[NL]' },
            { code: 'pa-IN', name: 'Punjabi', flag: '[IN]' },
            { code: 'pl-PL', name: 'Polish', flag: '[PL]' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '[BR]' },
            { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '[PT]' },
            { code: 'ro-RO', name: 'Romanian', flag: '[RO]' },
            { code: 'ru-RU', name: 'Russian', flag: '[RU]' },
            { code: 'sk-SK', name: 'Slovak', flag: '[SK]' },
            { code: 'sl-SI', name: 'Slovenian', flag: '[SI]' },
            { code: 'sr-RS', name: 'Serbian', flag: '[RS]' },
            { code: 'sv-SE', name: 'Swedish', flag: '[SE]' },
            { code: 'ta-IN', name: 'Tamil', flag: '[IN]' },
            { code: 'te-IN', name: 'Telugu', flag: '[IN]' },
            { code: 'th-TH', name: 'Thai', flag: '[TH]' },
            { code: 'tr-TR', name: 'Turkish', flag: '[TR]' },
            { code: 'uk-UA', name: 'Ukrainian', flag: '[UA]' },
            { code: 'vi-VN', name: 'Vietnamese', flag: '[VN]' },
            { code: 'yue-HK', name: 'Cantonese', flag: '[HK]' },
            { code: 'zh-CN', name: 'Chinese (Mandarin)', flag: '[CN]' },
            { code: 'zh-TW', name: 'Chinese (Taiwan)', flag: '[TW]' }
        ];

        // Industry list for vocational (matches Content Creator  -  update all plugins together)
        this.industries = AIQ_INDUSTRIES.map(function(name) { return { id: name, name: name }; });

        // Academic subject areas
        this.subjectAreas = [
            { id: 'general', name: 'General / Cross-Disciplinary' },
            { id: 'science', name: 'Science' },
            { id: 'mathematics', name: 'Mathematics' },
            { id: 'business', name: 'Business & Economics' },
            { id: 'humanities', name: 'Humanities & Social Sciences' },
            { id: 'arts', name: 'Arts & Design' },
            { id: 'health', name: 'Health Sciences' },
            { id: 'engineering', name: 'Engineering' },
            { id: 'law', name: 'Law & Legal Studies' },
            { id: 'languages', name: 'Languages & Literature' }
        ];

        this.options = Object.assign({
            containerId: 'aiq-authoring-container',
            quizId: null,
            cmid: null
        }, options);
    }

    Wizard.prototype.init = function() {
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('Authoring container not found:', this.options.containerId);
            return;
        }

        this.render();
        this.goToScreen(0);

        return this;
    };

    Wizard.prototype.render = function() {
        this.container.innerHTML = '';
        this.container.className = 'aiq-container aiq-authoring';

        // Skip link for accessibility
        var skipLink = document.createElement('a');
        skipLink.href = '#aiq-wizard-content';
        skipLink.className = 'aiq-skip-link';
        skipLink.textContent = 'Skip to main content';
        this.container.appendChild(skipLink);

        // Live region for screen reader announcements
        var liveRegion = document.createElement('div');
        liveRegion.className = 'aiq-live-region';
        liveRegion.id = 'aiq-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        this.container.appendChild(liveRegion);

        var main = document.createElement('div');
        main.className = 'aiq-main';
        main.setAttribute('role', 'main');

        var header = this.renderHeader();
        main.appendChild(header);

        var steps = this.renderSteps();
        main.appendChild(steps);

        var content = document.createElement('div');
        content.className = 'aiq-wizard-content';
        content.id = 'aiq-wizard-content';
        content.setAttribute('role', 'region');
        content.setAttribute('aria-label', 'Wizard step content');
        content.setAttribute('tabindex', '-1');
        main.appendChild(content);

        var nav = this.renderNav();
        main.appendChild(nav);

        this.container.appendChild(main);

        // Keyboard navigation
        this.setupKeyboardNav();
    };

    Wizard.prototype.setupKeyboardNav = function() {
        var self = this;
        
        document.addEventListener('keydown', function(e) {
            // Only when wizard is active
            if (!self.container || !self.container.contains(document.activeElement)) {
                return;
            }

            // Arrow keys for step navigation (when on step indicators)
            if (document.activeElement.classList.contains('aiq-wizard-step')) {
                if (e.key === 'ArrowRight' && self.currentScreen < SCREENS.length - 1) {
                    e.preventDefault();
                    var nextStep = document.querySelector('[data-step="' + (self.currentScreen + 1) + '"]');
                    if (nextStep) nextStep.focus();
                } else if (e.key === 'ArrowLeft' && self.currentScreen > 0) {
                    e.preventDefault();
                    var prevStep = document.querySelector('[data-step="' + (self.currentScreen - 1) + '"]');
                    if (prevStep) prevStep.focus();
                }
            }

            // Enter/Space on focused interactive elements
            if (e.key === 'Enter' || e.key === ' ') {
                if (document.activeElement.classList.contains('aiq-source-card') ||
                    document.activeElement.classList.contains('aiq-qtype-card')) {
                    e.preventDefault();
                    document.activeElement.click();
                }
            }
        });
    };

    Wizard.prototype.announce = function(message) {
        var liveRegion = document.getElementById('aiq-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    };

    Wizard.prototype.renderHeader = function() {
        var header = document.createElement('div');
        header.className = 'aiq-wizard-header';

        var title = document.createElement('h1');
        title.className = 'aiq-wizard-title';
        title.textContent = 'AI Quiz Maker';
        header.appendChild(title);

        var subtitle = document.createElement('p');
        subtitle.className = 'aiq-wizard-subtitle';
        subtitle.textContent = 'Create criterion-based assessments with AI assistance';
        header.appendChild(subtitle);

        return header;
    };

    Wizard.prototype.renderSteps = function() {
        var self = this;
        var steps = document.createElement('div');
        steps.className = 'aiq-wizard-steps';
        steps.id = 'aiq-wizard-steps';
        steps.setAttribute('role', 'navigation');
        steps.setAttribute('aria-label', 'Wizard progress');

        var stepLabels = [
            'Setup',
            'Source',
            'Criteria',
            'Allocate',
            'Generate',
            'Review',
            'Summary'
        ];

        stepLabels.forEach(function(label, index) {
            var step = document.createElement('div');
            step.className = 'aiq-wizard-step';
            step.setAttribute('data-step', index);
            step.setAttribute('role', 'button');
            step.setAttribute('tabindex', '0');
            step.setAttribute('aria-label', 'Step ' + (index + 1) + ': ' + label);

            var number = document.createElement('span');
            number.className = 'aiq-wizard-step__number';
            number.textContent = index + 1;
            number.setAttribute('aria-hidden', 'true');
            step.appendChild(number);

            var text = document.createElement('span');
            text.className = 'aiq-wizard-step__text';
            text.textContent = label;
            step.appendChild(text);

            steps.appendChild(step);
        });

        return steps;
    };

    Wizard.prototype.renderNav = function() {
        var nav = document.createElement('div');
        nav.className = 'aiq-wizard-nav';

        this.navButtons.back = new Button({
            id: 'wizard-back',
            text: 'Back',
            variant: 'secondary'
        });
        this.navButtons.back.onClick = this.prev.bind(this);
        nav.appendChild(this.navButtons.back.render());

        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        nav.appendChild(spacer);

        this.navButtons.next = new Button({
            id: 'wizard-next',
            text: 'Continue',
            variant: 'default'
        });
        this.navButtons.next.onClick = this.next.bind(this);
        nav.appendChild(this.navButtons.next.render());

        return nav;
    };

    Wizard.prototype.goToScreen = function(index) {
        var self = this;

        if (index < 0 || index >= SCREENS.length) return;

        var stepLabels = ['Setup', 'Source', 'Criteria', 'Allocate', 'Generate', 'Review', 'Summary'];
        this.announce('Step ' + (index + 1) + ' of ' + SCREENS.length + ': ' + stepLabels[index]);

        this.updateSteps(index);

        var content = document.getElementById('aiq-wizard-content');
        if (content.children.length > 0) {
            Animations.fadeOutDown(content.firstChild).then(function() {
                content.innerHTML = '';
                self.renderScreen(index, content);
                // Focus content for screen readers
                content.focus();
            });
        } else {
            this.renderScreen(index, content);
            content.focus();
        }

        this.currentScreen = index;
        this.updateNavButtons();
    };

    Wizard.prototype.renderScreen = function(index, container) {
        var screen;

        switch (SCREENS[index]) {
            case 'entry':
                screen = this.renderEntryScreen();
                break;
            case 'source':
                screen = this.renderSourceScreen();
                break;
            case 'criteria':
                screen = this.renderCriteriaScreen();
                break;
            case 'allocation':
                screen = this.renderAllocationScreen();
                break;
            case 'generation':
                screen = this.renderGenerationScreen();
                break;
            case 'review':
                screen = this.renderReviewScreen();
                break;
            case 'summary':
                screen = this.renderSummaryScreen();
                break;
            default:
                screen = document.createElement('div');
                screen.textContent = 'Unknown screen';
        }

        container.appendChild(screen);
        Animations.fadeInUp(screen);
    };

    Wizard.prototype.renderEntryScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--entry';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Create New Assessment';
        screen.appendChild(title);

        var form = document.createElement('div');
        form.className = 'aiq-form';

        var nameGroup = document.createElement('div');
        nameGroup.className = 'aiq-form-group';

        var nameLabel = document.createElement('label');
        nameLabel.className = 'aiq-label';
        nameLabel.textContent = 'Assessment Name';
        nameGroup.appendChild(nameLabel);

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'aiq-input';
        nameInput.placeholder = 'e.g., WHS Hazard Identification Quiz';
        nameInput.value = this.data.assessmentName;
        nameInput.addEventListener('input', function() {
            self.data.assessmentName = nameInput.value;
        });
        nameGroup.appendChild(nameInput);

        form.appendChild(nameGroup);

        var typeGroup = document.createElement('div');
        typeGroup.className = 'aiq-form-group';

        var typeLabel = document.createElement('label');
        typeLabel.className = 'aiq-label';
        typeLabel.textContent = 'Assessment Type';
        typeGroup.appendChild(typeLabel);

        var types = [
            { id: 'quiz', label: 'Quiz', desc: 'Mixed question types, instant feedback' },
            { id: 'knowledge_check', label: 'Knowledge Check', desc: 'Quick verification, pre/post training' },
            { id: 'summative', label: 'Summative Assessment', desc: 'Formal assessment, evidence collection' }
        ];

        var typeCards = document.createElement('div');
        typeCards.className = 'aiq-type-cards';

        types.forEach(function(type) {
            var card = document.createElement('div');
            card.className = 'aiq-type-card';
            if (self.data.assessmentType === type.id) {
                card.classList.add('aiq-type-card--selected');
            }

            card.addEventListener('click', function() {
                self.data.assessmentType = type.id;
                typeCards.querySelectorAll('.aiq-type-card').forEach(function(c) {
                    c.classList.remove('aiq-type-card--selected');
                });
                card.classList.add('aiq-type-card--selected');
            });

            var cardTitle = document.createElement('div');
            cardTitle.className = 'aiq-type-card__title';
            cardTitle.textContent = type.label;
            card.appendChild(cardTitle);

            var cardDesc = document.createElement('div');
            cardDesc.className = 'aiq-type-card__desc';
            cardDesc.textContent = type.desc;
            card.appendChild(cardDesc);

            typeCards.appendChild(card);
        });

        typeGroup.appendChild(typeCards);
        form.appendChild(typeGroup);

        // Language Selection
        var langGroup = document.createElement('div');
        langGroup.className = 'aiq-form-group';

        var langLabel = document.createElement('label');
        langLabel.className = 'aiq-label';
        langLabel.textContent = 'Question Language';
        langGroup.appendChild(langLabel);

        var langSelect = document.createElement('select');
        langSelect.className = 'aiq-select';
        langSelect.id = 'aiq-language-select';

        this.languages.forEach(function(lang) {
            var option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.flag + ' ' + lang.name;
            if (lang.code === self.data.language) {
                option.selected = true;
            }
            langSelect.appendChild(option);
        });

        langSelect.addEventListener('change', function() {
            self.data.language = langSelect.value;
        });

        langGroup.appendChild(langSelect);
        form.appendChild(langGroup);

        // Learning Context Toggle (Vocational / Academic)
        var contextGroup = document.createElement('div');
        contextGroup.className = 'aiq-form-group';

        var contextLabel = document.createElement('label');
        contextLabel.className = 'aiq-label';
        contextLabel.textContent = 'Learning Context';
        contextGroup.appendChild(contextLabel);

        var contextCards = document.createElement('div');
        contextCards.className = 'aiq-context-cards';

        var contexts = [
            { id: 'vocational', label: 'Vocational (VET/RTO)', desc: 'Workplace-focused, competency-based training' },
            { id: 'academic', label: 'Academic', desc: 'School, college, or university learning' }
        ];

        contexts.forEach(function(ctx) {
            var card = document.createElement('div');
            card.className = 'aiq-context-card';
            card.setAttribute('data-context', ctx.id);
            if (self.data.learningContext === ctx.id) {
                card.classList.add('aiq-context-card--selected');
            }

            card.addEventListener('click', function() {
                self.data.learningContext = ctx.id;
                contextCards.querySelectorAll('.aiq-context-card').forEach(function(c) {
                    c.classList.remove('aiq-context-card--selected');
                });
                card.classList.add('aiq-context-card--selected');
                self.updateContextFields();
            });

            var cardTitle = document.createElement('div');
            cardTitle.className = 'aiq-context-card__title';
            cardTitle.textContent = ctx.label;
            card.appendChild(cardTitle);

            var cardDesc = document.createElement('div');
            cardDesc.className = 'aiq-context-card__desc';
            cardDesc.textContent = ctx.desc;
            card.appendChild(cardDesc);

            contextCards.appendChild(card);
        });

        contextGroup.appendChild(contextCards);
        form.appendChild(contextGroup);

        // Context-specific fields container
        var contextFields = document.createElement('div');
        contextFields.className = 'aiq-context-fields';
        contextFields.id = 'aiq-context-fields';
        form.appendChild(contextFields);

        // Difficulty Mix
        var diffGroup = document.createElement('div');
        diffGroup.className = 'aiq-form-group';

        var diffLabel = document.createElement('label');
        diffLabel.className = 'aiq-label';
        diffLabel.textContent = 'Difficulty Distribution';
        diffGroup.appendChild(diffLabel);

        var diffSelect = document.createElement('select');
        diffSelect.className = 'aiq-select';

        var diffOptions = [
            { id: 'balanced', name: 'Balanced (30% Easy, 50% Medium, 20% Hard)' },
            { id: 'easy-focused', name: 'Easy-Focused (50% Easy, 40% Medium, 10% Hard)' },
            { id: 'hard-focused', name: 'Challenging (20% Easy, 40% Medium, 40% Hard)' }
        ];

        diffOptions.forEach(function(opt) {
            var option = document.createElement('option');
            option.value = opt.id;
            option.textContent = opt.name;
            if (opt.id === self.data.difficultyMix) {
                option.selected = true;
            }
            diffSelect.appendChild(option);
        });

        diffSelect.addEventListener('change', function() {
            self.data.difficultyMix = diffSelect.value;
        });

        diffGroup.appendChild(diffSelect);
        form.appendChild(diffGroup);

        screen.appendChild(form);

        // Initialize context fields
        setTimeout(function() {
            self.updateContextFields();
        }, 0);

        return screen;
    };

    Wizard.prototype.updateContextFields = function() {
        var self = this;
        var container = document.getElementById('aiq-context-fields');
        if (!container) return;

        container.innerHTML = '';

        if (this.data.learningContext === 'vocational') {
            // Industry selector
            var industryGroup = document.createElement('div');
            industryGroup.className = 'aiq-form-group aiq-form-group--inline';

            var industryLabel = document.createElement('label');
            industryLabel.className = 'aiq-label';
            industryLabel.textContent = 'Industry';
            industryGroup.appendChild(industryLabel);

            var industrySelect = document.createElement('select');
            industrySelect.className = 'aiq-select';

            var industryPlaceholder = document.createElement('option');
            industryPlaceholder.value = '';
            industryPlaceholder.textContent = 'Select industry...';
            industrySelect.appendChild(industryPlaceholder);

            this.industries.forEach(function(ind) {
                var option = document.createElement('option');
                option.value = ind.id;
                option.textContent = ind.name;
                if (ind.id === self.data.industry) {
                    option.selected = true;
                }
                industrySelect.appendChild(option);
            });

            industryGroup.appendChild(industrySelect);
            container.appendChild(industryGroup);

            // Sector selector (populated when industry is chosen)
            var sectorGroup = document.createElement('div');
            sectorGroup.className = 'aiq-form-group aiq-form-group--inline';

            var sectorLabel = document.createElement('label');
            sectorLabel.className = 'aiq-label';
            sectorLabel.textContent = 'Sector';
            sectorGroup.appendChild(sectorLabel);

            var sectorSelect = document.createElement('select');
            sectorSelect.className = 'aiq-select';
            sectorSelect.disabled = true;
            var sectorPlaceholder = document.createElement('option');
            sectorPlaceholder.value = '';
            sectorPlaceholder.textContent = 'Select sector (optional)...';
            sectorSelect.appendChild(sectorPlaceholder);
            sectorGroup.appendChild(sectorSelect);
            container.appendChild(sectorGroup);

            function populateAiqSectors(industry) {
                sectorSelect.innerHTML = '';
                var ph = document.createElement('option');
                ph.value = ''; ph.textContent = 'Select sector (optional)...';
                sectorSelect.appendChild(ph);
                var sectors = getAiqIndustrySectors(industry);
                sectors.forEach(function(s) {
                    var opt = document.createElement('option');
                    opt.value = s; opt.textContent = s;
                    if (s === self.data.industrySector) { opt.selected = true; }
                    sectorSelect.appendChild(opt);
                });
                sectorSelect.disabled = sectors.length === 0;
            }

            // Initialise sectors if industry already selected
            if (self.data.industry) { populateAiqSectors(self.data.industry); }

            industrySelect.addEventListener('change', function() {
                self.data.industry = industrySelect.value;
                self.data.industrySector = '';
                populateAiqSectors(industrySelect.value);
            });

            sectorSelect.addEventListener('change', function() {
                self.data.industrySector = sectorSelect.value;
            });

            // Qualification Level
            var qualGroup = document.createElement('div');
            qualGroup.className = 'aiq-form-group aiq-form-group--inline';

            var qualLabel = document.createElement('label');
            qualLabel.className = 'aiq-label';
            qualLabel.textContent = 'Qualification Level';
            qualGroup.appendChild(qualLabel);

            var qualSelect = document.createElement('select');
            qualSelect.className = 'aiq-select';

            var qualLevels = [
                { id: 'cert-i', name: 'Certificate I' },
                { id: 'cert-ii', name: 'Certificate II' },
                { id: 'cert-iii', name: 'Certificate III' },
                { id: 'cert-iv', name: 'Certificate IV' },
                { id: 'diploma', name: 'Diploma' },
                { id: 'adv-diploma', name: 'Advanced Diploma' }
            ];

            qualLevels.forEach(function(q) {
                var option = document.createElement('option');
                option.value = q.id;
                option.textContent = q.name;
                if (q.id === self.data.qualificationLevel) {
                    option.selected = true;
                }
                qualSelect.appendChild(option);
            });

            qualSelect.addEventListener('change', function() {
                self.data.qualificationLevel = qualSelect.value;
            });

            qualGroup.appendChild(qualSelect);
            container.appendChild(qualGroup);

            // Workplace Context
            var workGroup = document.createElement('div');
            workGroup.className = 'aiq-form-group aiq-form-group--inline';

            var workLabel = document.createElement('label');
            workLabel.className = 'aiq-label';
            workLabel.textContent = 'Workplace Setting';
            workGroup.appendChild(workLabel);

            var workSelect = document.createElement('select');
            workSelect.className = 'aiq-select';

            var workSettings = [
                { id: 'both', name: 'Office & Site (Mixed)' },
                { id: 'office', name: 'Office / Indoor' },
                { id: 'site', name: 'Construction Site / Outdoor' },
                { id: 'workshop', name: 'Workshop / Factory' },
                { id: 'healthcare', name: 'Healthcare Facility' },
                { id: 'retail', name: 'Retail / Customer Service' }
            ];

            workSettings.forEach(function(w) {
                var option = document.createElement('option');
                option.value = w.id;
                option.textContent = w.name;
                if (w.id === self.data.workplaceContext) {
                    option.selected = true;
                }
                workSelect.appendChild(option);
            });

            workSelect.addEventListener('change', function() {
                self.data.workplaceContext = workSelect.value;
            });

            workGroup.appendChild(workSelect);
            container.appendChild(workGroup);

        } else if (this.data.learningContext === 'academic') {
            // Subject Area
            var subjectGroup = document.createElement('div');
            subjectGroup.className = 'aiq-form-group aiq-form-group--inline';

            var subjectLabel = document.createElement('label');
            subjectLabel.className = 'aiq-label';
            subjectLabel.textContent = 'Subject Area';
            subjectGroup.appendChild(subjectLabel);

            var subjectSelect = document.createElement('select');
            subjectSelect.className = 'aiq-select';

            this.subjectAreas.forEach(function(s) {
                var option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                if (s.id === self.data.subjectArea) {
                    option.selected = true;
                }
                subjectSelect.appendChild(option);
            });

            subjectSelect.addEventListener('change', function() {
                self.data.subjectArea = subjectSelect.value;
            });

            subjectGroup.appendChild(subjectSelect);
            container.appendChild(subjectGroup);

            // Year Level
            var yearGroup = document.createElement('div');
            yearGroup.className = 'aiq-form-group aiq-form-group--inline';

            var yearLabel = document.createElement('label');
            yearLabel.className = 'aiq-label';
            yearLabel.textContent = 'Year Level';
            yearGroup.appendChild(yearLabel);

            var yearSelect = document.createElement('select');
            yearSelect.className = 'aiq-select';

            var yearLevels = [
                { id: 'year-7-8', name: 'Year 7-8 (Junior Secondary)' },
                { id: 'year-9-10', name: 'Year 9-10 (Middle Secondary)' },
                { id: 'year-11-12', name: 'Year 11-12 (Senior Secondary)' },
                { id: 'undergraduate', name: 'Undergraduate' },
                { id: 'postgraduate', name: 'Postgraduate' }
            ];

            yearLevels.forEach(function(y) {
                var option = document.createElement('option');
                option.value = y.id;
                option.textContent = y.name;
                if (y.id === self.data.yearLevel) {
                    option.selected = true;
                }
                yearSelect.appendChild(option);
            });

            yearSelect.addEventListener('change', function() {
                self.data.yearLevel = yearSelect.value;
            });

            yearGroup.appendChild(yearSelect);
            container.appendChild(yearGroup);
        }
    };

    Wizard.prototype.renderSourceScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--source';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Choose Criteria Source';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'Select where your assessment criteria come from:';
        screen.appendChild(desc);

        var sources = [
            { 
                id: 'tga', 
                label: 'Training.gov.au', 
                desc: 'Import unit of competency from training.gov.au',
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
            },
            { 
                id: 'paste', 
                label: 'Paste Criteria', 
                desc: 'Paste your own criteria or learning outcomes',
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>'
            }
        ];

        var sourceCards = document.createElement('div');
        sourceCards.className = 'aiq-source-cards';

        sources.forEach(function(source) {
            var card = document.createElement('div');
            card.className = 'aiq-source-card';
            if (self.data.sourceType === source.id) {
                card.classList.add('aiq-source-card--selected');
            }

            card.addEventListener('click', function() {
                self.data.sourceType = source.id;
                sourceCards.querySelectorAll('.aiq-source-card').forEach(function(c) {
                    c.classList.remove('aiq-source-card--selected');
                });
                card.classList.add('aiq-source-card--selected');
                self.updateSourceForm();
            });

            var icon = document.createElement('div');
            icon.className = 'aiq-source-card__icon';
            icon.innerHTML = source.icon;
            card.appendChild(icon);

            var cardTitle = document.createElement('div');
            cardTitle.className = 'aiq-source-card__title';
            cardTitle.textContent = source.label;
            card.appendChild(cardTitle);

            var cardDesc = document.createElement('div');
            cardDesc.className = 'aiq-source-card__desc';
            cardDesc.textContent = source.desc;
            card.appendChild(cardDesc);

            sourceCards.appendChild(card);
        });

        screen.appendChild(sourceCards);

        var sourceForm = document.createElement('div');
        sourceForm.className = 'aiq-source-form';
        sourceForm.id = 'aiq-source-form';
        screen.appendChild(sourceForm);

        setTimeout(function() {
            self.updateSourceForm();
        }, 0);

        return screen;
    };

    Wizard.prototype.updateSourceForm = function() {
        var self = this;
        var form = document.getElementById('aiq-source-form');
        if (!form) return;

        form.innerHTML = '';

        if (this.data.sourceType === 'tga') {
            var group = document.createElement('div');
            group.className = 'aiq-form-group';

            var label = document.createElement('label');
            label.className = 'aiq-label';
            label.textContent = 'Unit Code';
            group.appendChild(label);

            var inputWrapper = document.createElement('div');
            inputWrapper.className = 'aiq-input-wrapper';

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'aiq-input';
            input.placeholder = 'e.g., BSBWHS411';
            input.value = this.data.unitCode;
            input.addEventListener('input', function() {
                self.data.unitCode = input.value.toUpperCase();
                input.value = self.data.unitCode;
            });
            inputWrapper.appendChild(input);

            var searchBtn = new Button({
                id: 'search-tga',
                text: 'Search',
                variant: 'default',
                size: 'small'
            });
            searchBtn.onClick = function() {
                self.searchTGA();
            };
            inputWrapper.appendChild(searchBtn.render());

            group.appendChild(inputWrapper);

            var hint = document.createElement('div');
            hint.className = 'aiq-hint';
            hint.textContent = 'Enter a valid training.gov.au unit code';
            group.appendChild(hint);

            form.appendChild(group);

            var results = document.createElement('div');
            results.className = 'aiq-tga-results';
            results.id = 'aiq-tga-results';
            form.appendChild(results);

        } else if (this.data.sourceType === 'paste') {
            var group = document.createElement('div');
            group.className = 'aiq-form-group';

            var label = document.createElement('label');
            label.className = 'aiq-label';
            label.textContent = 'Paste Criteria';
            group.appendChild(label);

            var textarea = document.createElement('textarea');
            textarea.className = 'aiq-textarea';
            textarea.rows = 10;
            textarea.placeholder = 'Paste your criteria, learning outcomes, or performance criteria here...\n\nEach line will be treated as a separate criterion.\n\nExample:\n- Identify workplace hazards\n- Report hazards to supervisor\n- Apply risk controls';

            var criteriaText = this.data.criteria.map(function(c) {
                return c.text;
            }).join('\n');
            textarea.value = criteriaText;

            textarea.addEventListener('input', function() {
                self.parsePastedCriteria(textarea.value);
            });

            group.appendChild(textarea);
            form.appendChild(group);
        }

        Animations.fadeInUp(form);
    };

    Wizard.prototype.searchTGA = function() {
        var self = this;
        var results = document.getElementById('aiq-tga-results');
        if (!results) return;

        results.innerHTML = '<div class="aiq-loading">Searching training.gov.au...</div>';

        Api.request('lookup_unit', { unitcode: this.data.unitCode })
            .then(function(data) {
                self.data.criteria = self.parseTGACriteria(data);
                self.showTGAResults(data, results);
            })
            .catch(function(error) {
                results.innerHTML = '<div class="aiq-error">Unit not found: ' + error.message + '</div>';
            });
    };

    Wizard.prototype.parseTGACriteria = function(data) {
        var criteria = [];
        var pcIndex = 0;
        var peIndex = 0;
        var keIndex = 0;

        // Extract ALL Performance Criteria from elements
        if (data.elements) {
            data.elements.forEach(function(element, elementIdx) {
                // Parse element number from code (e.g., "E1" -> 1) or use index+1
                var elementNum = 1;
                if (element.code) {
                    var match = element.code.match(/\d+/);
                    if (match) {
                        elementNum = parseInt(match[0], 10);
                    } else {
                        elementNum = elementIdx + 1;
                    }
                } else {
                    elementNum = elementIdx + 1;
                }
                
                if (element.performanceCriteria) {
                    element.performanceCriteria.forEach(function(pc, pcIdx) {
                        var pcText = typeof pc === 'string' ? pc : (pc.name || pc.text || '');
                        
                        if (pcText) {
                            // Clean up: remove leading numbers like "1.1 " and format nicely
                            var cleanText = pcText.replace(/^\d+\.\d+\s*/, '').trim();
                            // Capitalize first letter
                            cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
                            
                            criteria.push({
                                id: 'pc-' + (++pcIndex),
                                code: '',
                                text: cleanText,
                                elementCode: element.code,
                                elementName: element.name,
                                elementNumber: elementNum,
                                pcNumber: pcIdx + 1,
                                tgaNumber: elementNum + '.' + (pcIdx + 1),
                                type: 'performance'
                            });
                        }
                    });
                }
            });
        }

        // Extract Performance Evidence
        if (data.performanceEvidence && data.performanceEvidence.length > 0) {
            data.performanceEvidence.forEach(function(pe) {
                var peText = typeof pe === 'string' ? pe : (pe.text || pe.name || '');
                if (peText) {
                    var cleanText = peText.replace(/^[\d.)\-*\s]+/, '').trim();
                    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
                    criteria.push({
                        id: 'pe-' + (++peIndex),
                        code: '',
                        text: cleanText,
                        type: 'performanceEvidence'
                    });
                }
            });
        }

        // Extract Knowledge Evidence
        if (data.knowledgeEvidence && data.knowledgeEvidence.length > 0) {
            data.knowledgeEvidence.forEach(function(ke) {
                var keText = typeof ke === 'string' ? ke : (ke.text || ke.name || '');
                if (keText) {
                    var cleanText = keText.replace(/^[\d.)\-*\s]+/, '').trim();
                    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
                    criteria.push({
                        id: 'ke-' + (++keIndex),
                        code: '',
                        text: cleanText,
                        type: 'knowledge'
                    });
                }
            });
        }

        return criteria;
    };

    Wizard.prototype.showTGAResults = function(data, container) {
        container.innerHTML = '';

        var card = document.createElement('div');
        card.className = 'aiq-tga-result-card';

        var header = document.createElement('div');
        header.className = 'aiq-tga-result__header';

        var code = document.createElement('span');
        code.className = 'aiq-tga-result__code';
        code.textContent = data.code;
        header.appendChild(code);

        var title = document.createElement('span');
        title.className = 'aiq-tga-result__title';
        title.textContent = data.title;
        header.appendChild(title);

        card.appendChild(header);

        var stats = document.createElement('div');
        stats.className = 'aiq-tga-result__stats';
        var criteriaType = (data.knowledgeEvidence && data.knowledgeEvidence.length > 0) ? 'knowledge criteria' : 'criteria';
        stats.innerHTML = '<strong>' + this.data.criteria.length + '</strong> ' + criteriaType + ' found for quiz generation';
        card.appendChild(stats);

        container.appendChild(card);
        Animations.fadeInUp(card);
    };

    Wizard.prototype.parsePastedCriteria = function(text) {
        var self = this;
        var lines = text.split('\n').filter(function(line) {
            return line.trim().length > 0;
        });

        this.data.criteria = lines.map(function(line, index) {
            var cleaned = line.replace(/^[-**\d.)\s]+/, '').trim();
            return {
                id: 'custom-' + (index + 1),
                code: '',
                text: cleaned,
                type: 'custom'
            };
        });
    };

    Wizard.prototype.renderCriteriaScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--criteria';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Review Criteria';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'Select which criteria types to include, then review and edit them:';
        screen.appendChild(desc);

        // Criteria type filter checkboxes
        var filterSection = document.createElement('div');
        filterSection.className = 'aiq-criteria-filters';
        filterSection.innerHTML = [
            '<div class="aiq-criteria-filters__title">Include criteria from:</div>',
            '<div class="aiq-criteria-filters__options">',
            '  <label class="aiq-criteria-filter">',
            '    <input type="checkbox" id="aiq-filter-pc" checked data-type="performance">',
            '    <span class="aiq-criteria-filter__badge aiq-type-performance">PC</span>',
            '    <span class="aiq-criteria-filter__label">Performance Criteria</span>',
            '    <span class="aiq-criteria-filter__count" id="aiq-count-pc">0</span>',
            '  </label>',
            '  <label class="aiq-criteria-filter">',
            '    <input type="checkbox" id="aiq-filter-pe" checked data-type="performanceEvidence">',
            '    <span class="aiq-criteria-filter__badge aiq-type-evidence">PE</span>',
            '    <span class="aiq-criteria-filter__label">Performance Evidence</span>',
            '    <span class="aiq-criteria-filter__count" id="aiq-count-pe">0</span>',
            '  </label>',
            '  <label class="aiq-criteria-filter">',
            '    <input type="checkbox" id="aiq-filter-ke" checked data-type="knowledge">',
            '    <span class="aiq-criteria-filter__badge aiq-type-knowledge">KE</span>',
            '    <span class="aiq-criteria-filter__label">Knowledge Evidence</span>',
            '    <span class="aiq-criteria-filter__count" id="aiq-count-ke">0</span>',
            '  </label>',
            '</div>'
        ].join('\n');
        screen.appendChild(filterSection);

        // Bind filter change events
        filterSection.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                self.updateCriteriaDisplay();
            });
        });

        // Criteria list container
        var listContainer = document.createElement('div');
        listContainer.className = 'aiq-criteria-grouped';
        listContainer.id = 'aiq-criteria-grouped';
        screen.appendChild(listContainer);

        // Initial render of grouped criteria
        this.renderGroupedCriteria(listContainer);

        return screen;
    };

    Wizard.prototype.renderGroupedCriteria = function(container) {
        var self = this;
        container.innerHTML = '';

        // Get filter states
        var showPC = document.getElementById('aiq-filter-pc');
        var showPE = document.getElementById('aiq-filter-pe');
        var showKE = document.getElementById('aiq-filter-ke');

        var includePC = showPC ? showPC.checked : true;
        var includePE = showPE ? showPE.checked : true;
        var includeKE = showKE ? showKE.checked : true;

        // Group criteria by type
        var performanceCriteria = [];
        var performanceEvidence = [];
        var knowledgeEvidence = [];

        this.data.criteria.forEach(function(criterion) {
            if (criterion.type === 'performance' || (!criterion.type && criterion.code && criterion.code.match(/^\d+\.\d+/))) {
                performanceCriteria.push(criterion);
            } else if (criterion.type === 'performanceEvidence' || criterion.type === 'evidence') {
                performanceEvidence.push(criterion);
            } else if (criterion.type === 'knowledge') {
                knowledgeEvidence.push(criterion);
            } else {
                // Default to performance criteria for custom/unknown types
                performanceCriteria.push(criterion);
            }
        });

        // Update counts
        var countPC = document.getElementById('aiq-count-pc');
        var countPE = document.getElementById('aiq-count-pe');
        var countKE = document.getElementById('aiq-count-ke');
        if (countPC) countPC.textContent = performanceCriteria.length;
        if (countPE) countPE.textContent = performanceEvidence.length;
        if (countKE) countKE.textContent = knowledgeEvidence.length;

        var globalIndex = 0;

        // Render Performance Criteria section
        if (includePC && performanceCriteria.length > 0) {
            var pcSection = this.createCriteriaSection('Performance Criteria', 'PC', 'performance', performanceCriteria, globalIndex);
            container.appendChild(pcSection.element);
            globalIndex = pcSection.nextIndex;
        }

        // Render Performance Evidence section
        if (includePE && performanceEvidence.length > 0) {
            var peSection = this.createCriteriaSection('Performance Evidence', 'PE', 'evidence', performanceEvidence, globalIndex);
            container.appendChild(peSection.element);
            globalIndex = peSection.nextIndex;
        }

        // Render Knowledge Evidence section
        if (includeKE && knowledgeEvidence.length > 0) {
            var keSection = this.createCriteriaSection('Knowledge Evidence', 'KE', 'knowledge', knowledgeEvidence, globalIndex);
            container.appendChild(keSection.element);
        }

        // Show message if no criteria selected
        if (container.children.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'aiq-criteria-empty';
            empty.textContent = 'No criteria selected. Please select at least one criteria type above.';
            container.appendChild(empty);
        }
    };

    Wizard.prototype.createCriteriaSection = function(title, badge, type, criteria, startIndex) {
        var self = this;
        var section = document.createElement('div');
        section.className = 'aiq-criteria-section aiq-criteria-section--' + type;

        var header = document.createElement('div');
        header.className = 'aiq-criteria-section__header';
        header.innerHTML = [
            '<span class="aiq-criteria-section__badge aiq-type-' + type + '">' + badge + '</span>',
            '<span class="aiq-criteria-section__title">' + title + '</span>',
            '<span class="aiq-criteria-section__count">' + criteria.length + ' items</span>'
        ].join('');
        section.appendChild(header);

        var list = document.createElement('div');
        list.className = 'aiq-criteria-list';

        criteria.forEach(function(criterion, idx) {
            var item = self.createCriterionItem(criterion, startIndex + idx);
            list.appendChild(item);
        });

        section.appendChild(list);

        return {
            element: section,
            nextIndex: startIndex + criteria.length
        };
    };

    Wizard.prototype.updateCriteriaDisplay = function() {
        var container = document.getElementById('aiq-criteria-grouped');
        if (container) {
            this.renderGroupedCriteria(container);
        }
    };

    Wizard.prototype.createCriterionItem = function(criterion, index) {
        var self = this;
        var item = document.createElement('div');
        item.className = 'aiq-criterion-item';
        item.setAttribute('data-criterion-id', criterion.id);

        var number = document.createElement('span');
        number.className = 'aiq-criterion-item__number';
        // Use TGA-style numbering (e.g., 1.1, 1.2, 2.1) for performance criteria from TGA
        if (criterion.tgaNumber && criterion.type === 'performance') {
            number.textContent = criterion.tgaNumber;
        } else {
            number.textContent = index + 1;
        }
        item.appendChild(number);

        if (criterion.code) {
            var code = document.createElement('span');
            code.className = 'aiq-criterion-item__code';
            code.textContent = criterion.code;
            item.appendChild(code);
        }

        var text = document.createElement('div');
        text.className = 'aiq-criterion-item__text';
        text.textContent = criterion.text;
        text.contentEditable = 'true';
        text.addEventListener('blur', function() {
            criterion.text = text.textContent;
        });
        item.appendChild(text);

        var removeBtn = document.createElement('button');
        removeBtn.className = 'aiq-criterion-item__remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove criterion';
        removeBtn.addEventListener('click', function() {
            self.data.criteria = self.data.criteria.filter(function(c) {
                return c.id !== criterion.id;
            });
            Animations.fadeOutDown(item).then(function() {
                if (item.parentNode) {
                    item.parentNode.removeChild(item);
                }
            });
        });
        item.appendChild(removeBtn);

        return item;
    };

    Wizard.prototype.renderAllocationScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--allocation';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Question Types & Allocation';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'Select question types to include, then configure how many to generate per criterion:';
        screen.appendChild(desc);

        // Question Types Selector Section
        var typesSection = document.createElement('div');
        typesSection.className = 'aiq-question-types-section';
        
        var typesTitle = document.createElement('div');
        typesTitle.className = 'aiq-question-types-section__title';
        typesTitle.textContent = 'Include these question types:';
        typesSection.appendChild(typesTitle);
        
        var typesGrid = document.createElement('div');
        typesGrid.className = 'aiq-question-types-grid';
        typesGrid.id = 'aiq-question-types-grid';
        
        // Create checkbox for each question type
        Object.keys(this.questionTypeInfo).forEach(function(typeKey) {
            var typeInfo = self.questionTypeInfo[typeKey];
            var isEnabled = self.data.enabledQuestionTypes[typeKey];
            
            var typeCard = document.createElement('label');
            typeCard.className = 'aiq-question-type-card' + (isEnabled ? ' aiq-question-type-card--active' : '');
            typeCard.setAttribute('data-type', typeKey);
            
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'aiq-question-type-card__checkbox';
            checkbox.checked = isEnabled;
            checkbox.setAttribute('data-type', typeKey);
            checkbox.addEventListener('change', function() {
                self.data.enabledQuestionTypes[typeKey] = checkbox.checked;
                if (checkbox.checked) {
                    typeCard.classList.add('aiq-question-type-card--active');
                } else {
                    typeCard.classList.remove('aiq-question-type-card--active');
                }
                // Refresh the type dropdowns in allocation rows
                self.refreshAllocationTypeDropdowns();
            });
            typeCard.appendChild(checkbox);
            
            var cardContent = document.createElement('div');
            cardContent.className = 'aiq-question-type-card__content';
            
            var cardLabel = document.createElement('span');
            cardLabel.className = 'aiq-question-type-card__label';
            cardLabel.textContent = typeInfo.label;
            cardContent.appendChild(cardLabel);
            
            var cardName = document.createElement('span');
            cardName.className = 'aiq-question-type-card__name';
            cardName.textContent = typeInfo.name;
            cardContent.appendChild(cardName);
            
            typeCard.appendChild(cardContent);
            typesGrid.appendChild(typeCard);
        });
        
        typesSection.appendChild(typesGrid);
        
        // Quick select buttons for types
        var typesQuickSelect = document.createElement('div');
        typesQuickSelect.className = 'aiq-question-types-quick';
        
        var selectBasicBtn = document.createElement('button');
        selectBasicBtn.type = 'button';
        selectBasicBtn.className = 'aiq-question-types-quick__btn';
        selectBasicBtn.textContent = 'Basic (MCQ, T/F, Short)';
        selectBasicBtn.addEventListener('click', function() {
            self.setQuestionTypePreset('basic');
        });
        typesQuickSelect.appendChild(selectBasicBtn);
        
        var selectInteractiveBtn = document.createElement('button');
        selectInteractiveBtn.type = 'button';
        selectInteractiveBtn.className = 'aiq-question-types-quick__btn';
        selectInteractiveBtn.textContent = 'Interactive (+ Order, Match, Sort)';
        selectInteractiveBtn.addEventListener('click', function() {
            self.setQuestionTypePreset('interactive');
        });
        typesQuickSelect.appendChild(selectInteractiveBtn);
        
        var selectAllBtn = document.createElement('button');
        selectAllBtn.type = 'button';
        selectAllBtn.className = 'aiq-question-types-quick__btn';
        selectAllBtn.textContent = 'All Types';
        selectAllBtn.addEventListener('click', function() {
            self.setQuestionTypePreset('all');
        });
        typesQuickSelect.appendChild(selectAllBtn);
        
        typesSection.appendChild(typesQuickSelect);
        screen.appendChild(typesSection);

        // Auto-fill controls bar
        var controlsBar = document.createElement('div');
        controlsBar.className = 'aiq-allocation-controls';
        
        var controlsLabel = document.createElement('span');
        controlsLabel.className = 'aiq-allocation-controls__label';
        controlsLabel.textContent = 'Quick fill:';
        controlsBar.appendChild(controlsLabel);
        
        // Auto-fill buttons for 1, 2, 3 questions per criterion
        [1, 2, 3].forEach(function(count) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aiq-allocation-controls__btn';
            btn.textContent = count + ' per criterion';
            btn.title = 'Set all criteria to ' + count + ' question(s)';
            btn.addEventListener('click', function() {
                self.autoFillAllocation(count);
            });
            controlsBar.appendChild(btn);
        });
        
        // Even distribution button
        var evenBtn = document.createElement('button');
        evenBtn.type = 'button';
        evenBtn.className = 'aiq-allocation-controls__btn aiq-allocation-controls__btn--secondary';
        evenBtn.textContent = 'Even type mix';
        evenBtn.title = 'Distribute question types evenly across all criteria';
        evenBtn.addEventListener('click', function() {
            self.distributeTypesEvenly();
        });
        controlsBar.appendChild(evenBtn);
        
        screen.appendChild(controlsBar);

        var table = document.createElement('div');
        table.className = 'aiq-allocation-table';
        table.id = 'aiq-allocation-table';

        var header = document.createElement('div');
        header.className = 'aiq-allocation-header';
        header.innerHTML = '<span>Criterion</span><span>Type</span><span>Questions</span>';
        table.appendChild(header);

        this.data.criteria.forEach(function(criterion) {
            var row = self.createAllocationRow(criterion);
            table.appendChild(row);
        });

        screen.appendChild(table);

        var totals = document.createElement('div');
        totals.className = 'aiq-allocation-totals';
        totals.id = 'aiq-allocation-totals';
        this.updateAllocationTotals(totals);
        screen.appendChild(totals);

        return screen;
    };
    
    /**
     * Auto-fill all allocation counts with specified value.
     * @param {number} count - Number of questions per criterion
     */
    Wizard.prototype.autoFillAllocation = function(count) {
        var self = this;
        this.data.criteria.forEach(function(criterion) {
            if (!self.data.allocations[criterion.id]) {
                self.data.allocations[criterion.id] = { count: count, type: 'mcq' };
            }
            self.data.allocations[criterion.id].count = count;
        });
        
        // Update all input values in the table
        var inputs = document.querySelectorAll('.aiq-allocation-row__count input');
        inputs.forEach(function(input) {
            input.value = count;
        });
        
        this.updateAllocationTotals();
    };
    
    /**
     * Distribute question types evenly across all criteria using round-robin.
     * Only uses ENABLED question types from user selection.
     */
    Wizard.prototype.distributeTypesEvenly = function() {
        var self = this;
        
        // Get only enabled question types
        var types = this.getEnabledQuestionTypes();
        if (types.length === 0) {
            alert('Please enable at least one question type first.');
            return;
        }
        
        var typeIndex = 0;
        this.data.criteria.forEach(function(criterion) {
            var assignedType = types[typeIndex % types.length];
            
            if (!self.data.allocations[criterion.id]) {
                self.data.allocations[criterion.id] = { count: 2, type: assignedType };
            } else {
                self.data.allocations[criterion.id].type = assignedType;
            }
            
            typeIndex++;
        });
        
        // Re-render the table to show new types
        var table = document.getElementById('aiq-allocation-table');
        if (table) {
            // Clear existing rows except header
            while (table.children.length > 1) {
                table.removeChild(table.lastChild);
            }
            // Re-add rows with new types
            this.data.criteria.forEach(function(criterion) {
                var row = self.createAllocationRow(criterion);
                table.appendChild(row);
            });
        }
        
        this.updateAllocationTotals();
    };
    
    /**
     * Get array of enabled question type keys
     */
    Wizard.prototype.getEnabledQuestionTypes = function() {
        var self = this;
        return Object.keys(this.data.enabledQuestionTypes).filter(function(key) {
            return self.data.enabledQuestionTypes[key];
        });
    };
    
    /**
     * Set question type preset (basic, interactive, all)
     */
    Wizard.prototype.setQuestionTypePreset = function(preset) {
        var self = this;
        var presets = {
            basic: ['mcq', 'truefalse', 'shortanswer'],
            interactive: ['mcq', 'truefalse', 'shortanswer', 'gapfill', 'ordering', 'matching', 'categorysort'],
            all: Object.keys(this.questionTypeInfo)
        };
        
        var enabledTypes = presets[preset] || presets.basic;
        
        // Update data
        Object.keys(this.data.enabledQuestionTypes).forEach(function(key) {
            self.data.enabledQuestionTypes[key] = enabledTypes.indexOf(key) !== -1;
        });
        
        // Update UI checkboxes
        var grid = document.getElementById('aiq-question-types-grid');
        if (grid) {
            grid.querySelectorAll('.aiq-question-type-card').forEach(function(card) {
                var typeKey = card.getAttribute('data-type');
                var checkbox = card.querySelector('input[type="checkbox"]');
                var isEnabled = self.data.enabledQuestionTypes[typeKey];
                
                if (checkbox) checkbox.checked = isEnabled;
                if (isEnabled) {
                    card.classList.add('aiq-question-type-card--active');
                } else {
                    card.classList.remove('aiq-question-type-card--active');
                }
            });
        }
        
        // Refresh allocation dropdowns
        this.refreshAllocationTypeDropdowns();
    };
    
    /**
     * Refresh all type dropdowns in allocation rows to only show enabled types
     */
    Wizard.prototype.refreshAllocationTypeDropdowns = function() {
        var self = this;
        var enabledTypes = this.getEnabledQuestionTypes();
        
        // If no types enabled, default to MCQ
        if (enabledTypes.length === 0) {
            enabledTypes = ['mcq'];
            this.data.enabledQuestionTypes.mcq = true;
        }
        
        var selects = document.querySelectorAll('.aiq-allocation-row__type select');
        selects.forEach(function(select) {
            var criterionId = select.getAttribute('data-criterion-id');
            var currentValue = select.value;
            
            // Rebuild options
            select.innerHTML = '';
            enabledTypes.forEach(function(typeKey) {
                var opt = document.createElement('option');
                opt.value = typeKey;
                opt.textContent = self.questionTypeInfo[typeKey] ? self.questionTypeInfo[typeKey].label : typeKey;
                select.appendChild(opt);
            });
            
            // Restore value if still valid, otherwise use first enabled type
            if (enabledTypes.indexOf(currentValue) !== -1) {
                select.value = currentValue;
            } else {
                select.value = enabledTypes[0];
                // Update allocation data
                if (self.data.allocations[criterionId]) {
                    self.data.allocations[criterionId].type = enabledTypes[0];
                }
            }
        });
    };

    /**
     * Detect appropriate question type based on Bloom's Taxonomy verbs in criterion text.
     * Returns the best question type for the criterion based on cognitive level.
     * IMPROVED: Better matching type validation - only used for genuine compare/contrast scenarios.
     * IMPROVED: More balanced distribution to avoid overusing any single type.
     * @param {string} text - Criterion text
     * @returns {string} Question type ID
     */
    Wizard.prototype.detectQuestionType = function(text) {
        var lowerText = text.toLowerCase();
        
        // Process/sequence indicators -> Ordering (highest priority)
        var sequenceIndicators = ['steps', 'sequence', 'order', 'process', 'procedure', 'workflow', 'stages', 'phases'];
        for (var i = 0; i < sequenceIndicators.length; i++) {
            if (lowerText.indexOf(sequenceIndicators[i]) !== -1) {
                return 'ordering';
            }
        }
        
        // MATCHING: Only use for GENUINE compare/contrast scenarios
        // Matching requires pairs of related items - not just any "analyze" verb
        var matchingIndicators = [
            'match each', 'match the', 'pair', 'relate to',
            'correspond', 'link between', 'association between'
        ];
        for (var i = 0; i < matchingIndicators.length; i++) {
            if (lowerText.indexOf(matchingIndicators[i]) !== -1) {
                return 'matching';
            }
        }
        
        // Category Sort: For categorization/classification tasks
        var categorySortIndicators = ['categorise', 'categorize', 'classify', 'sort into', 'group by', 'types of', 'kinds of'];
        for (var i = 0; i < categorySortIndicators.length; i++) {
            if (lowerText.indexOf(categorySortIndicators[i]) !== -1) {
                return 'categorysort';
            }
        }
        
        // Essay: For evaluate/create level (complex open-ended)
        var essayVerbs = ['evaluate', 'justify', 'critique', 'recommend', 'create', 'design', 'develop'];
        for (var i = 0; i < essayVerbs.length; i++) {
            if (lowerText.indexOf(essayVerbs[i]) !== -1) {
                return 'essay';
            }
        }
        
        // Short Answer: For explain/describe (medium complexity)
        var shortAnswerVerbs = ['explain', 'describe', 'outline', 'summarise', 'summarize'];
        for (var i = 0; i < shortAnswerVerbs.length; i++) {
            if (lowerText.indexOf(shortAnswerVerbs[i]) !== -1) {
                return 'shortanswer';
            }
        }
        
        // Fill Gap: For apply/demonstrate with specific terms
        var fillGapVerbs = ['apply', 'use', 'implement', 'complete', 'fill'];
        for (var i = 0; i < fillGapVerbs.length; i++) {
            if (lowerText.indexOf(fillGapVerbs[i]) !== -1) {
                return 'fillgap';
            }
        }
        
        // True/False: For simple identification/recall
        var trueFalseIndicators = ['is', 'are', 'does', 'do', 'can', 'must', 'should'];
        if (lowerText.length < 80) {
            for (var i = 0; i < trueFalseIndicators.length; i++) {
                if (lowerText.indexOf(trueFalseIndicators[i] + ' ') === 0 || 
                    lowerText.indexOf(' ' + trueFalseIndicators[i] + ' ') !== -1) {
                    return 'truefalse';
                }
            }
        }
        
        // Remember verbs: MCQ (good default for knowledge recall)
        var rememberVerbs = ['identify', 'list', 'name', 'state', 'define', 'recall', 'recognise', 'recognize'];
        for (var i = 0; i < rememberVerbs.length; i++) {
            if (lowerText.indexOf(rememberVerbs[i]) !== -1) {
                return 'mcq';
            }
        }
        
        // Default: Use a balanced rotation to avoid MCQ overload
        // Get a hash of the text to pseudo-randomly distribute
        var hash = 0;
        for (var i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        var defaultTypes = ['mcq', 'mcq', 'truefalse', 'fillgap', 'shortanswer'];
        return defaultTypes[Math.abs(hash) % defaultTypes.length];
    };

    Wizard.prototype.createAllocationRow = function(criterion) {
        var self = this;
        var row = document.createElement('div');
        row.className = 'aiq-allocation-row';

        var text = document.createElement('div');
        text.className = 'aiq-allocation-row__text';
        text.textContent = criterion.text;
        row.appendChild(text);

        // Get enabled question types
        var enabledTypes = this.getEnabledQuestionTypes();
        if (enabledTypes.length === 0) {
            enabledTypes = ['mcq'];
        }

        // Auto-detect question type based on Bloom's Taxonomy verbs
        var detectedType = this.detectQuestionType(criterion.text);
        // Use detected type only if it's enabled, otherwise use first enabled type
        if (enabledTypes.indexOf(detectedType) === -1) {
            detectedType = enabledTypes[0];
        }
        
        if (!this.data.allocations[criterion.id]) {
            this.data.allocations[criterion.id] = { count: 2, type: detectedType };
        } else if (enabledTypes.indexOf(this.data.allocations[criterion.id].type) === -1) {
            // Current type is no longer enabled, switch to first enabled
            this.data.allocations[criterion.id].type = detectedType;
        }

        // Type selector dropdown (only shows enabled types)
        var typeWrapper = document.createElement('div');
        typeWrapper.className = 'aiq-allocation-row__type';

        var typeSelect = document.createElement('select');
        typeSelect.className = 'aiq-type-select';
        typeSelect.setAttribute('data-criterion-id', criterion.id);
        typeSelect.setAttribute('aria-label', 'Question type for this criterion');
        
        enabledTypes.forEach(function(typeKey) {
            var opt = document.createElement('option');
            opt.value = typeKey;
            opt.textContent = self.questionTypeInfo[typeKey] ? self.questionTypeInfo[typeKey].label : typeKey;
            typeSelect.appendChild(opt);
        });
        
        typeSelect.value = this.data.allocations[criterion.id].type;
        typeSelect.addEventListener('change', function() {
            self.data.allocations[criterion.id].type = typeSelect.value;
        });
        
        typeWrapper.appendChild(typeSelect);
        row.appendChild(typeWrapper);

        // Question count input
        var countWrapper = document.createElement('div');
        countWrapper.className = 'aiq-allocation-row__count';

        var countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.min = 0;
        countInput.max = 10;
        countInput.value = this.data.allocations[criterion.id]?.count || 2;
        countInput.setAttribute('aria-label', 'Number of questions for this criterion');
        countInput.addEventListener('change', function() {
            self.data.allocations[criterion.id].count = parseInt(countInput.value) || 0;
            self.updateAllocationTotals();
        });
        countWrapper.appendChild(countInput);
        row.appendChild(countWrapper);

        return row;
    };

    Wizard.prototype.updateAllocationTotals = function(container) {
        var self = this;
        container = container || document.getElementById('aiq-allocation-totals');
        if (!container) return;

        var total = 0;
        Object.values(this.data.allocations).forEach(function(alloc) {
            total += alloc.count || 0;
        });

        container.innerHTML = '<strong>Total Questions:</strong> ' + total;
    };

    Wizard.prototype.renderGenerationScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--generation';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Generating Questions';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'AI is creating questions based on your selected criteria...';
        screen.appendChild(desc);

        // Main progress card
        var progressCard = document.createElement('div');
        progressCard.className = 'aiq-generation-card';

        // Header with title and percentage
        var header = document.createElement('div');
        header.className = 'aiq-generation-card__header';

        var headerTitle = document.createElement('span');
        headerTitle.className = 'aiq-generation-card__title';
        headerTitle.textContent = 'Progress';
        header.appendChild(headerTitle);

        var percentage = document.createElement('span');
        percentage.className = 'aiq-generation-card__percent';
        percentage.id = 'aiq-generation-percent';
        percentage.textContent = '0%';
        header.appendChild(percentage);

        progressCard.appendChild(header);

        // Progress bar
        var progressBar = document.createElement('div');
        progressBar.className = 'aiq-generation-bar';

        var progressFill = document.createElement('div');
        progressFill.className = 'aiq-generation-bar__fill';
        progressFill.id = 'aiq-generation-fill';
        progressBar.appendChild(progressFill);

        progressCard.appendChild(progressBar);

        // Status text
        var status = document.createElement('div');
        status.className = 'aiq-generation-status';
        status.id = 'aiq-generation-status';
        status.textContent = 'Preparing generation queue...';
        progressCard.appendChild(status);

        screen.appendChild(progressCard);

        // Criteria queue list
        var queueCard = document.createElement('div');
        queueCard.className = 'aiq-generation-queue';

        var queueTitle = document.createElement('div');
        queueTitle.className = 'aiq-generation-queue__title';
        queueTitle.textContent = 'Generation Queue';
        queueCard.appendChild(queueTitle);

        var queueList = document.createElement('div');
        queueList.className = 'aiq-generation-queue__list';
        queueList.id = 'aiq-generation-queue';

        // Pre-populate queue with criteria
        this.data.criteria.forEach(function(criterion) {
            var alloc = self.data.allocations[criterion.id];
            if (alloc && alloc.count > 0) {
                var item = document.createElement('div');
                item.className = 'aiq-queue-item aiq-queue-item--pending';
                item.setAttribute('data-criterion-id', criterion.id);

                var icon = document.createElement('div');
                icon.className = 'aiq-queue-item__icon';
                icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                item.appendChild(icon);

                var text = document.createElement('div');
                text.className = 'aiq-queue-item__text';
                text.textContent = criterion.text.length > 50 ? criterion.text.substring(0, 50) + '...' : criterion.text;
                item.appendChild(text);

                var count = document.createElement('div');
                count.className = 'aiq-queue-item__count';
                count.textContent = alloc.count + ' ' + (alloc.count === 1 ? 'question' : 'questions');
                item.appendChild(count);

                queueList.appendChild(item);
            }
        });

        queueCard.appendChild(queueList);
        screen.appendChild(queueCard);

        // Live preview panel
        var previewCard = document.createElement('div');
        previewCard.className = 'aiq-generation-preview';
        previewCard.id = 'aiq-generation-preview';

        var previewTitle = document.createElement('div');
        previewTitle.className = 'aiq-generation-preview__title';
        previewTitle.textContent = 'Live Preview';
        previewCard.appendChild(previewTitle);

        var previewContent = document.createElement('div');
        previewContent.className = 'aiq-generation-preview__content';
        previewContent.id = 'aiq-generation-preview-content';
        previewContent.innerHTML = '<div class="aiq-generation-preview__empty">Questions will appear here as they are generated...</div>';
        previewCard.appendChild(previewContent);

        screen.appendChild(previewCard);

        // Control buttons
        var controls = document.createElement('div');
        controls.className = 'aiq-generation-controls';
        controls.id = 'aiq-generation-controls';

        var cancelBtn = new Button({
            id: 'generation-cancel',
            text: 'Cancel',
            variant: 'ghost'
        });
        cancelBtn.onClick = function() {
            self.cancelGeneration();
        };
        controls.appendChild(cancelBtn.render());

        screen.appendChild(controls);

        // Start generation after short delay
        setTimeout(function() {
            self.startGeneration();
        }, 500);

        return screen;
    };

    Wizard.prototype.cancelGeneration = function() {
        this.generationCancelled = true;
        var status = document.getElementById('aiq-generation-status');
        if (status) {
            status.textContent = 'Cancelled. ' + this.data.generatedQuestions.length + ' questions generated.';
        }
        this.navButtons.next.enable();
    };

    Wizard.prototype.startGeneration = function() {
        var self = this;
        var fill = document.getElementById('aiq-generation-fill');
        var status = document.getElementById('aiq-generation-status');
        var percent = document.getElementById('aiq-generation-percent');
        var previewContent = document.getElementById('aiq-generation-preview-content');

        this.generationCancelled = false;

        var criteriaToProcess = this.data.criteria.filter(function(c) {
            var alloc = self.data.allocations[c.id];
            return alloc && alloc.count > 0;
        });

        var total = criteriaToProcess.length;
        var completed = 0;

        this.data.generatedQuestions = [];

        function updateQueueItem(criterionId, state, questionsGenerated) {
            var item = document.querySelector('[data-criterion-id="' + criterionId + '"]');
            if (!item) return;

            item.className = 'aiq-queue-item aiq-queue-item--' + state;

            var icon = item.querySelector('.aiq-queue-item__icon');
            if (icon) {
                if (state === 'generating') {
                    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="aiq-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>';
                } else if (state === 'complete') {
                    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
                } else if (state === 'error') {
                    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
                }
            }

            if (questionsGenerated !== undefined) {
                var count = item.querySelector('.aiq-queue-item__count');
                if (count) {
                    count.textContent = questionsGenerated + ' generated';
                    count.classList.add('aiq-queue-item__count--done');
                }
            }
        }

        function addToPreview(questions) {
            if (!previewContent) return;

            // Clear empty state
            var empty = previewContent.querySelector('.aiq-generation-preview__empty');
            if (empty) empty.remove();

            questions.forEach(function(q) {
                var preview = document.createElement('div');
                preview.className = 'aiq-preview-question';

                var badge = document.createElement('span');
                badge.className = 'aiq-preview-question__type';
                badge.textContent = q.type || 'MCQ';
                preview.appendChild(badge);

                var text = document.createElement('span');
                text.className = 'aiq-preview-question__text';
                text.textContent = q.questionText ? (q.questionText.length > 80 ? q.questionText.substring(0, 80) + '...' : q.questionText) : 'Question generated';
                preview.appendChild(text);

                previewContent.appendChild(preview);
                Animations.fadeInUp(preview);

                // Scroll to bottom
                previewContent.scrollTop = previewContent.scrollHeight;
            });
        }

        function processNext(index) {
            if (self.generationCancelled) {
                return;
            }

            if (index >= criteriaToProcess.length) {
                var pct = '100%';
                if (fill) fill.style.width = pct;
                if (percent) percent.textContent = pct;
                if (status) status.textContent = 'Complete! Generated ' + self.data.generatedQuestions.length + ' questions.';
                if (status) status.classList.add('aiq-generation-status--complete');
                self.navButtons.next.enable();
                self.showGenerationComplete();
                return;
            }

            var criterion = criteriaToProcess[index];
            var alloc = self.data.allocations[criterion.id];

            // Update queue item to generating
            updateQueueItem(criterion.id, 'generating');

            if (status) status.textContent = 'Generating: ' + criterion.text.substring(0, 50) + '...';

            // DEBUG: Log what we're sending to API
            var requestPayload = {
                quizid: self.options.quizId,
                criteria: [{ text: criterion.text, count: alloc.count }],
                options: { 
                    questionTypes: [alloc.type], 
                    difficulty: 'medium',
                    // Add unit context if available
                    unitCode: self.data.unit?.code || self.data.unitCode || null,
                    unitTitle: self.data.unit?.title || self.data.unitTitle || null,
                    elements: self.data.unit?.elements || null
                }
            };
            console.log('[AI Quiz DEBUG] Sending to generate_questions:', JSON.stringify(requestPayload, null, 2));
            console.log('[AI Quiz DEBUG] Criterion text:', criterion.text);
            console.log('[AI Quiz DEBUG] Allocation type:', alloc.type, 'count:', alloc.count);
            console.log('[AI Quiz DEBUG] Full unit data:', self.data.unit);

            Api.request('generate_questions', requestPayload).then(function(result) {
                console.log('[AI Quiz DEBUG] API Response:', JSON.stringify(result, null, 2));
                var questions = result.questions || [];
                
                // Normalize field names and add criterion info to each question
                questions.forEach(function(q) {
                    // API returns 'question' but we use 'questionText' internally
                    if (q.question && !q.questionText) {
                        q.questionText = q.question;
                    }
                    q.criterionId = criterion.id;
                    q.criterionText = criterion.text;
                    q.criterionCode = criterion.code || '';
                });
                
                self.data.generatedQuestions = self.data.generatedQuestions.concat(questions);

                // Update queue item to complete
                updateQueueItem(criterion.id, 'complete', questions.length);

                // Add to preview
                addToPreview(questions);

                completed++;
                var pctValue = Math.round((completed / total) * 100);
                if (fill) fill.style.width = pctValue + '%';
                if (percent) percent.textContent = pctValue + '%';

                processNext(index + 1);
            }).catch(function(error) {
                // Update queue item to error
                updateQueueItem(criterion.id, 'error');

                completed++;
                var pctValue = Math.round((completed / total) * 100);
                if (fill) fill.style.width = pctValue + '%';
                if (percent) percent.textContent = pctValue + '%';

                processNext(index + 1);
            });
        }

        this.navButtons.next.disable();
        processNext(0);
    };

    Wizard.prototype.showGenerationComplete = function() {
        var controls = document.getElementById('aiq-generation-controls');
        if (!controls) return;

        controls.innerHTML = '';

        var successMsg = document.createElement('div');
        successMsg.className = 'aiq-generation-success';
        successMsg.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><span>' + this.data.generatedQuestions.length + ' questions ready for review</span>';
        controls.appendChild(successMsg);

        Animations.fadeInUp(successMsg);
    };

    Wizard.prototype.renderReviewScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--review';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Review & Edit Questions';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'Review, edit, or regenerate questions before saving. Click on question text to edit directly.';
        screen.appendChild(desc);

        // Stats bar
        var statsBar = document.createElement('div');
        statsBar.className = 'aiq-review-stats';

        var totalBadge = document.createElement('div');
        totalBadge.className = 'aiq-review-stat';
        totalBadge.innerHTML = '<span class="aiq-review-stat__value">' + this.data.generatedQuestions.length + '</span><span class="aiq-review-stat__label">Questions</span>';
        statsBar.appendChild(totalBadge);

        var typeStats = {};
        this.data.generatedQuestions.forEach(function(q) {
            var type = q.type || 'multichoice';
            typeStats[type] = (typeStats[type] || 0) + 1;
        });

        Object.keys(typeStats).forEach(function(type) {
            var stat = document.createElement('div');
            stat.className = 'aiq-review-stat aiq-review-stat--secondary';
            stat.innerHTML = '<span class="aiq-review-stat__value">' + typeStats[type] + '</span><span class="aiq-review-stat__label">' + self.formatQuestionType(type) + '</span>';
            statsBar.appendChild(stat);
        });

        screen.appendChild(statsBar);

        // Bulk actions
        var bulkActions = document.createElement('div');
        bulkActions.className = 'aiq-review-bulk-actions';

        var selectAllBtn = new Button({
            id: 'select-all',
            text: 'Select All',
            variant: 'ghost',
            size: 'small'
        });
        selectAllBtn.onClick = function() {
            self.toggleSelectAll();
        };
        bulkActions.appendChild(selectAllBtn.render());

        var deleteSelectedBtn = new Button({
            id: 'delete-selected',
            text: 'Delete Selected',
            variant: 'ghost',
            size: 'small'
        });
        deleteSelectedBtn.onClick = function() {
            self.deleteSelectedQuestions();
        };
        bulkActions.appendChild(deleteSelectedBtn.render());

        var regenerateSelectedBtn = new Button({
            id: 'regenerate-selected',
            text: 'Regenerate Selected',
            variant: 'ghost',
            size: 'small'
        });
        regenerateSelectedBtn.onClick = function() {
            self.regenerateSelectedQuestions();
        };
        bulkActions.appendChild(regenerateSelectedBtn.render());

        screen.appendChild(bulkActions);

        // Question cards container with pagination
        this.reviewCurrentPage = 0;
        this.reviewPageSize = 5;

        // Store as instance properties for renderReviewPage to use
        this.reviewCardsContainer = document.createElement('div');
        this.reviewCardsContainer.className = 'aiq-review-cards';
        this.reviewCardsContainer.id = 'aiq-review-cards';
        screen.appendChild(this.reviewCardsContainer);

        // Pagination
        this.reviewPaginationContainer = document.createElement('div');
        this.reviewPaginationContainer.className = 'aiq-review-pagination';
        this.reviewPaginationContainer.id = 'aiq-review-pagination';
        screen.appendChild(this.reviewPaginationContainer);

        // Initialize view
        this.selectedQuestions = new Set();
        this.renderReviewPage();

        return screen;
    };

    Wizard.prototype.formatQuestionType = function(type) {
        var typeMap = {
            'multichoice': 'MCQ',
            'mcq': 'MCQ',
            'truefalse': 'T/F',
            'matching': 'Match',
            'ordering': 'Order',
            'shortanswer': 'Short',
            'gapfill': 'Gap Fill'
        };
        return typeMap[type] || type;
    };

    Wizard.prototype.renderReviewPage = function() {
        var self = this;
        // Use instance properties first (for initial render before DOM attachment), fallback to getElementById
        var container = this.reviewCardsContainer || document.getElementById('aiq-review-cards');
        var pagination = this.reviewPaginationContainer || document.getElementById('aiq-review-pagination');
        if (!container) return;

        container.innerHTML = '';

        var start = this.reviewCurrentPage * this.reviewPageSize;
        var end = Math.min(start + this.reviewPageSize, this.data.generatedQuestions.length);
        var pageQuestions = this.data.generatedQuestions.slice(start, end);

        pageQuestions.forEach(function(question, localIndex) {
            var globalIndex = start + localIndex;
            var card = self.createQuestionReviewCard(question, globalIndex);
            container.appendChild(card);
        });

        // Update pagination
        if (pagination) {
            pagination.innerHTML = '';

            var totalPages = Math.ceil(this.data.generatedQuestions.length / this.reviewPageSize);

            if (totalPages > 1) {
                // Previous button
                var prevBtn = document.createElement('button');
                prevBtn.className = 'aiq-pagination-btn';
                prevBtn.disabled = this.reviewCurrentPage === 0;
                prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
                prevBtn.addEventListener('click', function() {
                    if (self.reviewCurrentPage > 0) {
                        self.reviewCurrentPage--;
                        self.renderReviewPage();
                    }
                });
                pagination.appendChild(prevBtn);

                // Page numbers
                for (var i = 0; i < totalPages; i++) {
                    var pageBtn = document.createElement('button');
                    pageBtn.className = 'aiq-pagination-btn aiq-pagination-btn--page';
                    if (i === this.reviewCurrentPage) {
                        pageBtn.classList.add('aiq-pagination-btn--active');
                    }
                    pageBtn.textContent = i + 1;
                    pageBtn.setAttribute('data-page', i);
                    pageBtn.addEventListener('click', function(e) {
                        var page = parseInt(e.target.getAttribute('data-page'));
                        self.reviewCurrentPage = page;
                        self.renderReviewPage();
                    });
                    pagination.appendChild(pageBtn);
                }

                // Next button
                var nextBtn = document.createElement('button');
                nextBtn.className = 'aiq-pagination-btn';
                nextBtn.disabled = this.reviewCurrentPage === totalPages - 1;
                nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
                nextBtn.addEventListener('click', function() {
                    if (self.reviewCurrentPage < totalPages - 1) {
                        self.reviewCurrentPage++;
                        self.renderReviewPage();
                    }
                });
                pagination.appendChild(nextBtn);
            }
        }
    };

    Wizard.prototype.toggleSelectAll = function() {
        var self = this;
        var checkboxes = document.querySelectorAll('.aiq-review-card__checkbox');
        var allSelected = this.selectedQuestions.size === this.data.generatedQuestions.length;

        if (allSelected) {
            this.selectedQuestions.clear();
            checkboxes.forEach(function(cb) {
                cb.checked = false;
            });
        } else {
            this.data.generatedQuestions.forEach(function(q, i) {
                self.selectedQuestions.add(i);
            });
            checkboxes.forEach(function(cb) {
                cb.checked = true;
            });
        }
    };

    Wizard.prototype.deleteSelectedQuestions = function() {
        var self = this;
        if (this.selectedQuestions.size === 0) {
            alert('No questions selected');
            return;
        }

        if (!confirm('Delete ' + this.selectedQuestions.size + ' selected questions?')) {
            return;
        }

        var indices = Array.from(this.selectedQuestions).sort(function(a, b) { return b - a; });
        indices.forEach(function(index) {
            self.data.generatedQuestions.splice(index, 1);
        });

        this.selectedQuestions.clear();
        this.reviewCurrentPage = 0;
        this.renderReviewPage();
    };

    Wizard.prototype.regenerateSelectedQuestions = function() {
        if (this.selectedQuestions.size === 0) {
            alert('No questions selected');
            return;
        }
        alert('Regenerating ' + this.selectedQuestions.size + ' questions... (Feature in progress)');
    };

    Wizard.prototype.createQuestionReviewCard = function(question, index) {
        var self = this;
        var card = document.createElement('div');
        card.className = 'aiq-review-card';
        card.setAttribute('data-question-index', index);

        // Checkbox for selection
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'aiq-review-card__checkbox';
        checkbox.checked = this.selectedQuestions.has(index);
        checkbox.addEventListener('change', function() {
            if (checkbox.checked) {
                self.selectedQuestions.add(index);
            } else {
                self.selectedQuestions.delete(index);
            }
        });
        card.appendChild(checkbox);

        // Main content wrapper
        var content = document.createElement('div');
        content.className = 'aiq-review-card__content';

        // Header with number, type, and criterion
        var header = document.createElement('div');
        header.className = 'aiq-review-card__header';

        var headerLeft = document.createElement('div');
        headerLeft.className = 'aiq-review-card__header-left';

        var number = document.createElement('span');
        number.className = 'aiq-review-card__number';
        number.textContent = 'Q' + (index + 1);
        headerLeft.appendChild(number);

        var type = document.createElement('span');
        type.className = 'aiq-review-card__type';
        type.textContent = this.formatQuestionType(question.type || 'multichoice');
        headerLeft.appendChild(type);

        if (question.criterionCode || question.criterionText) {
            var criterion = document.createElement('span');
            criterion.className = 'aiq-review-card__criterion';
            criterion.textContent = question.criterionCode || (question.criterionText ? question.criterionText.substring(0, 30) + '...' : '');
            criterion.title = question.criterionText || '';
            headerLeft.appendChild(criterion);
        }

        header.appendChild(headerLeft);

        var actions = document.createElement('div');
        actions.className = 'aiq-review-card__actions';

        var regenerateBtn = new Button({
            id: 'regenerate-' + index,
            text: 'Regenerate',
            variant: 'ghost',
            size: 'small'
        });
        regenerateBtn.onClick = function() {
            self.regenerateQuestion(question, index, card);
        };
        actions.appendChild(regenerateBtn.render());

        var deleteBtn = new Button({
            id: 'delete-' + index,
            text: 'Delete',
            variant: 'ghost',
            size: 'small'
        });
        deleteBtn.onClick = function() {
            self.deleteQuestion(index, card);
        };
        actions.appendChild(deleteBtn.render());

        header.appendChild(actions);
        content.appendChild(header);

        // Question text (editable)
        var questionText = document.createElement('div');
        questionText.className = 'aiq-review-card__question';
        questionText.textContent = question.questionText || 'No question text';
        questionText.contentEditable = 'true';
        questionText.addEventListener('blur', function() {
            question.questionText = questionText.textContent;
        });
        questionText.addEventListener('focus', function() {
            questionText.classList.add('aiq-review-card__question--editing');
        });
        questionText.addEventListener('blur', function() {
            questionText.classList.remove('aiq-review-card__question--editing');
        });
        content.appendChild(questionText);

        // Choices/answers
        if (question.choices && question.choices.length > 0) {
            var choices = document.createElement('div');
            choices.className = 'aiq-review-card__choices';

            question.choices.forEach(function(choice, cIndex) {
                var choiceEl = document.createElement('div');
                choiceEl.className = 'aiq-review-card__choice';
                
                var isCorrect = choice.isCorrect || 
                    choice.id === question.correctAnswer || 
                    (question.correctAnswerIndex !== undefined && cIndex === question.correctAnswerIndex);
                
                if (isCorrect) {
                    choiceEl.classList.add('aiq-review-card__choice--correct');
                }

                var letter = document.createElement('span');
                letter.className = 'aiq-review-card__choice-letter';
                letter.textContent = String.fromCharCode(65 + cIndex);
                choiceEl.appendChild(letter);

                var text = document.createElement('span');
                text.className = 'aiq-review-card__choice-text';
                text.textContent = choice.text || choice;
                text.contentEditable = 'true';
                text.addEventListener('blur', function() {
                    if (typeof choice === 'object') {
                        choice.text = text.textContent;
                    } else {
                        question.choices[cIndex] = text.textContent;
                    }
                });
                choiceEl.appendChild(text);

                if (isCorrect) {
                    var correctBadge = document.createElement('span');
                    correctBadge.className = 'aiq-review-card__choice-badge';
                    correctBadge.textContent = 'Correct';
                    choiceEl.appendChild(correctBadge);
                }

                choices.appendChild(choiceEl);
            });

            content.appendChild(choices);
        }

        // Feedback section (collapsible)
        if (question.feedback || question.explanation) {
            var feedbackSection = document.createElement('div');
            feedbackSection.className = 'aiq-review-card__feedback';

            var feedbackLabel = document.createElement('div');
            feedbackLabel.className = 'aiq-review-card__feedback-label';
            feedbackLabel.textContent = 'Feedback';
            feedbackSection.appendChild(feedbackLabel);

            var feedbackText = document.createElement('div');
            feedbackText.className = 'aiq-review-card__feedback-text';
            feedbackText.textContent = question.feedback || question.explanation;
            feedbackText.contentEditable = 'true';
            feedbackText.addEventListener('blur', function() {
                question.feedback = feedbackText.textContent;
            });
            feedbackSection.appendChild(feedbackText);

            content.appendChild(feedbackSection);
        }

        card.appendChild(content);

        return card;
    };

    Wizard.prototype.deleteQuestion = function(index, card) {
        var self = this;
        
        Animations.fadeOutDown(card).then(function() {
            self.data.generatedQuestions.splice(index, 1);
            self.selectedQuestions.delete(index);
            
            // Re-index selected questions
            var newSelected = new Set();
            self.selectedQuestions.forEach(function(i) {
                if (i > index) {
                    newSelected.add(i - 1);
                } else {
                    newSelected.add(i);
                }
            });
            self.selectedQuestions = newSelected;
            
            self.renderReviewPage();
        });
    };

    Wizard.prototype.regenerateQuestion = function(question, index, card) {
        var self = this;

        Api.request('generate_questions', {
            quizid: self.options.quizId,
            criteria: [{ text: question.criterionText || 'Regenerate this question', count: 1 }],
            options: { questionTypes: [question.type || 'multichoice'], difficulty: 'medium' }
        }).then(function(result) {
            var questions = result.questions || [];
            if (questions.length > 0) {
                var newQuestion = questions[0];
                // Normalize field name: API returns 'question' but we use 'questionText'
                if (newQuestion.question && !newQuestion.questionText) {
                    newQuestion.questionText = newQuestion.question;
                }
                newQuestion.criterionId = question.criterionId;
                newQuestion.criterionText = question.criterionText;
                self.data.generatedQuestions[index] = newQuestion;

                var newCard = self.createQuestionReviewCard(newQuestion, index);
                card.parentNode.replaceChild(newCard, card);
                Animations.pulse(newCard);
            }
        }).catch(function(error) {
            console.error('Regeneration failed:', error);
        });
    };

    Wizard.prototype.renderSummaryScreen = function() {
        var self = this;
        var screen = document.createElement('div');
        screen.className = 'aiq-screen aiq-screen--summary';

        var title = document.createElement('h2');
        title.className = 'aiq-screen__title';
        title.textContent = 'Assessment Summary';
        screen.appendChild(title);

        var desc = document.createElement('p');
        desc.className = 'aiq-screen__desc';
        desc.textContent = 'Review your assessment before saving. All criteria should be covered.';
        screen.appendChild(desc);

        // Calculate coverage stats
        var coveredCriteria = 0;
        var coverageData = this.data.criteria.map(function(criterion) {
            var count = self.data.generatedQuestions.filter(function(q) {
                return q.criterionId === criterion.id;
            }).length;
            if (count > 0) coveredCriteria++;
            return { criterion: criterion, count: count };
        });
        var coveragePercent = this.data.criteria.length > 0 
            ? Math.round((coveredCriteria / this.data.criteria.length) * 100) 
            : 0;

        // Coverage score ring
        var scoreCard = document.createElement('div');
        scoreCard.className = 'aiq-summary-score';

        var scoreRing = document.createElement('div');
        scoreRing.className = 'aiq-score-ring';
        scoreRing.innerHTML = this.createScoreRingSVG(coveragePercent);
        scoreCard.appendChild(scoreRing);

        var scoreDetails = document.createElement('div');
        scoreDetails.className = 'aiq-score-details';

        var scoreTitle = document.createElement('div');
        scoreTitle.className = 'aiq-score-title';
        scoreTitle.textContent = coveragePercent === 100 ? 'Full Coverage!' : 'Criteria Coverage';
        scoreDetails.appendChild(scoreTitle);

        var scoreStats = document.createElement('div');
        scoreStats.className = 'aiq-score-stats';
        scoreStats.innerHTML = '<span>' + coveredCriteria + '/' + this.data.criteria.length + ' criteria</span><span>' + this.data.generatedQuestions.length + ' questions</span>';
        scoreDetails.appendChild(scoreStats);

        scoreCard.appendChild(scoreDetails);
        screen.appendChild(scoreCard);

        // Summary details
        var summary = document.createElement('div');
        summary.className = 'aiq-summary';

        var nameRow = this.createSummaryRow('Assessment Name', this.data.assessmentName);
        summary.appendChild(nameRow);

        var typeRow = this.createSummaryRow('Type', this.data.assessmentType || 'Knowledge Assessment');
        summary.appendChild(typeRow);

        var criteriaRow = this.createSummaryRow('Total Criteria', this.data.criteria.length + ' criteria');
        summary.appendChild(criteriaRow);

        var questionsRow = this.createSummaryRow('Questions Generated', this.data.generatedQuestions.length + ' questions');
        summary.appendChild(questionsRow);

        screen.appendChild(summary);

        // Coverage mapping matrix
        var coverage = document.createElement('div');
        coverage.className = 'aiq-coverage';

        var coverageHeader = document.createElement('div');
        coverageHeader.className = 'aiq-coverage-header';

        var coverageTitle = document.createElement('h3');
        coverageTitle.textContent = 'Criteria Mapping Matrix';
        coverageHeader.appendChild(coverageTitle);

        // Export buttons
        var exportBtns = document.createElement('div');
        exportBtns.className = 'aiq-coverage-exports';

        var csvBtn = new Button({
            id: 'export-csv',
            text: 'Export CSV',
            variant: 'ghost',
            size: 'small'
        });
        csvBtn.onClick = function() {
            self.exportMappingCSV();
        };
        exportBtns.appendChild(csvBtn.render());

        var pdfBtn = new Button({
            id: 'export-pdf',
            text: 'Export PDF',
            variant: 'ghost',
            size: 'small'
        });
        pdfBtn.onClick = function() {
            self.exportMappingPDF();
        };
        exportBtns.appendChild(pdfBtn.render());

        coverageHeader.appendChild(exportBtns);
        coverage.appendChild(coverageHeader);

        var coverageList = document.createElement('div');
        coverageList.className = 'aiq-coverage-list';

        coverageData.forEach(function(item) {
            var row = self.createCoverageRow(item.criterion, item.count);
            coverageList.appendChild(row);
        });

        coverage.appendChild(coverageList);
        screen.appendChild(coverage);

        this.navButtons.next.setText('Save Assessment');

        // Trigger confetti if 100% coverage
        if (coveragePercent === 100 && this.data.generatedQuestions.length > 0) {
            setTimeout(function() {
                self.triggerConfetti();
            }, 500);
        }

        return screen;
    };

    Wizard.prototype.createScoreRingSVG = function(percent) {
        var radius = 45;
        var circumference = 2 * Math.PI * radius;
        var offset = circumference - (percent / 100) * circumference;
        var color = percent === 100 ? '#22c55e' : (percent >= 80 ? '#eab308' : '#ef4444');

        return '<svg width="120" height="120" viewBox="0 0 120 120">' +
            '<circle cx="60" cy="60" r="' + radius + '" fill="none" stroke="#e5e7eb" stroke-width="8"/>' +
            '<circle cx="60" cy="60" r="' + radius + '" fill="none" stroke="' + color + '" stroke-width="8" ' +
            'stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" ' +
            'transform="rotate(-90 60 60)" class="aiq-score-ring__progress"/>' +
            '<text x="60" y="60" text-anchor="middle" dominant-baseline="middle" ' +
            'font-size="24" font-weight="700" fill="' + color + '">' + percent + '%</text>' +
            '</svg>';
    };

    Wizard.prototype.createCoverageRow = function(criterion, count) {
        var row = document.createElement('div');
        row.className = 'aiq-coverage-item';

        // Status indicator
        var status = document.createElement('div');
        status.className = 'aiq-coverage-status';
        
        if (count === 0) {
            status.classList.add('aiq-coverage-status--uncovered');
            status.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
        } else if (count >= 2) {
            status.classList.add('aiq-coverage-status--full');
            status.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
        } else {
            status.classList.add('aiq-coverage-status--partial');
            status.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
        }
        row.appendChild(status);

        // Criterion info
        var info = document.createElement('div');
        info.className = 'aiq-coverage-info';

        if (criterion.code) {
            var code = document.createElement('span');
            code.className = 'aiq-coverage-code';
            code.textContent = criterion.code;
            info.appendChild(code);
        }

        var text = document.createElement('span');
        text.className = 'aiq-coverage-text';
        text.textContent = criterion.text.length > 60 ? criterion.text.substring(0, 60) + '...' : criterion.text;
        text.title = criterion.text;
        info.appendChild(text);

        row.appendChild(info);

        // Question count badge
        var badge = document.createElement('span');
        badge.className = 'aiq-coverage-badge';
        if (count === 0) {
            badge.classList.add('aiq-coverage-badge--empty');
        }
        badge.textContent = count + ' Q';
        row.appendChild(badge);

        if (count > 0) {
            row.classList.add('aiq-coverage-item--covered');
        }

        return row;
    };

    Wizard.prototype.exportMappingCSV = function() {
        var self = this;
        var csv = 'Criterion Code,Criterion Text,Question Count,Status\n';

        this.data.criteria.forEach(function(criterion) {
            var count = self.data.generatedQuestions.filter(function(q) {
                return q.criterionId === criterion.id;
            }).length;

            var status = count === 0 ? 'Uncovered' : (count >= 2 ? 'Full Coverage' : 'Partial');
            var code = (criterion.code || '').replace(/"/g, '""');
            var text = criterion.text.replace(/"/g, '""');

            csv += '"' + code + '","' + text + '",' + count + ',"' + status + '"\n';
        });

        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (this.data.assessmentName || 'assessment') + '_mapping.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    Wizard.prototype.exportMappingPDF = function() {
        // Generate a printable HTML that can be saved as PDF
        var self = this;
        var html = '<!DOCTYPE html><html><head><title>Mapping Matrix - ' + this.data.assessmentName + '</title>';
        html += '<style>body{font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:0 auto}';
        html += 'h1{font-size:24px;margin-bottom:8px}h2{font-size:18px;color:#666;margin-bottom:24px}';
        html += 'table{width:100%;border-collapse:collapse;margin-top:20px}';
        html += 'th,td{padding:12px;text-align:left;border-bottom:1px solid #e5e7eb}';
        html += 'th{background:#f9fafb;font-weight:600}';
        html += '.covered{color:#22c55e}.uncovered{color:#ef4444}.partial{color:#eab308}';
        html += '@media print{body{padding:20px}}</style></head><body>';
        html += '<h1>' + (this.data.assessmentName || 'Assessment') + '</h1>';
        html += '<h2>Criteria Mapping Matrix</h2>';
        html += '<table><thead><tr><th>Status</th><th>Code</th><th>Criterion</th><th>Questions</th></tr></thead><tbody>';

        this.data.criteria.forEach(function(criterion) {
            var count = self.data.generatedQuestions.filter(function(q) {
                return q.criterionId === criterion.id;
            }).length;

            var statusClass = count === 0 ? 'uncovered' : (count >= 2 ? 'covered' : 'partial');
            var statusText = count === 0 ? 'Not Covered' : (count >= 2 ? 'Covered' : 'Partial');

            html += '<tr>';
            html += '<td class="' + statusClass + '">' + statusText + '</td>';
            html += '<td>' + (criterion.code || '-') + '</td>';
            html += '<td>' + criterion.text + '</td>';
            html += '<td>' + count + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        html += '<p style="margin-top:40px;color:#666;font-size:12px">Generated on ' + new Date().toLocaleDateString() + '</p>';
        html += '</body></html>';

        var printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(function() {
            printWindow.print();
        }, 250);
    };

    Wizard.prototype.triggerConfetti = function() {
        var container = document.createElement('div');
        container.className = 'aiq-confetti-container';
        document.body.appendChild(container);

        var colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        var particleCount = 100;

        for (var i = 0; i < particleCount; i++) {
            var particle = document.createElement('div');
            particle.className = 'aiq-confetti-particle';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            // Random size
            var size = Math.random() * 8 + 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            container.appendChild(particle);
        }

        // Remove after animation
        setTimeout(function() {
            container.remove();
        }, 4000);
    };

    Wizard.prototype.createSummaryRow = function(label, value) {
        var row = document.createElement('div');
        row.className = 'aiq-summary-row';

        var labelEl = document.createElement('span');
        labelEl.className = 'aiq-summary-row__label';
        labelEl.textContent = label;
        row.appendChild(labelEl);

        var valueEl = document.createElement('span');
        valueEl.className = 'aiq-summary-row__value';
        valueEl.textContent = value;
        row.appendChild(valueEl);

        return row;
    };

    Wizard.prototype.updateSteps = function(currentIndex) {
        var steps = document.querySelectorAll('.aiq-wizard-step');
        steps.forEach(function(step, index) {
            step.classList.remove('aiq-wizard-step--current', 'aiq-wizard-step--completed');
            step.removeAttribute('aria-current');
            step.setAttribute('aria-disabled', 'true');
            
            if (index < currentIndex) {
                step.classList.add('aiq-wizard-step--completed');
                step.setAttribute('aria-disabled', 'false');
            } else if (index === currentIndex) {
                step.classList.add('aiq-wizard-step--current');
                step.setAttribute('aria-current', 'step');
                step.setAttribute('aria-disabled', 'false');
            }
        });
    };

    Wizard.prototype.updateNavButtons = function() {
        if (this.currentScreen === 0) {
            this.navButtons.back.disable();
        } else {
            this.navButtons.back.enable();
        }

        if (this.currentScreen === SCREENS.length - 1) {
            this.navButtons.next.setText('Save Assessment');
        } else {
            this.navButtons.next.setText('Continue');
        }
    };

    Wizard.prototype.validateScreen = function(index) {
        switch (SCREENS[index]) {
            case 'entry':
                return this.data.assessmentName.trim().length > 0;
            case 'source':
                return this.data.criteria.length > 0;
            case 'criteria':
                return this.data.criteria.length > 0;
            case 'allocation':
                var hasAllocation = false;
                Object.values(this.data.allocations).forEach(function(a) {
                    if (a.count > 0) hasAllocation = true;
                });
                return hasAllocation;
            default:
                return true;
        }
    };

    Wizard.prototype.next = function() {
        var self = this;

        if (!this.validateScreen(this.currentScreen)) {
            alert('Please complete all required fields before continuing.');
            return;
        }

        // When leaving criteria screen, filter criteria based on type checkboxes
        if (SCREENS[this.currentScreen] === 'criteria') {
            this.filterCriteriaBySelectedTypes();
        }

        if (this.currentScreen === SCREENS.length - 1) {
            this.save();
        } else {
            this.goToScreen(this.currentScreen + 1);
        }
    };
    
    /**
     * Filter criteria to only include types that are checked.
     * Called when navigating away from the criteria screen.
     */
    Wizard.prototype.filterCriteriaBySelectedTypes = function() {
        var showPC = document.getElementById('aiq-filter-pc');
        var showPE = document.getElementById('aiq-filter-pe');
        var showKE = document.getElementById('aiq-filter-ke');

        var includePC = showPC ? showPC.checked : true;
        var includePE = showPE ? showPE.checked : true;
        var includeKE = showKE ? showKE.checked : true;

        // Filter criteria based on checked types
        this.data.criteria = this.data.criteria.filter(function(criterion) {
            if (criterion.type === 'performance' || (!criterion.type && criterion.code && criterion.code.match(/^\d+\.\d+/))) {
                return includePC;
            } else if (criterion.type === 'performanceEvidence' || criterion.type === 'evidence') {
                return includePE;
            } else if (criterion.type === 'knowledge') {
                return includeKE;
            } else {
                // Custom/unknown types default to PC behavior
                return includePC;
            }
        });

        // Clear allocations for removed criteria
        var validIds = {};
        this.data.criteria.forEach(function(c) {
            validIds[c.id] = true;
        });
        
        var allocKeys = Object.keys(this.data.allocations);
        for (var i = 0; i < allocKeys.length; i++) {
            if (!validIds[allocKeys[i]]) {
                delete this.data.allocations[allocKeys[i]];
            }
        }
    };

    Wizard.prototype.prev = function() {
        if (this.currentScreen > 0) {
            this.goToScreen(this.currentScreen - 1);
        }
    };

    Wizard.prototype.save = function() {
        var self = this;

        this.navButtons.next.setLoading(true);

        Api.request('save_assessment', {
            cmid: this.options.cmid,
            name: this.data.assessmentName,
            type: this.data.assessmentType,
            criteria: this.data.criteria,
            questions: this.data.generatedQuestions
        }).then(function(result) {
            window.location.href = result.redirectUrl;
        }).catch(function(error) {
            self.navButtons.next.setLoading(false);
            alert('Failed to save: ' + error.message);
        });
    };

    Wizard.prototype.destroy = function() {
        Object.values(this.navButtons).forEach(function(btn) {
            if (btn && btn.destroy) {
                btn.destroy();
            }
        });

        if (this.container) {
            this.container.innerHTML = '';
        }
    };

    return {
        init: function(options) {
            var wizard = new Wizard(options);
            return wizard.init();
        },
        Wizard: Wizard
    };
});
