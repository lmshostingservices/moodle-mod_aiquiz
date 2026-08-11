# AI Quiz Plugin - Comprehensive Rebuild Plan

**Version:** 3.0.0  
**Date:** December 2025  
**Status:** COMPLETE OVERHAUL - World-Class Educational Experience

---

## Executive Summary

This document outlines a complete rebuild of the AI Quiz plugin to deliver a world-class, mobile-first student experience comparable to Kahoot, Typeform, and Duolingo. The current implementation has severe architectural issues - the AMD JavaScript components exist but are never loaded, resulting in a basic HTML form experience instead of the premium interactions designed.

---

## Part 1: Current State Analysis

### 1.1 Architecture Problems

| Component | Problem | Impact |
|-----------|---------|--------|
| `view.php` | Inline HTML with `echo` statements | No modern UI patterns |
| `attempt.php` | 1,326 lines mixing logic + presentation | Unmaintainable, slow |
| `review.php` | Inline HTML, no JavaScript | Static, boring review |
| AMD modules | **Exist but never loaded** | Premium components unused |
| Templates | No Mustache templates | PHP spaghetti code |

### 1.2 User Flow Problems

```
CURRENT FLOW (Poor UX):
┌─────────────────────────────────────────────────────────────────────────┐
│ view.php                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│ │ Basic info card │ │ Basic info card │ │ Basic info card │            │
│ │ Questions: 10   │ │ Time: 30 min    │ │ Pass: 80%       │            │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘            │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Attempts table (ugly HTML table)                                    │  │
│ │ | Attempt | State | Grade | Date | Actions |                        │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                    [Start Attempt] (boring button)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ attempt.php (1,326 lines of PHP spaghetti)                               │
│                                                                          │
│ [Mode Badge]                                    [Timer: 00:29:45]        │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Progress: [1][2][3][4][5][6][7][8][9][10] (basic numbered boxes)   │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Question 1 of 10                                                    │  │
│ │ What is the correct PPE for welding?                                │  │
│ │                                                                      │  │
│ │ ○ Safety glasses        ○ Welding helmet   ← Basic radio buttons   │  │
│ │ ○ Hard hat              ○ Gloves            rendered server-side    │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ [Previous]                                              [Submit Answer]  │
│                                                                          │
│ (Page refreshes on every action - no JavaScript interactivity)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                     (Server redirect for feedback)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ review.php (Static HTML dump)                                            │
│                                                                          │
│ Score: 80% ✓ Passed                                                      │
│                                                                          │
│ Question 1: ✓ Correct                                                    │
│ Question 2: ✗ Incorrect                                                  │
│ ... (wall of text)                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Missing Features

- No smooth question transitions
- No instant feedback modals (uses page redirects)
- No celebration for perfect scores
- No proper SVG icons (uses FontAwesome or text ✓/✗)
- No 2x2 card grid for MCQ (despite CSS being ready)
- No drag-and-drop for matching/ordering (despite JS being ready)
- No partial credit visualization
- No keyboard navigation
- No ARIA live announcements
- No 480px mobile breakpoint

---

## Part 2: Target State Vision

### 2.1 Design Philosophy

> **"Every interaction should feel like Duolingo meets Linear.app"**

| Principle | Implementation |
|-----------|----------------|
| **Calm confidence** | Soft shadows, white backgrounds, subtle animations |
| **Instant feedback** | JavaScript modals, no page refreshes |
| **Celebration** | Trophy overlay for 100%, confetti for pass |
| **Mobile-first** | 44px touch targets, 480px breakpoint |
| **Accessible** | ARIA labels, keyboard nav, focus indicators |

### 2.2 Target User Flow

```
NEW FLOW (World-Class UX):
┌─────────────────────────────────────────────────────────────────────────┐
│ QUIZ LANDING (Engaging Entry Point)                                      │
│                                                                          │
│                         ┌─────────────────────┐                          │
│                         │    📋 QUIZ ICON     │                          │
│                         └─────────────────────┘                          │
│                                                                          │
│                    Workplace Health & Safety                             │
│                    Assessment Module 3                                   │
│                                                                          │
│     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│     │ ❓ 10   │     │ ⏱️ 30m  │     │ ✓ 80%   │     │ 🔄 3    │         │
│     │Questions│     │  Limit  │     │ To Pass │     │Attempts │         │
│     └─────────┘     └─────────┘     └─────────┘     └─────────┘         │
│                                                                          │
│                    Your Best: 85% ✓ Passed                               │
│                                                                          │
│     ┌───────────────────────────────────────────────────────────────┐   │
│     │ Previous Attempts                                              │   │
│     │ ┌─────────────────────────────────────────────────────────┐   │   │
│     │ │ Attempt 2 • Dec 15, 2025 • 85% ✓ • [Review]            │   │   │
│     │ │ Attempt 1 • Dec 14, 2025 • 70% ✗ • [Review]            │   │   │
│     │ └─────────────────────────────────────────────────────────┘   │   │
│     └───────────────────────────────────────────────────────────────┘   │
│                                                                          │
│             ┌─────────────────────────────────────┐                      │
│             │  ▶ START NEW ATTEMPT (2 remaining) │  ← Prominent CTA     │
│             └─────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        (Smooth fade transition)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ QUIZ ATTEMPT (Premium Interactive Experience)                            │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ● Immediate Feedback                              ⏱️ 29:45 remaining │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ PROGRESS BAR (Linear.app style - segmented, gentle pulse on current)│ │
│ │ [✓][✓][✗][●][○][○][○][○][○][○]  4 of 10 • 30% complete             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                        1 mark       │ │
│ │ Question 4 of 10                                                     │ │
│ │                                                                      │ │
│ │ What is the correct PPE for welding operations?                      │ │
│ │                                                                      │ │
│ │  ┌────────────────────┐  ┌────────────────────┐   ← 2x2 CARD GRID   │ │
│ │  │ A                   │  │ B                   │                     │ │
│ │  │ Safety glasses      │  │ Welding helmet      │   Cards have:       │ │
│ │  │                     │  │                     │   - Hover lift      │ │
│ │  └────────────────────┘  └────────────────────┘   - Selection glow   │ │
│ │                                                    - Letter badges    │ │
│ │  ┌────────────────────┐  ┌────────────────────┐                      │ │
│ │  │ C                   │  │ D                   │                     │ │
│ │  │ Hard hat            │  │ Gloves only         │                     │ │
│ │  │                     │  │                     │                     │ │
│ │  └────────────────────┘  └────────────────────┘                      │ │
│ │                                                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [← Previous]                                       [Submit Answer →]│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    (Click Submit - NO page refresh)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ INSTANT FEEDBACK MODAL (JavaScript overlay, not server redirect)         │
│                                                                          │
│          ┌─────────────────────────────────────────┐                     │
│          │                                         │                     │
│          │           ┌─────────┐                   │                     │
│          │           │  ✓ SVG  │  ← Animated      │                     │
│          │           │ Checkmark│   checkmark      │                     │
│          │           └─────────┘                   │                     │
│          │                                         │                     │
│          │              Correct!                   │                     │
│          │                                         │                     │
│          │   Welding helmets protect eyes from     │                     │
│          │   intense UV light and sparks.          │                     │
│          │                                         │                     │
│          │        [Continue to Next →]             │                     │
│          │                                         │                     │
│          └─────────────────────────────────────────┘                     │
│                                                                          │
│  (Background: previous question with correct answer highlighted green)   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
              (After last question - if score = 100%)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ CELEBRATION OVERLAY (Trophy + Stars + Confetti)                          │
