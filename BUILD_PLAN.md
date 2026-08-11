# AI Quiz (mod_aiquiz) - Master Build Plan

**Version:** 2.0.0  
**Last Updated:** 2025-12-19  
**Status:** WORLD-CLASS REBUILD — CHATGPT SPEC COMPLIANT

---

## ChatGPT Specification Compliance Matrix

### Design Token System (SPEC-001 to SPEC-008)

| SPEC ID | Requirement | Implementation File | Lines | Status |
|---------|-------------|---------------------|-------|--------|
| SPEC-001 | Design token system is MANDATORY — no hardcoded colors/shadows/radii | `styles/tokens.css` | 1-328 | ✅ VERIFIED |
| SPEC-002 | White-first design (bg-card: #FFFFFF, bg-page: #FAFAFA) | `styles/tokens.css` | 23-37 | ✅ VERIFIED |
| SPEC-003 | Moodle primary color as accent ONLY via `var(--moodle-primary-color)` | `styles/tokens.css` | 63-75 | ✅ VERIFIED |
| SPEC-004 | Soft shadows: `0 4px 12px rgba(0,0,0,0.06)` | `styles/tokens.css` | 121-137 | ✅ VERIFIED |
| SPEC-005 | Inter font family + JetBrains Mono for code | `styles/tokens.css` | 175-205 | ✅ VERIFIED |
| SPEC-006 | Easing: `cubic-bezier(0.4, 0, 0.2, 1)` | `styles/tokens.css` | 139-155 | ✅ VERIFIED |
| SPEC-007 | MCQ 2x2 card grid is flagship quality bar | `styles/bridge.css` | 121-217 | ✅ VERIFIED |
| SPEC-008 | Linear.app DNA progress bar — calm, segmented, gentle pulse | `styles/bridge.css` | 219-350 | ✅ VERIFIED |

### TGA SOAP Integration (ChatGPT Spec)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| WS-Security UsernameToken with PasswordDigest | `server/lib/tgaLookup.ts` lines 115-175 | ✅ VERIFIED |
| OrganisationServiceV13 endpoint | `server/lib/tgaLookup.ts` line 81 | ✅ VERIFIED |
| TrainingComponentServiceV13 endpoint | `server/lib/tgaLookup.ts` line 80 | ✅ VERIFIED |
| ClassificationServiceV13 endpoint | `server/lib/tgaLookup.ts` line 82 | ✅ VERIFIED |
| SOAP → Internal schema mapping | `server/lib/tgaLookup.ts` lines 201-303 | ✅ VERIFIED |
| Audit trail with timestamps | `server/lib/tgaLookup.ts` lines 103-113, 367-487 | ✅ VERIFIED |
| 7-day cache TTL | `server/lib/tgaLookup.ts` line 96 | ✅ VERIFIED |
| Fallback unit database | `server/lib/tgaLookup.ts` lines 499-880 | ✅ VERIFIED |

### 7-Screen Authoring Wizard (ChatGPT Spec)

| Screen | Purpose | Implementation | Status |
|--------|---------|----------------|--------|
| 0. Entry | Assessment name, type | `amd/src/authoring/wizard.js` lines 234-318 | ✅ VERIFIED |
| 1. Source | TGA API or paste criteria | `amd/src/authoring/wizard.js` lines 320-484 | ✅ VERIFIED |
| 2. Criteria | Normalise and confirm criteria | `amd/src/authoring/wizard.js` lines 574-646 | ✅ VERIFIED |
| 3. Allocation | Questions per criterion | `amd/src/authoring/wizard.js` lines 648-752 | ✅ VERIFIED |
| 4. Generation | Progressive AI loading | `amd/src/authoring/wizard.js` lines 754-854 | ✅ VERIFIED |
| 5. Review | Edit generated questions | `amd/src/authoring/wizard.js` lines 856-980 | ✅ VERIFIED |
| 6. Summary | Coverage report | `amd/src/authoring/wizard.js` lines 982-1047 | ✅ VERIFIED |

### AI Prompt Templates (ChatGPT Spec)

| Prompt Type | Implementation | Status |
|-------------|----------------|--------|
| System prompt (base) | `amd/src/ai/prompts.js` lines 79-98 | ✅ VERIFIED |
| MCQ prompt | `amd/src/ai/prompts.js` lines 101-143 | ✅ VERIFIED |
| True/False prompt | `amd/src/ai/prompts.js` lines 145-182 | ✅ VERIFIED |
| Matching prompt | `amd/src/ai/prompts.js` lines 184-225 | ✅ VERIFIED |
| Ordering prompt | `amd/src/ai/prompts.js` lines 227-267 | ✅ VERIFIED |
| Short answer prompt | `amd/src/ai/prompts.js` lines 269-311 | ✅ VERIFIED |
| Numeric prompt | `amd/src/ai/prompts.js` lines 313-351 | ✅ VERIFIED |
| Fill gap prompt | `amd/src/ai/prompts.js` lines 353-398 | ✅ VERIFIED |
| Distractor refinement | `amd/src/ai/prompts.js` lines 400-425 | ✅ VERIFIED |
| Regeneration prompt | `amd/src/ai/prompts.js` lines 458-481 | ✅ VERIFIED |
| Bloom's taxonomy detection | `amd/src/ai/prompts.js` lines 38-77 | ✅ VERIFIED |

---

## 10 Question Types (All World-Class)

| Question Type | AMD Module | Lines | Status |
|---------------|-----------|-------|--------|
| MCQ Cards (2x2 Grid) — FLAGSHIP | `amd/src/questions/mcq_cards.js` | 268 | ✅ VERIFIED |
| True/False Block | `amd/src/questions/tf_block.js` | ~200 | ✅ VERIFIED |
| Short Answer | `amd/src/questions/short_answer.js` | ~180 | ✅ VERIFIED |
| Numeric | `amd/src/questions/numeric.js` | ~190 | ✅ VERIFIED |
| Gap Dropdown | `amd/src/questions/gap_dropdown.js` | ~220 | ✅ VERIFIED |
| Gap Drag | `amd/src/questions/gap_drag.js` | ~250 | ✅ VERIFIED |
| Matching | `amd/src/questions/matching.js` | ~280 | ✅ VERIFIED |
| Ordering | `amd/src/questions/ordering.js` | ~240 | ✅ VERIFIED |
| Sorting | `amd/src/questions/sorting.js` | ~230 | ✅ VERIFIED |
| Drag Table | `amd/src/questions/drag_table.js` | ~300 | ✅ VERIFIED |

---

## Moodle Plugin Structure Requirements

| Requirement | File Path | Status |
|-------------|-----------|--------|
| version.php with correct frankenstyle | `version.php` | ✅ |
| Language file with pluginname | `lang/en/aiquiz.php` | ✅ |
| Capabilities definition | `db/access.php` | ✅ |
| Database schema | `db/install.xml` | ✅ |
| Privacy API (GDPR) | `classes/privacy/provider.php` | ✅ |
| Events system | `classes/event/*.php` | ✅ |
| Backup/Restore | `backup/moodle2/*.php` | ✅ |
| Activity module form | `mod_form.php` | ✅ |
| Library functions | `lib.php` | ✅ |
| Main view entry point | `view.php` | ✅ |
| Icon files | `pix/icon.svg`, `pix/monologo.svg` | ✅ |

---

## AMD JavaScript Modules

| Module | Path | Purpose | Lines |
|--------|------|---------|-------|
| Core API | `amd/src/core/api.js` | Server communication | ~150 |
| Core State | `amd/src/core/state.js` | State management | ~120 |
| Core Animations | `amd/src/core/animations.js` | Animation utilities | ~180 |
| Attempt Controller | `amd/src/attempt.js` | Quiz attempt logic | ~300 |
| AI Generator | `amd/src/ai/generator.js` | Question generation | ~250 |
| AI Prompts | `amd/src/ai/prompts.js` | Prompt templates | 528 |
| AI Synonyms | `amd/src/ai/synonyms.js` | Synonym handling | ~100 |
| RTO Competency | `amd/src/rto/competency.js` | training.gov.au integration | ~200 |
| Analytics Evolution | `amd/src/analytics/evolution.js` | Learning analytics | ~180 |
| Analytics Stats | `amd/src/analytics/stats.js` | Statistics | ~150 |
| Analytics Visualizer | `amd/src/analytics/visualizer.js` | Data visualization | ~220 |
| Authoring Wizard | `amd/src/authoring/wizard.js` | Question authoring | 1172 |
| UI Button | `amd/src/ui/Button.js` | Button component | ~100 |
| UI Card | `amd/src/ui/Card.js` | Card component | ~150 |
| UI ProgressBar | `amd/src/ui/ProgressBar.js` | Progress bar component | ~120 |

---

## CSS Architecture

| File | Purpose | Lines |
|------|---------|-------|
| `styles/tokens.css` | Design tokens (SPEC-001 to SPEC-006) | 328 |
| `styles/bridge.css` | Component styles (SPEC-007, SPEC-008) | 1298 |
| `styles/analytics.css` | Analytics dashboard styles | ~200 |
| `styles/competency.css` | RTO competency picker | ~150 |
| `styles/premium.css` | Premium SaaS polish | ~100 |

---

## PHP Entry Points

| File | Purpose |
|------|---------|
| `view.php` | Main activity view |
| `attempt.php` | Take quiz attempt |
| `attempts.php` | List all attempts |
| `review.php` | Review completed attempt |
| `generate.php` | AI question generation |
| `manage.php` | Question management |
| `stats.php` | Statistics view |
| `ajax.php` | AJAX endpoints |
| `overrides.php` | User/group overrides |
| `settings.php` | Admin settings |
| `index.php` | Course module index |

---

## Quality Bar Verification

### MCQ 2x2 Card Grid (SPEC-007)
- ✅ Cards arranged in 2-column grid on desktop
- ✅ Pure white cards (`#FFFFFF`)
- ✅ Soft shadow on hover (`0 4px 12px rgba(0,0,0,0.06)`)
- ✅ Selected state uses Moodle accent via `var(--moodle-primary-color)`
- ✅ Accessible keyboard navigation
- ✅ Correct answer pulse animation
- ✅ Mobile stacks cards vertically

### Linear.app Progress Bar (SPEC-008)
- ✅ Segmented design (one segment per question)
- ✅ Calm animation (no jarring effects)
- ✅ Gentle pulse on active segment
- ✅ Uses Moodle accent color
- ✅ Clear progress indication

---

## Pre-Production Checklist

- [x] All PHP files have GPL header
- [x] All PHP files have MOODLE_INTERNAL check
- [x] All AMD modules have @module tag
- [x] All capabilities are defined
- [x] Language strings are complete
- [x] Privacy API implemented
- [x] Backup/restore implemented
- [x] ZIP contains single root folder
- [x] No syntax errors in any file
- [x] ChatGPT spec SPEC-001 to SPEC-008 verified
- [x] TGA SOAP WS-Security authentication implemented
- [x] 7-screen authoring wizard complete
- [x] All 10 question types implemented
- [x] AI prompt templates complete

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-19 | WORLD-CLASS REBUILD: Full ChatGPT spec compliance with line-by-line verification |
| 1.2.0 | 2025-12-19 | Initial ChatGPT spec implementation |
| 1.1.0 | 2025-12-18 | Initial question types |
| 1.0.0 | 2025-12-17 | Initial release |
