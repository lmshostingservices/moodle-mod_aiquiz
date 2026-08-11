# AI Quiz - World's Greatest Educational Quiz Experience

**Document Type:** Education & UX Expert Specification  
**Goal:** Create the most engaging, effective, and inclusive AI-powered quiz experience in educational technology  
**Inspiration:** Duolingo + Kahoot + Typeform + Linear.app

---

## Part 1: Educational Psychology Foundation

### 1.1 Core Learning Principles

The quiz must be built on **evidence-based educational psychology**:

| Principle | Implementation |
|-----------|----------------|
| **Immediate Feedback** | Instant "ding" + visual feedback after each answer. Research shows immediate reinforcement creates stronger neural pathways. |
| **Spaced Repetition** | Questions answered incorrectly are flagged for review. Optional "practice weak areas" mode. |
| **Cognitive Load Management** | One question at a time. Clean interface. No visual clutter. 5-question chunks feel manageable. |
| **Mastery-Based Progression** | In adaptive mode, must get question correct before advancing. Prevents knowledge gaps. |
| **Metacognition** | "How confident are you?" optional prompt. Helps learners self-assess understanding. |
| **Growth Mindset** | Never say "Wrong!" - say "Not quite" or "Almost there!" Mistakes are learning opportunities. |

### 1.2 Inclusive Design Mandates

**CRITICAL:** Traditional competitive quizzing disadvantages struggling learners. We must design for ALL students:

| Inclusive Feature | Why It Matters |
|-------------------|----------------|
| **No point penalties** | Deducting points confirms failure feelings and increases anxiety |
| **Optional timers** | Fast-paced pressure excludes learners who need processing time |
| **Multiple attempts** | Learning requires iteration, not one-shot judgment |
| **Positive-only scoring** | Celebrate what's right, don't punish what's wrong |
| **Read-aloud support** | Essential for dyslexia, visual impairments, ESL learners |
| **No leaderboards by default** | Competition stresses non-competitive learners (make optional) |
| **Encouragement messages** | "Keep going!" not "You got it wrong!" |

### 1.3 Bloom's Taxonomy Question Hierarchy

Each question type maps to cognitive levels:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BLOOM'S LEVEL        │ QUESTION TYPES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Remember             │ MCQ (single answer), True/False, Fill Gap       │
│ Understand           │ MCQ (multiple), Matching, Short Answer          │
│ Apply                │ Numeric, Category Sorting, Scenario MCQ         │
│ Analyze              │ Ordering/Sequencing, Drag Table (Hazard/Control)│
│ Evaluate             │ Multi-statement T/F, Ranking                    │
│ Create               │ Essay (future), Open-ended Short Answer         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: The Perfect Quiz Flow

### 2.1 Pre-Quiz Experience (Engagement Phase)

**Goal:** Build anticipation, reduce anxiety, set expectations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                           ┌─────────────┐                                │
│                           │     📋      │  ← Friendly icon              │
│                           └─────────────┘                                │
│                                                                          │
│                    Workplace Health & Safety                             │
│                        Module 3 Assessment                               │
│                                                                          │
│                    "Test your knowledge on PPE                           │
│                     and hazard identification"                           │
│                                                                          │
│     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐        │
│     │ 10      │     │ ~15     │     │ 80%     │     │ ∞       │        │
│     │Questions│     │ Minutes │     │ To Pass │     │ Retries │        │
│     └─────────┘     └─────────┘     └─────────┘     └─────────┘        │
│                                                                          │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  WHAT TO EXPECT                                              │    │
│     │                                                              │    │
│     │  ✓ Multiple choice questions                                │    │
│     │  ✓ Sorting hazards and controls                             │    │
│     │  ✓ Instant feedback after each question                     │    │
│     │  ✓ Review at the end                                        │    │
│     │                                                              │    │
│     │  📱 Works great on mobile!                                   │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                    YOUR PREVIOUS ATTEMPTS                                │
│                                                                          │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │ ✓ Attempt 2 • Dec 15 • 85% • Best Score                     │    │
│     │ ○ Attempt 1 • Dec 14 • 70%                                  │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                                                                          │
│             ┌───────────────────────────────────────┐                   │
│             │                                       │                   │
│             │       ▶ BEGIN ASSESSMENT              │                   │
│             │                                       │                   │
│             │  "You've got this! Take your time."  │                   │
│             │                                       │                   │
│             └───────────────────────────────────────┘                   │
│                                                                          │
│                  [Practice Mode] (no grade recorded)                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
1. **Friendly icon** - Non-intimidating, approachable
2. **Clear description** - What will be tested
3. **Expectation cards** - Question count, time estimate (not limit), pass mark
4. **"What to Expect"** - Reduces anxiety by previewing format
5. **Mobile badge** - Reassures mobile users
6. **Previous attempts** - Shows progress journey
7. **Encouraging CTA** - "You've got this!" not just "Start"
8. **Practice mode option** - Low-stakes practice without grade impact