│                                                                          │
│                    ⭐                                                     │
│                  ⭐   ⭐                                                  │
│                                                                          │
│                   🏆                                                     │
│                                                                          │
│                  100%                                                    │
│                                                                          │
│              PERFECT SCORE!                                              │
│                                                                          │
│          You answered all questions                                      │
│               correctly!                                                 │
│                                                                          │
│              [View Results]                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ RESULTS DASHBOARD (Visual, Actionable)                                   │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │              Your Score                   Stats                      │ │
│ │           ┌───────────┐               ┌──────────────┐               │ │
│ │           │           │               │ ⏱️ 12:34     │               │ │
│ │           │    85%    │               │ Time taken    │               │ │
│ │           │           │               ├──────────────┤               │ │
│ │           │  ✓ Passed │               │ ✓ 8/10       │               │ │
│ │           └───────────┘               │ Correct       │               │ │
│ │               ↑                       └──────────────┘               │ │
│ │         Circular progress                                            │ │
│ │         with animation                                               │ │
│ │                                                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Question Review                                                      │ │
│ │                                                                      │ │
│ │ ┌─ Q1 ─────────────────────────────────────────────────────────────┐│ │
│ │ │ ✓ What PPE for welding?                           [Expand ▼]     ││ │
│ │ └──────────────────────────────────────────────────────────────────┘│ │
│ │ ┌─ Q2 ─────────────────────────────────────────────────────────────┐│ │
│ │ │ ✗ Identify the hazard...                          [Expand ▼]     ││ │
│ │ │   Your answer: Noise                                              ││ │
│ │ │   Correct: Electrical shock                                       ││ │
│ │ └──────────────────────────────────────────────────────────────────┘│ │
│ │                                                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│           [← Back to Quiz]          [Retry Quiz]                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Design System Specifications

