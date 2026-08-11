# World-Class Question Generation System - Rebuild Plan

## Current State Analysis

### What EXISTS (but NOT integrated):
- **7-Screen Authoring Wizard** (`amd/src/authoring/wizard.js`) - Complete JavaScript SPA with:
  - Screen 0: Entry Point (assessment name, type selection)
  - Screen 1: Source Selection (TGA API or paste criteria)
  - Screen 2: Criteria Review (normalize, edit, reorder)
  - Screen 3: Allocation Matrix (questions per criterion per type)
  - Screen 4: AI Generation (progressive loading with real-time progress)
  - Screen 5: Review & Edit (edit questions before saving)
  - Screen 6: Compliance Summary (coverage report)

- **AI Generator** (`amd/src/ai/generator.js`) - Queue-based generation with progress callbacks
- **AI Prompts** (`amd/src/ai/prompts.js`) - Psychometric prompt engineering

### What's ACTUALLY Used (basic PHP form):
- `generate.php` renders basic PHP form with 2 tabs
- No progressive generation
- No review before saving
- No allocation matrix
- No compliance mapping
- Poor UX compared to world-class standards

---

## Phase 1: Wizard Integration (Priority: CRITICAL)

### 1.1 Update generate.php to Load Wizard AMD Module
```php
// Add to generate.php
$PAGE->requires->js_call_amd('mod_aiquiz/authoring/wizard', 'init', [[
    'containerId' => 'aiq-authoring-container',
    'quizId' => $aiquiz->id,
    'cmid' => $cm->id,
    'siteid' => $siteid,
    'apikey' => $apikey,
    'language' => $language
]]);
```

### 1.2 Replace PHP Form with Container
```php
// Replace form HTML with:
echo '<div id="aiq-authoring-container" class="aiq-authoring-container"></div>';
```

### 1.3 Add Required CSS
```php
$PAGE->requires->css('/mod/aiquiz/styles/authoring.css');
```

---

## Phase 2: TGA Integration Enhancement

### 2.1 Current Flow (Broken):
1. User enters unit code
2. AJAX lookup to ajax.php
3. Returns partial data
4. User must manually select evidence types

### 2.2 World-Class Flow:
1. **Smart Unit Autocomplete**
   - As user types, suggest matching units
   - Show unit title, currency status, supersession info
   
2. **Hierarchical Evidence Display**
   - Elements → Performance Criteria (expandable tree)
   - Knowledge Evidence (grouped by theme)
   - Performance Evidence (grouped by activity)
   - Foundation Skills (mapped to assessment)

3. **Evidence Selection Matrix**
   - Visual checkboxes for each element/PC
   - "Select All Knowledge Evidence" button
   - "Select All Performance Criteria" button
   - Smart defaults based on assessment type

4. **Competency Mapping Preview**
   - Show which PCs will be assessed
   - Identify gaps in coverage
   - Suggest minimum question count for compliance

---

## Phase 3: Question Type Selection

### 3.1 Visual Question Type Cards
Replace checkbox list with visual card grid:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MCQ 2x2       │ │   True/False    │ │   Matching      │
│   [icon]        │ │   [icon]        │ │   [icon]        │
│ Beautiful card  │ │ Statement-based │ │ Drag & drop     │
│ grid with A-D   │ │ with feedback   │ │ pairs           │
│                 │ │                 │ │                 │
│ [✓ Selected]    │ │ [ ] Select      │ │ [✓ Selected]    │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Ordering      │ │   Gap Fill      │ │   Category Sort │
│   [icon]        │ │   [icon]        │ │   [icon]        │
│ Sequence items  │ │ Select missing  │ │ Sort into       │
│ in order        │ │ words           │ │ categories      │
│                 │ │                 │ │                 │
│ [ ] Select      │ │ [ ] Select      │ │ [ ] Select      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 3.2 Question Type Recommendations
Based on criterion type, recommend appropriate question types:
- **Knowledge Evidence** → MCQ, True/False, Short Answer
- **Performance Criteria** → Ordering, Matching, Category Sort
- **Risk Assessment** → Category Sort (hazard/control classification)
- **Procedures** → Ordering, Gap Fill

---

## Phase 4: Allocation Matrix

### 4.1 Visual Allocation Grid
```
                        │ MCQ │ T/F │Match│Order│ Gap │Total
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────
PC 1.1 Identify hazards │  2  │  1  │  0  │  0  │  0  │  3
PC 1.2 Assess risks     │  1  │  0  │  1  │  0  │  1  │  3  
PC 1.3 Apply controls   │  0  │  0  │  0  │  1  │  0  │  1
KE 1 - Legislation      │  3  │  2  │  0  │  0  │  0  │  5
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────
TOTAL                   │  6  │  3  │  1  │  1  │  1  │ 12
```

### 4.2 Smart Defaults
- Apply minimum 2 questions per criterion (configurable)
- Auto-balance question types
- Show credit cost estimate

### 4.3 Bulk Actions
- "2 questions each" button
- "Knowledge focus" preset
- "Practical focus" preset
- "Comprehensive" preset

---

## Phase 5: Progressive AI Generation