---

### 2.2 During Quiz (Flow State)

**Goal:** Maintain focus, provide instant feedback, celebrate progress

#### Screen Structure (Single Question View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HEADER BAR (Sticky)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [✕ Exit]     ● Immediate Feedback Mode        ⏱️ ~12 min remaining ││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│                         PROGRESS BAR (Sticky)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  [✓] [✓] [✗] [●] [○] [○] [○] [○] [○] [○]    4 of 10               ││
│  │   1   2   3   4   5   6   7   8   9  10     40% complete            ││
│  │                                                                      ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━○───────────────────   Progress Bar          ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│                         QUESTION CARD                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                              1 mark ││
│  │  Question 4                                                          ││
│  │                                                                      ││
│  │  Which personal protective equipment (PPE) is REQUIRED              ││
│  │  for welding operations?                                            ││
│  │                                                                      ││
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐   ││
│  │  │                             │ │                             │   ││
│  │  │  A                          │ │  B                          │   ││
│  │  │                             │ │                             │   ││
│  │  │  Safety glasses             │ │  Welding helmet             │   ││
│  │  │                             │ │  with filter lens           │   ││
│  │  │                             │ │                             │   ││
│  │  └─────────────────────────────┘ └─────────────────────────────┘   ││
│  │                                                                      ││
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐   ││
│  │  │                             │ │                             │   ││
│  │  │  C                          │ │  D                          │   ││
│  │  │                             │ │                             │   ││
│  │  │  Hard hat                   │ │  Leather gloves only        │   ││
│  │  │                             │ │                             │   ││
│  │  │                             │ │                             │   ││
│  │  └─────────────────────────────┘ └─────────────────────────────┘   ││
│  │                                                                      ││
│  │  💡 Tip: Consider protection from UV light and sparks.              ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│                         NAVIGATION (Fixed Bottom on Mobile)              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  [← Previous]              [Jump to: ▼]            [Submit →]       ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

1. **Progress Segments (Linear.app style)**
   - Each question is a clickable segment
   - States: ○ unanswered, ● current (pulsing), ✓ correct, ✗ incorrect, ◐ partial
   - Gentle pulse animation on current question
   - No jarring colors - calm, professional

2. **Time Display**
   - Shows "~X min remaining" as estimate (not countdown stress)
   - Only becomes countdown in final 5 minutes
   - Optional - can be hidden in settings