### 3.1 Color Tokens (Already in tokens.css)

```css
/* Backgrounds - White-first design */
--bg-page: #FAFAFA;
--bg-card: #FFFFFF;
--bg-muted: #F4F4F5;

/* Text hierarchy */
--text-primary: #18181B;
--text-secondary: #52525B;
--text-tertiary: #A1A1AA;

/* Accent - Moodle primary or fallback blue */
--accent: hsl(217 91% 60%);
--accent-muted: hsl(217 91% 97%);

/* Feedback states */
--success: hsl(142 76% 36%);
--error: hsl(0 84% 60%);
--warning: hsl(38 92% 50%);

/* Shadows - Soft, subtle */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.06);
```

### 3.2 Typography

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 2rem;      /* 32px */
```

### 3.3 Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
```

### 3.4 Animation Tokens

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--ease: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Part 4: Screen-by-Screen Specifications

### 4.1 Quiz Landing Page (view.php → view.js)

**Purpose:** Engage and inform before starting

**Components:**
1. Quiz header with title + description
2. Stats cards (questions, time, pass mark, attempts)
3. Best grade display (with pass/fail visual)
4. Attempts history (card-based, not table)
5. Prominent Start CTA

**Requirements:**
- [ ] Load via AMD JavaScript module `mod_aiquiz/view`
- [ ] Render stats as icon + number cards in flexbox row
- [ ] Show circular progress for best grade
- [ ] Attempts as stacked cards with expand/collapse
- [ ] "Start Attempt" button with remaining attempts count
- [ ] Disable start if no attempts remaining
- [ ] Show countdown if quiz opens in future

**Mobile (< 600px):**
- [ ] Stats cards stack 2x2
- [ ] Full-width start button

### 4.2 Quiz Attempt Page (attempt.php → attempt.js)

**Purpose:** Smooth, focused question-answering experience

**Layout Zones:**
```
┌────────────────────────────────────────────────────────┐
│ HEADER BAR                                              │
│ [Mode Badge]            [Timer]           [Exit ✕]     │
├────────────────────────────────────────────────────────┤
│ PROGRESS BAR                                            │
│ [Segmented progress with question status indicators]   │
├────────────────────────────────────────────────────────┤
│ QUESTION AREA                                           │
│ [Question number + marks]                               │
│ [Question text]                                         │
│ [Answer component - varies by question type]           │
├────────────────────────────────────────────────────────┤
│ NAVIGATION                                              │
│ [Previous] [Question navigator dropdown] [Next/Submit] │
└────────────────────────────────────────────────────────┘
```

**State Machine:**
```
STATES:
- loading          → Fetching questions
- answering        → Student selecting answer
- submitting       → Answer being graded
- showing_feedback → Feedback modal visible (immediate/adaptive)
- reviewing        → Deferred mode review before submit
- finished         → Redirecting to results

TRANSITIONS:
loading → answering           (questions loaded)
answering → submitting        (submit clicked)
submitting → showing_feedback (immediate/adaptive mode)
submitting → answering        (deferred mode, next question)
showing_feedback → answering  (continue clicked)
answering → reviewing         (deferred mode, last question)
reviewing → finished          (submit all clicked)
```

**Requirements:**
- [ ] Single Page Application - no page refreshes during attempt
- [ ] Questions loaded via AJAX on attempt start
- [ ] Current question rendered by appropriate question type module
- [ ] Answer selection updates state immediately (no submit needed to save)
- [ ] Auto-save every 30 seconds
- [ ] Timer with warning states (5 min, 1 min remaining)
- [ ] Feedback modal for immediate/adaptive modes
- [ ] Question navigator for jumping between questions
- [ ] Keyboard shortcuts (1-4 for MCQ, Enter to submit, arrows for nav)

