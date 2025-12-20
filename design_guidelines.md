# AISiksha Admin Course Factory - Design Guidelines

## Design Approach
**Selected System:** Modern SaaS Admin Interface (Reference: Linear, Notion, Vercel Dashboard)

**Rationale:** This is a utility-focused, data-heavy admin platform requiring efficiency, clarity, and professional credibility. The interface must support complex workflows (create → review → edit → publish) while maintaining consistency across dense information displays.

**Core Principles:**
- Clarity over decoration
- Information density with breathing room
- Obvious workflow states
- Fast scanning and decision-making

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for code snippets, IDs)

**Hierarchy:**
```
Page Titles: text-3xl font-bold tracking-tight
Section Headers: text-xl font-semibold
Card Titles: text-lg font-medium
Body Text: text-base font-normal
Labels: text-sm font-medium
Captions/Meta: text-sm text-muted-foreground
Data Tables: text-sm
```

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 8, 12, 16** exclusively
- Tight spacing: gap-2, p-2 (within components)
- Standard spacing: gap-4, p-4 (between related elements)
- Section spacing: gap-8, p-8 (major sections)
- Page margins: p-12, p-16 (outer containers)

**Grid Strategy:**
- Dashboard/Listing pages: 12-column grid
- Form layouts: 2-column on desktop (grid-cols-2), single on mobile
- Content editor: Single column with max-w-4xl for optimal reading

**Container Widths:**
- Full dashboard: max-w-7xl mx-auto px-8
- Content editors: max-w-4xl mx-auto
- Modals/Drawers: max-w-2xl

---

## Core Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with shadow-sm
- Logo left, admin profile/actions right
- Height: h-16
- Contains breadcrumbs for deep navigation

**Sidebar (Optional for advanced views):**
- Width: w-64
- Collapsible to icon-only
- Active state with subtle indicator bar

### Data Display
**Course Listing Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card structure: rounded-lg border with hover:shadow-md transition
- Card content: Title + status badge + metadata (modules count, duration) + action buttons
- Status badges: Small rounded pills (px-2 py-1 text-xs font-medium)

**Data Tables:**
- Striped rows for scannability
- Sticky header (sticky top-0)
- Action column always right-aligned
- Compact row height with py-3
- Include: Course name, status, created date, module count, action menu

**Status Indicators:**
- Draft: Subtle neutral badge
- Published: Prominent success badge  
- Generating: Animated badge with spinner
- Error: Warning badge

### Forms & Input
**Course Creation Form:**
- Two-column layout on desktop
- Group related fields with border rounded-lg p-6
- Required field indicators (*)
- Helper text below inputs (text-sm)
- Generous input sizing: h-10 for text inputs

**AI Command Input:**
- Prominent textarea: min-h-32, rounded-lg, border-2
- Clear placeholder with examples
- Submit button: Large, primary action style
- Character counter if needed

**Rich Text Editor (for AI Notes):**
- Full-width with toolbar
- Preview/Edit toggle
- Markdown support with syntax highlighting
- Save/Discard actions sticky at bottom

### Workflow Components
**Module Builder:**
- Drag-and-drop list with handle icons (Font Awesome)
- Each module: Expandable accordion
- Add module button prominent at bottom
- Inline edit with save/cancel micro-actions

**AI Generation Preview:**
- Loading state: Skeleton loaders with pulse animation
- Generated content: White card with subtle border
- Edit button overlays on hover
- Approve/Regenerate actions at bottom

**Publishing Workflow:**
- Step indicator at top (1. Create → 2. Review → 3. Publish)
- Review screen: Side-by-side comparison if edited
- Publish button: Prominent, requires confirmation modal

### Modals & Overlays
**Confirmation Dialogs:**
- Centered, max-w-md
- Clear title, description, two-action footer
- Dangerous actions (delete): Warning styling

**Slide-out Panels (for editing):**
- Fixed right side, w-1/2 or w-2/3
- Smooth slide animation
- Close button top-right
- Actions sticky at bottom

---

## Icons
**Library:** Heroicons (via CDN)
**Usage:**
- Navigation: 20px (h-5 w-5)
- Buttons: 16px (h-4 w-4)
- Status indicators: 12px (h-3 w-3)
- Module handles: 20px

**Common Icons:**
- Plus (add actions)
- Pencil (edit)
- Trash (delete)
- Eye (preview)
- CheckCircle (published)
- Clock (draft)
- Sparkles (AI generation)

---

## Responsive Behavior
- Mobile: Single column, collapsible sidebar, bottom navigation
- Tablet: Two-column forms, side-by-side previews
- Desktop: Full multi-column layouts, persistent sidebar

---

## Dashboard Layout Structure
**Main Dashboard:**
1. Top stats bar: Total courses, Published, Drafts, Generating (4-column grid with icons)
2. Quick actions: "Create New Course" prominent card
3. Recent courses table with filters (Status, Date, Search)
4. Pagination at bottom

**Course Editor Layout:**
1. Breadcrumb navigation
2. Course header (name + status badge + actions)
3. Tabbed content: Overview | Modules | Projects | Tests | Settings
4. Content area with save/publish footer

---

## Image Strategy
**No hero images** - This is an admin interface focused on functionality.

**Supporting Imagery:**
- Empty states: Illustrations for "No courses yet" (simple line drawings)
- AI generation indicators: Subtle animated graphics during processing
- Course thumbnails: Optional small image uploads (aspect-ratio-video, rounded-md)

---

## Interaction Patterns
- Hover states: Subtle shadow-md on cards
- Loading: Skeleton screens for AI generation, spinners for quick actions
- Success feedback: Toast notifications (top-right, slide-in)
- Error handling: Inline validation messages, error toast for critical failures

---

## Accessibility
- All forms: Proper labels with htmlFor
- Status badges: Include sr-only text
- Keyboard navigation: Focus rings visible, tab order logical
- ARIA labels on icon-only buttons