3. **Question Card**
   - Pure white background (#FFFFFF)
   - Generous padding (24px+)
   - Clear question number and marks
   - Optional hint/tip for struggling learners

4. **Answer Cards (MCQ - Flagship)**
   - 2x2 grid on desktop, 1 column on mobile (< 600px)
   - Letter badges (A, B, C, D) for quick reference
   - Entire card is clickable (not just radio)
   - States:
     - Default: White with subtle border
     - Hover: Lift 2px + soft shadow
     - Selected: Blue border + blue tint background
     - Correct: Green border + green tint + checkmark icon + pulse animation
     - Incorrect: Red border + red tint + X icon + subtle shake

5. **Keyboard Shortcuts**
   - 1-4 or A-D: Select answer
   - Enter: Submit
   - ← →: Navigate questions
   - Escape: Open exit dialog

---

### 2.3 Instant Feedback Modal

**Goal:** Celebrate correctness, gently correct mistakes, teach in the moment

#### Correct Answer Feedback

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                     (Blurred quiz background)                            │
│                                                                          │
│          ┌─────────────────────────────────────────────────┐            │
│          │                                                  │            │
│          │              ┌─────────────┐                     │            │
│          │              │             │                     │            │
│          │              │     ✓       │  ← Animated         │            │
│          │              │             │    checkmark         │            │
│          │              └─────────────┘    (draws in)       │            │
│          │                                                  │            │
│          │                 Correct!                         │            │
│          │                                                  │            │
│          │       ┌────────────────────────────────┐        │            │
│          │       │                                 │        │            │
│          │       │  Welding helmets with filter   │        │            │
│          │       │  lenses protect your eyes from │        │            │
│          │       │  intense UV light and sparks.  │        │            │
│          │       │                                 │        │            │
│          │       └────────────────────────────────┘        │            │
│          │                                                  │            │
│          │              [ Continue → ]                      │            │
│          │                                                  │            │
│          │               Press Enter                        │            │
│          │                                                  │            │
│          └─────────────────────────────────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Incorrect Answer Feedback

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│          ┌─────────────────────────────────────────────────┐            │
│          │                                                  │            │
│          │              ┌─────────────┐                     │            │
│          │              │             │                     │            │
│          │              │     ✗       │  ← Subtle shake    │            │
│          │              │             │    animation        │            │
│          │              └─────────────┘                     │            │
│          │                                                  │            │
│          │               Not quite                          │            │
│          │                                                  │            │
│          │       ┌────────────────────────────────┐        │            │
│          │       │  Your answer:                   │        │            │
│          │       │  A. Safety glasses ✗            │        │            │
│          │       │                                 │        │            │
│          │       │  Correct answer:                │        │            │
│          │       │  B. Welding helmet ✓            │        │            │
│          │       │                                 │        │            │
│          │       │  💡 Safety glasses don't        │        │            │
│          │       │  protect from UV radiation      │        │            │
│          │       │  produced during welding.       │        │            │
│          │       └────────────────────────────────┘        │            │
│          │                                                  │            │
│          │     [ Try Again ]        [ Continue → ]          │ ← Adaptive│
│          │                                                  │   mode    │
│          └─────────────────────────────────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

1. **Language matters:**
   - Never "Wrong!" - use "Not quite" or "Almost there"
   - "Correct!" with exclamation (celebrate!)
   - Educational explanation, not just "here's the answer"

2. **Animated icons:**
   - Checkmark draws in with CSS animation
   - X has subtle shake (not aggressive)
   - Icons are SVG, not text characters or FontAwesome

3. **Educational moment:**
   - Brief explanation of WHY
   - Links to learning material (optional)
   - Addresses common misconception

4. **Adaptive mode:**
   - "Try Again" option for incorrect
   - No penalty for retrying
   - Tracks attempts per question for analytics

---

### 2.4 Progress Celebrations (Micro-Moments)

**Goal:** Maintain momentum through small celebrations

#### 25% Complete

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                      Good start!                             │
│                                                              │
│                    ┌─────────────┐                           │
│                    │   25%       │                           │
│                    │  ━━━━━○──── │                           │
│                    └─────────────┘                           │
│                                                              │
│            You're making great progress.                     │
│                                                              │
│                    [ Keep going ]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 50% Complete (Halfway)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    ⭐ Halfway there! ⭐                       │
│                                                              │
│                    ┌─────────────┐                           │
│                    │   50%       │                           │
│                    │  ━━━━━━━━●─ │                           │
│                    └─────────────┘                           │
│                                                              │
│              5 questions down, 5 to go.                      │
│                                                              │
│                    [ Continue ]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 100% Score - Full Celebration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              ⭐                                          │
│                            ⭐   ⭐                                        │
│                          ⭐       ⭐                                      │
│                                                                          │
│                           ┌─────────────┐                                │
│                           │             │                                │
│                           │     🏆      │                                │
│                           │             │                                │
│                           └─────────────┘                                │
│                                                                          │
│                              100%                                        │
│                                                                          │
│                        PERFECT SCORE!                                    │
│                                                                          │
│                 You answered every question                              │
│                        correctly!                                        │
│                                                                          │
│              This is a significant achievement.                          │
│                                                                          │
│                      ┌─────────────────┐                                 │
│                      │  View Results   │                                 │
│                      └─────────────────┘                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Animation Details:**
- Trophy scales in with spring easing
- Stars twinkle with staggered delays
- Confetti particles fall (optional, respects prefers-reduced-motion)
- Sound effect: celebratory "ding" (optional, user-controlled)

---

### 2.5 Results Dashboard

**Goal:** Provide actionable insights, celebrate achievement, encourage retry

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESULTS DASHBOARD                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │           YOUR SCORE                       SUMMARY                   ││
│  │                                                                      ││
│  │        ┌───────────────┐               ┌──────────────────┐         ││
│  │        │               │               │                  │         ││
│  │        │               │               │  ⏱️ 12:34        │         ││
│  │        │      85%      │               │  Time taken      │         ││
│  │        │               │               │                  │         ││
│  │        │   ✓ Passed    │               │  ✓ 8 / 10        │         ││
│  │        │               │               │  Correct         │         ││
│  │        └───────────────┘               │                  │         ││
│  │             ↑                          │  ⭐ +15 XP       │         ││
│  │      Animated circle                   │  Earned          │         ││
│  │      progress ring                     │                  │         ││
│  │                                        └──────────────────┘         ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  PERFORMANCE BY TOPIC                                                ││
│  │                                                                      ││
│  │  PPE Requirements        ████████████████░░░░  80% (4/5)            ││
│  │  Hazard Identification   ██████████████████░░  90% (2/2)            ││
│  │  Risk Assessment         ████████████████████ 100% (2/2)            ││
│  │  Emergency Procedures    ██████████████░░░░░░  67% (0/1) ← Focus   ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  QUESTION REVIEW                                          [Expand ▼]││
│  │                                                                      ││
│  │  ┌─ Q1 ────────────────────────────────────────────────────────────┐││
│  │  │ ✓ Which PPE is required for welding?                [Details ▼]│││
│  │  └─────────────────────────────────────────────────────────────────┘││
│  │  ┌─ Q2 ────────────────────────────────────────────────────────────┐││
│  │  │ ✗ What is the first step in hazard identification?  [Details ▼]│││
│  │  │                                                                  │││
│  │  │    Your answer: Report to supervisor                            │││
│  │  │    Correct: Identify the hazard                                 │││
│  │  │                                                                  │││
│  │  │    💡 The hierarchy of control starts with hazard               │││
│  │  │    identification before any reporting occurs.                  │││
│  │  │                                                                  │││
│  │  └─────────────────────────────────────────────────────────────────┘││
│  │  ┌─ Q3... ─────────────────────────────────────────────────────────┐││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  [ ← Back to Course ]    [ Practice Weak Areas ]    [ Retry Quiz ] ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Animated Score Ring**
   - Counts up from 0% to final score
   - Color transitions: red (< 50%) → yellow (50-79%) → green (80%+)
   - Pass/fail badge appears after animation

2. **Performance by Topic**
   - Shows mastery per learning objective
   - Highlights weakest area with "Focus" label
   - Enables targeted re-learning

3. **Expandable Question Review**
   - Collapsed by default (not overwhelming)
   - Shows your answer vs correct for incorrect
   - Includes explanation for learning

4. **Action Buttons**
   - "Practice Weak Areas" - focused remediation
   - "Retry Quiz" - full attempt
   - "Back to Course" - return to LMS

---

## Part 3: Question Type Specifications

### 3.1 MCQ Cards (FLAGSHIP - Sets Quality Bar)

**The MCQ experience defines the quality of the entire quiz. It must be perfect.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Which personal protective equipment is required for welding?            │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────┐         │
│  │                            │  │                            │         │
│  │   A                        │  │   B                   ✓    │ ← Sel  │
│  │                            │  │                            │  ected │
│  │   Safety glasses           │  │   Welding helmet           │         │
│  │                            │  │   with filter lens         │         │
│  │                            │  │                            │         │
│  └────────────────────────────┘  └────────────────────────────┘         │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────┐         │
│  │                            │  │                            │         │
│  │   C                        │  │   D                        │         │
│  │                            │  │                            │         │
│  │   Hard hat                 │  │   Leather gloves only      │         │
│  │                            │  │                            │         │
│  │                            │  │                            │         │
│  └────────────────────────────┘  └────────────────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Card States (with transitions):**

| State | Border | Background | Shadow | Icon |
|-------|--------|------------|--------|------|
| Default | 1px `#E4E4E7` | `#FFFFFF` | None | None |
| Hover | 1px `#A1A1AA` | `#FFFFFF` | `0 2px 8px rgba(0,0,0,0.06)` | None |
| Selected | 2px `#3B82F6` | `#EFF6FF` | `0 0 0 3px rgba(59,130,246,0.2)` | ✓ subtle |
| Correct | 2px `#10B981` | `#ECFDF5` | `0 0 0 3px rgba(16,185,129,0.2)` | ✓ animated |
| Incorrect | 2px `#EF4444` | `#FEF2F2` | `0 0 0 3px rgba(239,68,68,0.2)` | ✗ animated |

**Animations:**

```css
/* Card hover - subtle lift */
.aiq-card:hover {
    transform: translateY(-2px);
    transition: all 0.15s ease;
}

/* Correct answer pulse */
@keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

/* Checkmark draw animation */
@keyframes checkDraw {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
}

/* Incorrect shake */
@keyframes incorrectShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
}
```

### 3.2 Category Sorting (WHS Priority)

**Perfect for hazard/control classification training:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Sort each item into the correct category:                               │
│                                                                          │
│  ┌─ UNSORTED ITEMS ──────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │  │
│  │  │ Wet floor │ │ Warning   │ │ Trailing  │ │ First aid │         │  │
│  │  │           │ │ signs     │ │ cables    │ │ kit       │         │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘         │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ 🔴 HAZARD ───────────────┐  ┌─ 🟢 CONTROL MEASURE ────────────┐   │
│  │                           │  │                                  │   │
│  │  Drop items here          │  │  Drop items here                 │   │
│  │                           │  │                                  │   │
│  │  ┌───────────┐            │  │  ┌───────────┐ ┌───────────┐    │   │
│  │  │ Wet floor │ ✓          │  │  │ Warning   │ │ First aid │    │   │
│  │  └───────────┘            │  │  │ signs     │ │ kit       │    │   │
│  │                           │  │  └───────────┘ └───────────┘    │   │
│  │  Items: 1                 │  │  Items: 2                       │   │
│  │                           │  │                                  │   │
│  └───────────────────────────┘  └──────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Drag items from bank to category buckets
- Touch: Long-press to pick up, drag to drop zone
- Keyboard: Tab to item, Space to pick up, arrows to navigate, Space to drop
- Items can be moved between categories
- Visual feedback on valid drop zones

### 3.3 Ordering / Sequencing

**For process and procedure questions:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Arrange the risk assessment steps in the correct order:                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  1  │  Identify hazards                                    │ ≡ │    ││
│  ├─────┼──────────────────────────────────────────────────────┼───┤    ││
│  │  2  │  Assess the risk                                     │ ≡ │    ││
│  ├─────┼──────────────────────────────────────────────────────┼───┤    ││
│  │  3  │  Implement control measures                          │ ≡ │    ││
│  ├─────┼──────────────────────────────────────────────────────┼───┤    ││
│  │  4  │  Review and monitor                                  │ ≡ │    ││
│  └─────┴──────────────────────────────────────────────────────┴───┘    │
│          ↑                                                     ↑        │
│     Position                                              Drag handle   │
│     badge                                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag handle on right side
- Position numbers update in real-time
- Ghost placeholder shows drop position
- Keyboard: Arrow keys to reorder
- Partial credit based on correct adjacent pairs

### 3.4 True/False Block (Multiple Statements)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Indicate whether each statement is true or false:                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  Hard hats must be worn in all construction areas.                  ││
│  │                                                                      ││
│  │                              [TRUE]  [FALSE]  ← Toggle buttons      ││
│  │                               ^^^^                                  ││
│  │                             Selected                                ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  Safety glasses are optional when using power tools.                ││
│  │                                                                      ││
│  │                              [TRUE]  [FALSE]                        ││
│  │                                       ^^^^^                         ││
│  │                                      Selected                       ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Matching (Click-to-Connect)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Match each hazard to its appropriate control measure:                   │
│                                                                          │
│  HAZARDS                                 CONTROLS                        │
│                                                                          │
│  ┌─────────────────┐                     ┌─────────────────┐            │
│  │ Noise exposure  │ ────────────────────│ Ear protection  │            │
│  └─────────────────┘        ↑            └─────────────────┘            │
│                        SVG line                                          │
│  ┌─────────────────┐                     ┌─────────────────┐            │
│  │ Chemical splash │                     │ Face shield     │            │
│  └─────────────────┘                     └─────────────────┘            │
│                                                                          │
│  ┌─────────────────┐                     ┌─────────────────┐            │
│  │ Working at      │                     │ Safety harness  │            │
│  │ height          │                     │                 │            │
│  └─────────────────┘                     └─────────────────┘            │
│                                                                          │
│  Click a hazard, then click the matching control.                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
1. Click stem (left) - highlights with accent
2. Click choice (right) - line animates in
3. Click connected item to remove connection
4. Lines are SVG paths with curved bezier

---

## Part 4: Mobile Experience (480px and below)

### 4.1 Mobile Layout Adaptations

```
MOBILE QUIZ SCREEN (< 480px)
┌───────────────────────────────────┐
│ [✕]       Immediate     ⏱️ 12:34 │ ← Compact header
├───────────────────────────────────┤
│ ●○○○○○○○○○  1/10  10%            │ ← Dot progress
├───────────────────────────────────┤
│                                   │
│  Question 1                       │
│                                   │
│  Which PPE is required            │
│  for welding?                     │
│                                   │
│  ┌───────────────────────────┐   │ ← Single column
│  │ A                         │   │
│  │ Safety glasses            │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │ B                    ✓    │   │
│  │ Welding helmet            │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │ C                         │   │
│  │ Hard hat                  │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │ D                         │   │
│  │ Leather gloves only       │   │
│  └───────────────────────────┘   │
│                                   │
├───────────────────────────────────┤
│ [←]              ▼        [→]    │ ← Fixed bottom nav
│ Prev         Jump to      Next   │
└───────────────────────────────────┘
```

### 4.2 Touch Target Requirements

**CRITICAL:** All interactive elements must have minimum 44x44px touch area.

```css
.aiq-touch-target {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Invisible expansion for small elements */
.aiq-touch-target-expand::before {
    content: '';
    position: absolute;
    inset: -8px;
}
```

### 4.3 Gesture Support

| Gesture | Action |
|---------|--------|
| Swipe left | Next question |
| Swipe right | Previous question |
| Long press | Pick up drag item |
| Pinch | Zoom question text (accessibility) |

---

## Part 5: Accessibility Compliance (WCAG 2.1 AA)

### 5.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Shift+Tab | Move backwards |
| Enter / Space | Select / Activate |
| 1-4 / A-D | Direct MCQ selection |
| ← → | Navigate questions |
| ↑ ↓ | Navigate within question (ordering, etc.) |
| Escape | Close modal / Exit |
| ? | Show keyboard shortcuts |

### 5.2 ARIA Implementation

```html
<!-- Progress bar -->
<div role="progressbar" 
     aria-valuenow="4" 
     aria-valuemin="1" 
     aria-valuemax="10"
     aria-label="Question 4 of 10, 40% complete">
</div>

<!-- MCQ options -->
<div role="radiogroup" aria-label="Answer options">
    <div role="radio" aria-checked="true" tabindex="0">
        A. Welding helmet
    </div>
    <div role="radio" aria-checked="false" tabindex="-1">
        B. Safety glasses
    </div>
</div>

<!-- Timer -->
<div role="timer" aria-live="polite" aria-label="Time remaining: 12 minutes">
    12:00
</div>

<!-- Feedback announcement -->
<div role="alert" aria-live="assertive" class="sr-only">
    Correct! Welding helmets protect from UV light.
</div>
```

### 5.3 Color Contrast

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Body text | #18181B | #FFFFFF | 16:1 ✓ |
| Secondary text | #52525B | #FFFFFF | 7.5:1 ✓ |
| Error text | #DC2626 | #FFFFFF | 4.5:1 ✓ |
| Success text | #059669 | #FFFFFF | 4.5:1 ✓ |

### 5.4 Screen Reader Support

- Live regions for feedback announcements
- Descriptive labels for all interactive elements
- Focus management after modal opens/closes
- Skip links to main content
- Heading hierarchy (h1 → h2 → h3)

---

## Part 6: Sound Design (Optional, User-Controlled)

### 6.1 Sound Effects

| Event | Sound | Duration |
|-------|-------|----------|
| Select answer | Soft click | 50ms |
| Correct answer | Cheerful "ding" | 300ms |
| Incorrect answer | Soft "thud" (not harsh) | 200ms |
| Complete quiz | Achievement fanfare | 800ms |
| Perfect score | Celebration melody | 1.5s |

### 6.2 Implementation

```javascript
// Sounds are OFF by default
const SoundManager = {
    enabled: localStorage.getItem('aiq-sounds') === 'true',
    
    play(sound) {
        if (!this.enabled) return;
        // Use Web Audio API for low-latency playback
    },
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('aiq-sounds', this.enabled);
    }
};
```

---

## Part 7: Analytics & Learning Insights

### 7.1 Data Captured Per Attempt

| Metric | Purpose |
|--------|---------|
| Time per question | Identify difficult questions |
| First vs final answer | Track answer changes |
| Attempts per question (adaptive) | Measure learning curve |
| Score by topic/criterion | Identify knowledge gaps |
| Device type | Optimize for popular devices |
| Drop-off point | Find friction in quiz |

### 7.2 Instructor Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ QUIZ ANALYTICS                                                           │
│                                                                          │
│ Question Performance                                                     │
│                                                                          │
│ Q1: PPE for welding          ████████████████████  95% correct          │
│ Q2: Hazard identification    ██████████████░░░░░░  72% correct  ← Focus │
│ Q3: Risk assessment steps    ████████████████░░░░  82% correct          │
│ Q4: Emergency procedures     █████████████████░░░  88% correct          │
│                                                                          │
│ Average time: 8.2 minutes    Completion rate: 94%                        │
│ Pass rate: 78%               Average score: 82%                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 8: Implementation Priority

### Phase 1: Core Experience (Week 1-2)
1. SPA architecture with AMD module loading
2. MCQ Cards question type (flagship quality)
3. Immediate feedback modal with animations
4. Progress bar (Linear.app style)
5. Basic results view

### Phase 2: Question Types (Week 2-3)
1. True/False Block
2. Category Sorting
3. Ordering/Sequencing
4. Matching with SVG lines
5. Short Answer
6. Gap Fill (dropdown + drag)

### Phase 3: Polish (Week 3-4)
1. Mobile optimization (480px breakpoint)
2. Touch targets (44px minimum)
3. Keyboard navigation
4. ARIA accessibility
5. Celebration effects
6. Sound design (optional)

### Phase 4: Advanced (Week 4+)
1. Results dashboard with topic breakdown
2. "Practice weak areas" mode
3. Analytics for instructors
4. Spaced repetition integration
5. Confidence meter

---

## Appendix: Competitor Analysis

### What We're Better Than:

| Platform | Their Weakness | Our Advantage |
|----------|----------------|---------------|
| Kahoot | Stressful countdown, penalizes thinking time | Optional timers, no time pressure |
| Quizizz | Cluttered UI, too many distractions | Clean, focused interface |
| Moodle Quiz | Outdated, form-based, page refreshes | Modern SPA, instant feedback |
| Google Forms | No feedback, no gamification | Rich feedback, celebrations |

### What We're Learning From:

| Platform | Their Strength | Our Implementation |
|----------|----------------|-------------------|
| Duolingo | Streak psychology, micro-celebrations | Progress milestones, perfect score celebration |
| Typeform | One question at a time, smooth transitions | Single question view, CSS transitions |
| Linear | Calm, professional, keyboard-first | Minimal design, keyboard shortcuts |
| Notion | Clean typography, white-first | Inter font, #FFFFFF cards |

---

**Document Version:** 1.0  
**Author:** Education & UX Expert Analysis  
**Goal:** World's Greatest AI Quiz Experience