### 4.3 Feedback Modal (immediate/adaptive modes)

**Purpose:** Instant, celebratory feedback after each question

**States:**
1. **Correct** - Green checkmark, pulse animation, success message
2. **Incorrect** - Red X, shake animation, correct answer shown
3. **Partial** - Yellow indicator, partial credit message

**Components:**
```javascript
FeedbackModal({
    type: 'correct' | 'incorrect' | 'partial',
    message: 'Welding helmets protect eyes from UV light.',
    correctAnswer: 'B. Welding helmet', // shown if incorrect
    userAnswer: 'A. Safety glasses',     // shown if incorrect
    canRetry: true,                      // adaptive mode
    onContinue: () => {},
    onRetry: () => {}
})
```

**Requirements:**
- [ ] Overlay with backdrop blur
- [ ] Animated SVG icon (checkmark draws in, X shakes)
- [ ] ARIA live announcement for screen readers
- [ ] Continue button (primary) and Retry button (if adaptive)
- [ ] Auto-advance after 2 seconds if correct (optional setting)
- [ ] Keyboard: Enter to continue, R to retry

### 4.4 Celebration Overlay (100% Score)

**Purpose:** Memorable moment for perfect performance

**Elements:**
- Trophy SVG (animated scale-in)
- "100%" large text
- "PERFECT SCORE!" headline
- Stars animation (twinkling)
- Confetti particles (optional)
- "View Results" button

**Requirements:**
- [ ] Only shown for 100% score
- [ ] 2.5 second display before allowing dismiss
- [ ] Accessible: ARIA announcement of achievement
- [ ] Respects prefers-reduced-motion

### 4.5 Results Dashboard (review.php → results.js)

**Purpose:** Comprehensive, actionable results review

**Sections:**
1. **Score Hero** - Large circular progress with percentage
2. **Stats Row** - Time taken, correct count, grade status
3. **Question Accordion** - Expandable per-question review
4. **Action Buttons** - Back to quiz, Retry attempt

**Question Review Item:**
```
┌────────────────────────────────────────────────────────┐
│ ✓ Q1: What PPE for welding?                  [▼ Expand]│
└────────────────────────────────────────────────────────┘
    ↓ (expanded)
┌────────────────────────────────────────────────────────┐
│ What PPE is required for welding operations?           │
│                                                         │
│ ┌────────────────────┐  ┌────────────────────┐         │
│ │ A. Safety glasses  │  │ B. Welding helmet ✓│ ← Your │
│ └────────────────────┘  └────────────────────┘   answer│
│ ┌────────────────────┐  ┌────────────────────┐         │
│ │ C. Hard hat        │  │ D. Gloves only     │         │
│ └────────────────────┘  └────────────────────┘         │
│                                                         │
│ 💡 Welding helmets protect eyes from intense UV light. │
└────────────────────────────────────────────────────────┘
```

**Requirements:**
- [ ] Animated score counter (0 → final %)
- [ ] Green/red badge for pass/fail
- [ ] Expandable question cards
- [ ] Show correct answer for incorrect questions
- [ ] Show feedback text if available
- [ ] Matching questions show stem-choice pairs
- [ ] Ordering questions show correct vs submitted order

---

## Part 5: Question Type Specifications

### 5.1 MCQ Cards (FLAGSHIP)

**File:** `amd/src/questions/mcq_cards.js`

**Layout:** 2x2 grid on desktop, 1 column on mobile

**Card States:**
| State | Border | Background | Shadow |
|-------|--------|------------|--------|
| Default | `var(--border-soft)` | `var(--bg-card)` | None |
| Hover | `var(--border-strong)` | `var(--bg-card)` | `var(--shadow-sm)` |
| Selected | `var(--accent)` | `var(--accent-muted)` | Glow |
| Correct | `var(--success)` | `var(--success-muted)` | Pulse animation |
| Incorrect | `var(--error)` | `var(--error-muted)` | Shake animation |

**Features:**
- [ ] Letter badge (A, B, C, D) in top-left
- [ ] Entire card clickable (not just radio)
- [ ] Hidden radio inputs (visual-only cards)
- [ ] Keyboard: 1-4 or A-D to select, Tab to navigate
- [ ] Touch: 44px minimum touch target

### 5.2 True/False Block

**File:** `amd/src/questions/tf_block.js`

**Layout:** Multiple statements, each with T/F toggle