### 5.1 Generation Queue UI
```
┌─────────────────────────────────────────────────────────┐
│ Generating Questions                                     │
│ ═══════════════════════════════░░░░░░░░░░░  67%         │
│                                                          │
│ ✓ PC 1.1 - Identify hazards (3 questions)               │
│ ✓ PC 1.2 - Assess risks (3 questions)                   │
│ ◉ PC 1.3 - Apply controls... generating                 │
│ ○ KE 1 - Legislation (5 questions)                      │
│                                                          │
│ [Cancel] [Pause]                                        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Real-Time Preview
As questions generate, show live preview:
- Question text
- Answer options
- Criterion mapping
- Difficulty indicator

### 5.3 Error Recovery
- Retry failed criteria
- Skip and continue option
- Regenerate individual questions

---

## Phase 6: Review & Edit Screen

### 6.1 Question Review Cards
```
┌─────────────────────────────────────────────────────────┐
│ Question 1 of 12                              [MCQ]     │
│ ────────────────────────────────────────────────────── │
│ PC 1.1 - Identify workplace hazards                    │
│                                                          │
│ Which of the following is classified as a physical      │
│ hazard in the workplace?                                 │
│                                                          │
│ A. ○ Workplace bullying         [Edit] [Regenerate]    │
│ B. ● Noise levels above 85dB    ← Correct              │
│ C. ○ Chemical exposure                                  │
│ D. ○ Fatigue from shift work                           │
│                                                          │
│ Feedback: Physical hazards include noise, vibration... │
│                                                          │
│ [←] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] [11] [12] [→]
└─────────────────────────────────────────────────────────┘
```

### 6.2 Bulk Edit Actions
- Delete multiple questions
- Regenerate selected
- Change difficulty level
- Edit answer options inline

### 6.3 Quality Indicators
- Show if distractors are too similar
- Flag questions with poor psychometric design
- Suggest improvements

---

## Phase 7: Compliance Summary

### 7.1 Coverage Matrix
```
┌─────────────────────────────────────────────────────────┐
│ BSBWHS411 - Compliance Coverage Report                  │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Element 1: Identify workplace hazards                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% (6 questions)│
│   ✓ PC 1.1 - 3 questions                               │
│   ✓ PC 1.2 - 3 questions                               │
│                                                          │
│ Element 2: Assess risks                                 │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 67% (2 questions) │
│   ✓ PC 2.1 - 2 questions                               │
│   ⚠ PC 2.2 - 0 questions (MISSING)                     │
│                                                          │
│ Knowledge Evidence Coverage: 100%                       │
│ Performance Criteria Coverage: 85%                      │
│                                                          │
│ [Add Missing Questions] [Export Mapping] [Save Quiz]   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Export Options
- Export mapping matrix (CSV/PDF)
- Generate assessment tool cover sheet
- Create student marking guide

---

## Implementation Priority

### Sprint 1 (Critical - 2-3 days):
1. ✗ Integrate wizard.js into generate.php
2. ✗ Connect TGA API lookup to wizard
3. ✗ Basic allocation matrix

### Sprint 2 (High - 2-3 days):
1. ✗ Progressive generation with real-time UI
2. ✗ Review & edit screen
3. ✗ Save generated questions

### Sprint 3 (Medium - 2-3 days):
1. ✗ Compliance summary
2. ✗ Coverage mapping
3. ✗ Export functionality

### Sprint 4 (Polish - 1-2 days):
1. ✗ Animation polish
2. ✗ Mobile optimization
3. ✗ Accessibility improvements

---

## Technical Requirements

### Backend (ajax.php endpoints):
- `lookup_unit` - TGA unit lookup (EXISTS, needs enhancement)
- `generate_questions` - AI generation endpoint (EXISTS)
- `regenerate_question` - Single question regeneration (NEW)
- `save_questions` - Batch save generated questions (EXISTS)

### Frontend (AMD modules):
- `authoring/wizard.js` - Main wizard (EXISTS, not integrated)
- `ai/generator.js` - AI generation queue (EXISTS)
- `ai/prompts.js` - Prompt engineering (EXISTS)
- `core/api.js` - AJAX communication (EXISTS)
- `core/state.js` - State management (EXISTS)
- `core/animations.js` - UI animations (EXISTS)

### CSS:
- `styles/authoring.css` - Wizard-specific styles (NEW)
- `styles/tokens.css` - Design tokens (EXISTS)
- `styles/bridge.css` - Moodle bridge (EXISTS)

---

## Success Criteria

1. **User Experience**
   - Time to generate 10 questions: < 60 seconds
   - Zero page reloads during wizard flow
   - Clear progress indication at every step
   - Ability to go back and modify selections

2. **Quality**
   - Questions map clearly to criteria/PCs
   - Distractors are pedagogically sound
   - Feedback explains why answers are correct/incorrect

3. **Compliance**
   - Full coverage of selected PCs
   - Mapping matrix exportable for audit
   - RTO-ready documentation

4. **Accessibility**
   - WCAG 2.1 AA compliant
   - Keyboard navigable
   - Screen reader friendly

---

## Approval Required

This rebuild will transform the question generation from a basic form into a world-class, 
Duolingo/Linear-inspired experience. Estimated effort: 6-10 days.

**Approve to begin Phase 1 integration?**
