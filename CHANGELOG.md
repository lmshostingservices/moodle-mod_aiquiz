# Changelog - AI Quiz Activity Module

All notable changes to this plugin will be documented in this file.

## [3.1.1] - 2026-01-06

### Fixed
- **Console.log Removed**: Removed debug `console.log` statement from `drag_table.js` keyboard navigation function
- **Optional aiconfig Dependency**: Made `local_aiconfig` require conditional in `view.php` - plugin no longer fatal errors if aiconfig not installed

### Changed
- **Keyboard Accessibility**: `showKeyboardDropTargets()` now properly highlights drop zones for accessible drag-and-drop

## [3.1.0] - 2026-01-05

### Added
- **JavaScript-Driven Attempt Page**: Complete AMD module architecture for all 11 question types
- **Question Bridge**: New `question_bridge.php` for server-to-client data transformation
- **CSS Components**: Timer, loading states, and celebration animations
- **ID Prefix Handling**: Proper question/choice ID normalization (q123, c123)

## [3.0.7] - 2025-12-25

### Fixed
- **Extract All TGA Criteria Types**: Now extracts ALL three criteria types from TGA:
  - Performance Criteria (PC) from elements with 1.1, 1.2 numbering
  - Performance Evidence (PE) from performanceEvidence array
  - Knowledge Evidence (KE) from knowledgeEvidence array
- Previously only extracted PC or KE (not both), and never extracted PE

## [3.0.6] - 2025-12-25

### Changed
- **TGA-Style PC Numbering**: Performance Criteria from TGA now display with proper element-based numbering (1.1, 1.2, 2.1, 2.2) instead of simple sequential numbers
- Stores elementNumber, pcNumber, and tgaNumber fields when parsing TGA data
- Non-TGA custom criteria continue using sequential numbering

## [3.0.2] - 2025-12-22

### Added
- **52-Language Support**: Full Chirp 3 HD language support with proper spelling guidance (Australian English, British English, etc.)
- **Vocational/Academic Context Toggle**: Context-specific fields for better question generation
  - Vocational: Industry sector, qualification level, workplace setting
  - Academic: Subject area, year level
- **Difficulty Distribution Control**: Three presets (Balanced, Easy-focused, Hard-focused)
- **Psychometric Distractor Rules**: 10 strict quality standards for MCQ options
  - All distractors within ±20% word count of correct answer
  - Parallel grammatical structure required
  - Each distractor represents a plausible misconception
  - Maximum 15 words per distractor

## [3.0.1] - 2025-12-22

### Added
- **Evidence Flattening Prompt**: AI-powered conversion of nested TGA evidence into clean one-line criteria

## [3.0.0] - 2025-12-22

### Changed
- **Quality Overhaul**: Auto-fill allocation (1/2/3 per criterion buttons), even type distribution, smarter matching detection
- **Knowledge Evidence Priority**: Uses Knowledge Evidence for quiz questions when available (theory focus)
- **Clean formatting**: Criteria displayed as clean text without leading numbers

## [2.3.13] - 2025-12-22

### Changed
- **Knowledge Evidence priority**: Now uses Knowledge Evidence for quiz questions when available (theory focus)
- **Clean formatting**: Criteria displayed as clean text without leading numbers (e.g., "1.1 ") 
- **Auto-capitalization**: First letter of each criterion automatically capitalized
- Falls back to Performance Criteria if no Knowledge Evidence available

## [2.3.12] - 2025-12-22

### Fixed
- Fixed TGA criteria extraction - now properly handles string format from training.gov.au API
- Performance criteria now display actual text instead of index numbers on Review Criteria screen
- Rebuilt AMD minified files to ensure changes take effect in Moodle

## [2.3.11] - 2025-12-22

### Changed
- Automatic question type allocation using Bloom's Taxonomy verb detection
- Removed manual question type dropdown - now shows read-only badge with auto-detected type
- Added 11 color-coded question type badges (MCQ, True/False, Matching, Ordering, Short Answer, Fill Gap, Category Sort, Drag & Drop, Hotspot, Essay, Numeric)
- Users only adjust question count per criterion, type is intelligently determined

## [2.3.10] - 2025-12-22

### Fixed
- Fixed PHP 8.4 implicit nullable parameter deprecation warnings in add_instance and update_instance functions

## [2.3.9] - 2025-12-22

### Changed
- Added official Moodle 5.x compatibility declaration (`$plugin->supported = [400, 500]`)



## [2.2.0] - 2025-12-21 (Testing)

### Version Bump
- Version number increased to ensure Moodle upgrade detection works correctly
- All v2.1.0 features are included (see below)

## [2.1.0] - 2025-12-21 (Testing)

### 7-Screen Authoring Wizard - ALL 4 SPRINTS COMPLETE

#### Sprint 1: Core Wizard Architecture
- **generate.php:** Completely rebuilt to load AMD wizard module instead of PHP form
- **authoring.css:** New Linear.app/Stripe-inspired design system for wizard
- **ajax.php:** Added 3 new endpoints for wizard workflow:
  - `get_tga_unit` - TGA lookup integration
  - `generate_questions` - Criterion-based AI question generation
  - `save_assessment` - Save generated questions to quiz