```
┌────────────────────────────────────────────────────────┐
│ Statement 1: Hard hats must be worn on site.           │
│                                          [TRUE] [FALSE]│
├────────────────────────────────────────────────────────┤
│ Statement 2: Gloves are optional for chemical handling.│
│                                          [TRUE] [FALSE]│
├────────────────────────────────────────────────────────┤
│ Statement 3: Safety glasses protect from UV light.     │
│                                          [TRUE] [FALSE]│
└────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Statement card with True/False button pair
- [ ] Buttons act as toggle (only one selected)
- [ ] Correct/incorrect shown per statement on reveal
- [ ] Partial credit based on correct statements

### 5.3 Matching

**File:** `amd/src/questions/matching.js`

**Interaction:** Click stem → click choice to connect

```
STEMS                              CHOICES
┌─────────────────┐               ┌─────────────────┐
│ Welding         │ ───────────── │ Helmet + gloves │
└─────────────────┘               └─────────────────┘
┌─────────────────┐               ┌─────────────────┐
│ Chemical spill  │               │ Face shield     │ (unmatched)
└─────────────────┘               └─────────────────┘
┌─────────────────┐               ┌─────────────────┐
│ Noise exposure  │               │ Ear protection  │
└─────────────────┘               └─────────────────┘
```

**Features:**
- [ ] Two-column layout with SVG connection lines
- [ ] Click-to-connect interaction (not drag)
- [ ] Lines animate in on connection
- [ ] Remove connection by clicking connected item
- [ ] Correct/incorrect line colors on reveal

### 5.4 Category Sorting (NEW - WHS Priority)

**File:** `amd/src/questions/category_sort.js`

**Purpose:** Sort items into labeled buckets (e.g., Hazard vs Control)

```
┌─────────────────────────────────────────────────────────┐
│ UNSORTED ITEMS                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │Wet floor│ │Warning  │ │Trailing │ │First aid│        │
│ │         │ │signs    │ │cables   │ │kit      │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────┘
          ↓ (drag items down to categories) ↓
┌───────────────────────────┐ ┌───────────────────────────┐
│ 🔴 HAZARD                 │ │ 🟢 CONTROL MEASURE        │
│                           │ │                           │
│ Drop items here           │ │ Drop items here           │
│                           │ │                           │
│ ┌─────────┐               │ │ ┌─────────┐               │
│ │Wet floor│ ✓             │ │ │Warning  │ ✓             │
│ └─────────┘               │ │ │signs    │               │
│                           │ │ └─────────┘               │
└───────────────────────────┘ └───────────────────────────┘
```

**Features:**
- [ ] Drag-and-drop with touch support
- [ ] 2-4 category buckets (color-coded)
- [ ] Keyboard navigation with space to pick up/drop
- [ ] Item count per category shown
- [ ] Partial credit based on correct placements
- [ ] Correct bucket shown for misplaced items on reveal

### 5.5 Ordering / Sequence

**File:** `amd/src/questions/ordering.js`

**Purpose:** Drag items into correct sequence

```
Put these steps in the correct order:

┌─────────────────────────────────────────────────┐
│ 1 │ Identify the hazard                         │ ≡
├─────────────────────────────────────────────────┤
│ 2 │ Assess the risk                             │ ≡
├─────────────────────────────────────────────────┤
│ 3 │ Implement controls                          │ ≡
├─────────────────────────────────────────────────┤
│ 4 │ Review effectiveness                        │ ≡
└─────────────────────────────────────────────────┘
       ↑ Drag handle on right
```

**Features:**
- [ ] Drag handle for reordering
- [ ] Ghost placeholder during drag
- [ ] Number badges update as items move
- [ ] Keyboard: arrows + Enter to move
- [ ] Partial credit based on correct adjacent pairs

### 5.6 Gap Fill (Dropdown)

**File:** `amd/src/questions/gap_dropdown.js`

**Purpose:** Select words from dropdown to complete sentence

```
A ▼[select word] must be conducted before starting work.
The ▼[select word] is responsible for site safety.
```

**Features:**
- [ ] Inline dropdowns styled to match design system
- [ ] Options loaded from answer data
- [ ] Correct/incorrect highlight on reveal
- [ ] Partial credit per correct gap

### 5.7 Gap Fill (Drag)

**File:** `amd/src/questions/gap_drag.js`

**Purpose:** Drag words into sentence gaps

```
WORD BANK: [risk assessment] [supervisor] [safety officer] [permit]

A _______ must be conducted before starting work.
The _______ is responsible for site safety.
```

**Features:**
- [ ] Word bank at top
- [ ] Drop zones in sentence
- [ ] Words return to bank if removed
- [ ] Used words visually dimmed in bank
- [ ] Touch-friendly drag on mobile

### 5.8 Short Answer

**File:** `amd/src/questions/short_answer.js`

**Purpose:** Text input with AI-assisted matching

```
┌─────────────────────────────────────────────────────────┐
│ What document must be completed before confined space   │
│ entry?                                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Entry permit                                        ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ 💡 Accepted answers: entry permit, confined space      │
│    permit, work permit                                  │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Text input with character counter (if limit)
- [ ] Case-insensitive matching
- [ ] Wildcard pattern support
- [ ] Multiple accepted answers
- [ ] Show accepted answers on reveal if incorrect

### 5.9 Numeric

**File:** `amd/src/questions/numeric.js`

**Purpose:** Number input with tolerance

```
┌─────────────────────────────────────────────────────────┐
│ What is the maximum noise level (dB) before hearing    │
│ protection is required?                                 │
│                                                         │
│ ┌─────────────────┐                                     │
│ │ 85              │ dB                                  │
│ └─────────────────┘                                     │
│                                                         │
│ Accepted range: 83-87 dB                                │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Number input with optional unit suffix
- [ ] Tolerance range display
- [ ] Partial credit for close answers (optional)

### 5.10 Drag Table (Hazard/Control Matrix)

**File:** `amd/src/questions/drag_table.js`

**Purpose:** Match hazards to controls in table format

```
┌──────────────────────┬────────────────────────────────┐
│ HAZARD               │ CONTROL MEASURE                │
├──────────────────────┼────────────────────────────────┤
│ Working at height    │ [Drop zone for draggable]     │
├──────────────────────┼────────────────────────────────┤
│ Manual handling      │ [Drop zone for draggable]     │
├──────────────────────┼────────────────────────────────┤
│ Chemical exposure    │ [Drop zone for draggable]     │
└──────────────────────┴────────────────────────────────┘

CONTROL BANK:
[Fall arrest] [Mechanical aids] [PPE] [Ventilation]
```

**Features:**
- [ ] Table with fixed left column (hazards)
- [ ] Right column has drop zones
- [ ] Drag items from bank to appropriate row
- [ ] Multiple items per row (if applicable)
- [ ] Mobile: horizontal scroll with sticky first column

---

## Part 6: Feedback System Specifications

### 6.1 SVG Icons

Replace all text-based ✓/✗ with proper SVG icons:

```javascript
// In ui/Feedback.js
const Icons = {
    checkmark: `<svg viewBox="0 0 24 24">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5"/>
    </svg>`,
    
    cross: `<svg viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5"/>
    </svg>`,
    
    partial: `<svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
    </svg>`,
    
    retry: `<svg viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
    </svg>`,
    
    trophy: `<svg viewBox="0 0 24 24">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>`
};
```

### 6.2 Animation Keyframes

```css
@keyframes aiq-iconPop {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes aiq-checkDraw {
    0% { stroke-dashoffset: 24; }
    100% { stroke-dashoffset: 0; }
}

@keyframes aiq-incorrectShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
}

@keyframes aiq-starTwinkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}
```

### 6.3 ARIA Announcements

```javascript
// Create live region for screen reader announcements
const liveRegion = document.createElement('div');
liveRegion.setAttribute('role', 'status');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.className = 'sr-only';
document.body.appendChild(liveRegion);

// Announce feedback
function announceFeedback(type, message) {
    const announcements = {
        correct: 'Correct! ' + message,
        incorrect: 'Incorrect. ' + message,
        partial: 'Partially correct. ' + message
    };
    liveRegion.textContent = announcements[type];
}
```

---

## Part 7: Mobile Specifications

### 7.1 Breakpoints

```css
/* Extra small phones */
@media (max-width: 480px) {
    .aiq-card-grid--2col { grid-template-columns: 1fr; }
    .aiq-catsort-categories { grid-template-columns: 1fr; }
}

/* Standard mobile */
@media (max-width: 600px) {
    .aiq-answers-list { grid-template-columns: 1fr; }
    .aiq-stats-cards { grid-template-columns: repeat(2, 1fr); }
}