- **wizard.js:** Fixed all API method calls (Api.call → Api.request)

#### Sprint 2: Generation Screen
- Progressive generation UI with real-time percentage progress bar
- Queue visualization with status icons (pending circle, generating spinner, complete checkmark, error X)
- Live preview panel showing questions as they're generated with fade-in animations
- Cancel controls to stop generation mid-process while keeping generated questions

#### Sprint 3: Review & Compliance
- Stats bar showing total questions and breakdown by type (MCQ, T/F, etc.)
- Bulk actions: Select All, Delete Selected, Regenerate Selected
- Pagination with 5 questions per page and page number navigation
- Checkbox selection for individual questions
- Inline editing for question text and answer choices
- Regenerate and delete controls per question
- Compliance summary screen with animated SVG score ring (stroke-dashoffset transition)
- Criteria mapping matrix with visual coverage indicators (full ✓, partial ◐, uncovered ✗)
- CSV and PDF export functionality for mapping matrix

#### Sprint 4: Polish & Accessibility
- Duolingo-style confetti celebration (100 particles, 60fps physics, requestAnimationFrame) triggered on 100% coverage
- Mobile optimization with 44px touch targets, responsive breakpoints (768px/480px)
- 16px font size to prevent iOS zoom
- WCAG 2.1 AA accessibility compliance:
  - Full keyboard navigation (Enter/Space for selection, Arrow keys for navigation)
  - ARIA labels with semantic attributes (aria-current="step", aria-disabled, aria-live regions)
  - Skip links for screen reader users
  - Focus visible styles for keyboard users
  - Reduced motion support via prefers-reduced-motion
  - High contrast mode support
- Step indicator accessibility with role="navigation" and aria-label

### Expected release: Jan 2026 (All sprints complete, in testing phase)

### Complete World-Class Rebuild - 5 Phases Implemented

#### Phase 1: Foundation (AMD/SPA/AJAX)
- Modern AMD module architecture with RequireJS
- Single-page application quiz player
- AJAX-based answer saving with optimistic updates
- Centralized state management with event emitters
- RESTful API integration for seamless data flow

#### Phase 2: Question Types (10+ Types)
- MCQ 2x2 Cards (flagship) - Beautiful card grid with letter badges
- True/False Block - Statement-based with clear visual feedback
- Matching - Drag-and-drop with keyboard fallback
- Sorting - Alphabetical/chronological ordering
- Ordering - Sequential step arrangement
- Short Answer - Text input with fuzzy matching
- Numerical - Number input with tolerance support
- Gap Dropdown - Fill-in-the-blank with dropdowns
- Gap Drag - Drag words into blanks
- Category Sorting - Sort items into labeled buckets (WHS hazard/control)

#### Phase 3: Feedback System
- Unified Feedback UI component with proper SVG icons
- Checkmark icon (animated draw stroke)
- Cross icon (shake animation)
- Partial credit icon (circle progress)
- Retry icon (rotation animation)
- Trophy icon (celebration animation)
- Confetti cannon physics (100 particles, 60fps, requestAnimationFrame)
- 6-color palette with decay (0.94) and gravity (0.8)
- 100% score celebration overlay

#### Phase 4: Polish & Mobile
- Linear.app-style segmented progress bar
- Keyboard navigation (Enter/Space for selection, Arrow keys for navigation)
- ARIA labels and live regions for accessibility
- Focus management and tab order
- 480px mobile breakpoint
- 44px minimum touch targets
- Responsive card grids

#### Phase 5: Results Dashboard
- Animated SVG score ring with stroke-dasharray technique
- Eased counter animation (cubic-bezier)
- Topic breakdown with performance indicators
- Question review with correct/incorrect highlighting
- Time per question analytics
- Celebratory animations for perfect scores

### Technical Specifications
- Animation timing tokens: fast (120ms), normal (200ms), slow (320ms), slower (500ms)
- Easing functions: standard, decelerate, accelerate, spring (0.34, 1.56, 0.64, 1)
- Design system aligned with lms-labs.com (HSL colors, Inter font, 0.5rem radius)
- Dark mode support with proper contrast ratios
- WCAG 2.1 AA accessibility compliance

## [2.0.3] - 2025-12-20

### Changed
- UI: Force Inter font on mod_form settings page (overrides Moodle theme fonts)

## [2.0.2] - 2025-12-20

### Changed
- Migrated to centralized download architecture
- Updated versioned ZIP filename

## [2.0.1] - 2025-12-18

### Added
- TGA hybrid integration: XML file parsing + REST API + SOAP fallback
- ~2 second lookups for training.gov.au unit competencies
- Production-ready competency mapping

## [2.0.0] - 2025-12-01

### Added
- WORLD-CLASS REBUILD: ChatGPT spec compliant design tokens
- White-first design system (SPEC-001 to SPEC-008)
- Linear.app progress bar
- MCQ 2x2 flagship grid
- 7-screen authoring wizard
- TGA SOAP integration
- Criterion-based generation
- Enhanced mobile experience

## [1.0.0] - 2025-06-01

### Added
- Initial release
- AI-powered quiz generation
- 8 question types
- Moodle 4.0+ compatibility