/* Tablet */
@media (max-width: 900px) {
    .aiq-container { padding: var(--space-4); }
}
```

### 7.2 Touch Targets

All interactive elements must have minimum 44x44px touch area:

```css
.aiq-touch-target {
    position: relative;
    min-width: 44px;
    min-height: 44px;
}

/* Invisible touch area expansion */
.aiq-touch-target::before {
    content: '';
    position: absolute;
    inset: -8px;
}
```

### 7.3 Mobile Navigation

- Swipe left/right for question navigation (optional)
- Bottom-fixed navigation bar on mobile
- Floating action button for submit

---

## Part 8: Accessibility Specifications

### 8.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Select current option |
| 1-4 or A-D | Select MCQ option directly |
| Arrow keys | Navigate options, reorder items |
| Escape | Close modal, cancel drag |

### 8.2 ARIA Requirements

```html
<!-- Progress bar -->
<div role="progressbar" aria-valuenow="4" aria-valuemin="1" aria-valuemax="10">
    Question 4 of 10
</div>

<!-- MCQ cards -->
<div role="radiogroup" aria-label="Answer options">
    <div role="radio" aria-checked="true" tabindex="0">Option A</div>
    <div role="radio" aria-checked="false" tabindex="-1">Option B</div>
</div>

<!-- Timer -->
<div role="timer" aria-live="polite" aria-label="Time remaining">
    29:45
</div>

<!-- Feedback -->
<div role="alert" aria-live="assertive">
    Correct! Great job.
</div>
```

### 8.3 Focus Management

```javascript
// After showing feedback modal
feedbackModal.querySelector('[data-autofocus]').focus();

// After closing modal
previouslyFocusedElement.focus();

// Focus visible indicator
.aiq-focusable:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
```

---

## Part 9: Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Set up AMD module loading and basic SPA architecture

| Task | Files | Est. Hours |
|------|-------|------------|
| Create `amd/src/view.js` entry point | New file | 4h |
| Create `amd/src/attempt.js` entry point | New file | 6h |
| Create `amd/src/results.js` entry point | New file | 4h |
| Update `view.php` to load AMD module | Modify | 2h |
| Update `attempt.php` to load AMD module | Modify | 2h |
| Update `review.php` to load AMD module | Modify | 2h |
| Create AJAX endpoints for questions/responses | `ajax.php` | 4h |

**Deliverable:** Pages load JavaScript modules, questions fetched via AJAX

### Phase 2: Question Types (Week 2)

**Goal:** All question types render client-side with proper interactions

| Task | Files | Est. Hours |
|------|-------|------------|
| Update `mcq_cards.js` for new state flow | Modify | 4h |
| Update `tf_block.js` for new state flow | Modify | 3h |
| Update `matching.js` with SVG lines | Modify | 5h |
| Update `ordering.js` with drag-drop | Modify | 4h |
| Update `category_sort.js` (already good) | Review | 2h |
| Update `gap_dropdown.js` | Modify | 3h |
| Update `gap_drag.js` | Modify | 4h |
| Update `short_answer.js` | Modify | 2h |
| Update `numeric.js` | Modify | 2h |
| Update `drag_table.js` | Modify | 4h |

**Deliverable:** All question types render with proper interactions

### Phase 3: Feedback System (Week 3)

**Goal:** Instant feedback modals with animations

| Task | Files | Est. Hours |
|------|-------|------------|
| Update `Feedback.js` with new modal | Modify | 4h |
| Add animation keyframes to CSS | `premium.css` | 3h |
| Implement celebration overlay | `Feedback.js` | 4h |
| Add ARIA live announcements | Multiple | 3h |
| Integrate feedback into attempt flow | `attempt.js` | 4h |

**Deliverable:** Feedback modals work for all modes

### Phase 4: Polish & Mobile (Week 4)

**Goal:** World-class mobile experience

| Task | Files | Est. Hours |
|------|-------|------------|
| Add 480px breakpoint | All CSS | 4h |
| Implement 44px touch targets | All components | 4h |
| Add keyboard navigation | All components | 6h |
| Focus management | Multiple | 3h |
| Timer enhancements | `attempt.js` | 2h |
| Progress bar Linear.app style | CSS + JS | 3h |

**Deliverable:** Mobile-first, accessible quiz experience

### Phase 5: Results Dashboard (Week 5)

**Goal:** Beautiful, informative results page

| Task | Files | Est. Hours |
|------|-------|------------|
| Create `results.js` with score animation | New/Modify | 4h |
| Question accordion component | New | 4h |
| Per-question type review display | Multiple | 6h |
| Retry and back buttons | `results.js` | 2h |
| Stats visualization | `results.js` | 4h |

**Deliverable:** Complete results dashboard

---

## Part 10: File Structure

### 10.1 New/Modified Files

```
mod_aiquiz/
├── amd/
│   └── src/
│       ├── view.js              ← NEW: Quiz landing SPA
│       ├── attempt.js           ← MAJOR UPDATE: Quiz attempt SPA
│       ├── results.js           ← NEW: Results dashboard SPA
│       ├── core/
│       │   ├── api.js           ← UPDATE: AJAX calls
│       │   ├── state.js         ← UPDATE: State management
│       │   └── animations.js    ← UPDATE: New animations
│       ├── questions/
│       │   ├── mcq_cards.js     ← UPDATE: Connect to attempt.js
│       │   ├── tf_block.js      ← UPDATE
│       │   ├── matching.js      ← UPDATE
│       │   ├── ordering.js      ← UPDATE
│       │   ├── sorting.js       ← UPDATE
│       │   ├── category_sort.js ← Already good
│       │   ├── gap_dropdown.js  ← UPDATE
│       │   ├── gap_drag.js      ← UPDATE
│       │   ├── short_answer.js  ← UPDATE
│       │   ├── numeric.js       ← UPDATE
│       │   └── drag_table.js    ← UPDATE
│       └── ui/
│           ├── Feedback.js      ← UPDATE: Modal + celebration
│           ├── Card.js          ← Already good
│           ├── ProgressBar.js   ← UPDATE: Segmented style
│           └── Timer.js         ← NEW: Premium timer component
├── styles/
│   ├── tokens.css               ← Review: ensure complete
│   ├── bridge.css               ← UPDATE: New component styles
│   └── premium.css              ← UPDATE: Animations, polish
├── templates/
│   └── attempt.mustache         ← NEW: Minimal PHP, JS takes over
├── ajax.php                     ← UPDATE: New endpoints
├── view.php                     ← SIMPLIFY: Load JS, minimal HTML
├── attempt.php                  ← SIMPLIFY: Load JS, minimal HTML
└── review.php                   ← SIMPLIFY: Load JS, minimal HTML
```

### 10.2 AJAX Endpoints Needed

```php
// ajax.php endpoints
switch ($action) {
    case 'get_attempt_data':
        // Returns all questions, current state, timer info
        break;
    case 'save_response':
        // Saves single question response
        break;
    case 'get_feedback':
        // Gets feedback for graded response
        break;
    case 'finish_attempt':
        // Finalizes attempt, returns results
        break;
    case 'get_results':
        // Gets full results for review
        break;
}
```

---

## Part 11: Testing Requirements

### 11.1 Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

### 11.2 Accessibility Testing

- [ ] WAVE browser extension
- [ ] aXe DevTools
- [ ] Keyboard-only navigation
- [ ] Screen reader (VoiceOver, NVDA)

### 11.3 Performance Testing

- [ ] Lighthouse score > 90
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s

---

## Part 12: Success Metrics

### 12.1 UX Quality Bar

| Metric | Target |
|--------|--------|
| No page refreshes during attempt | ✓ |
| Question transition time | < 200ms |
| Feedback modal appears | < 100ms |
| Celebration animation | Smooth 60fps |
| Touch target size | ≥ 44px |
| Mobile layout | No horizontal scroll |

### 12.2 Accessibility Compliance

| Standard | Target |
|----------|--------|
| WCAG 2.1 AA | Full compliance |
| Keyboard navigable | All interactions |
| Screen reader | Full support |
| Color contrast | 4.5:1 minimum |

---

## Appendix A: Design Inspiration

- **Duolingo** - Gamification, celebration effects, mobile-first
- **Kahoot** - Fast-paced, visual feedback, engagement
- **Typeform** - One question at a time, smooth transitions
- **Linear.app** - Calm, professional, segmented progress
- **Notion** - Clean typography, white-first design

---

## Appendix B: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing attempts | Maintain backward compatibility with PHP rendering |
| Moodle theme conflicts | Namespace all CSS with `.aiq-` prefix |
| JavaScript errors | Graceful degradation to server rendering |
| Mobile performance | Lazy load question types, minimal DOM |

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Next Review:** After Phase 1 completion
