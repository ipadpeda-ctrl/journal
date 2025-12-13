# Trading Journal - Design Guidelines

## Design Approach
**System Selected**: Hybrid approach drawing from Linear's clean data presentation, TradingView's financial dashboard aesthetics, and Notion's flexible data tables.

**Rationale**: This is a data-intensive productivity tool requiring clarity, speed, and efficient information display. The design prioritizes functionality while maintaining visual sophistication through typography hierarchy and precise spacing.

## Typography System
- **Primary Font**: Inter or IBM Plex Sans (web font via CDN)
- **Data/Numbers Font**: IBM Plex Mono for tabular data and metrics
- **Hierarchy**:
  - Page headers: text-2xl font-semibold
  - Section titles: text-lg font-medium
  - Table headers: text-sm font-medium uppercase tracking-wide
  - Body/data: text-sm font-normal
  - Labels: text-xs font-medium uppercase tracking-wider
  - Large metrics: text-4xl font-bold (for win rate, equity)

## Layout & Spacing System
**Tailwind Units**: Standardize on 2, 4, 6, 8, 12, 16 for consistency
- Component padding: p-4 to p-6
- Section margins: mb-8 to mb-12
- Card spacing: gap-6 between cards
- Form field spacing: space-y-4
- Grid gaps: gap-4 or gap-6

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-4
- Dashboard: 2-column grid (lg:grid-cols-2) for charts
- Statistics bar: 4-column grid (grid-cols-2 lg:grid-cols-4) for metrics
- Table: Full width within container

## Core Components

### 1. Quick Entry Form (Priority Component)
**Layout**: Compact horizontal form with inline labels
- Group related fields (Pair/Direction, Target/SL/BE)
- Auto-complete dropdown for instrument pairs
- Radio buttons for Long/Short direction styled as pill toggles
- Number inputs with clear visual focus states
- Confluences section with multi-select tag interface (separate PRO/CONTRO columns)
- Submit button: prominent, right-aligned
- "Duplicate Last" secondary button for speed

### 2. Operations Table
**Structure**: Dense data table with fixed header
- Sticky header row on scroll
- Alternating row treatment for readability
- Sortable columns (arrows in headers)
- Inline icons for direction (↑ Long, ↓ Short)
- Right-aligned numeric columns
- Condensed cell padding (px-3 py-2)
- Quick actions column (edit/delete icons)
- Filter bar above table with date range and dropdown filters

### 3. Statistics Dashboard
**Top Metrics Bar**: 4 key stats in card grid
- Large number (text-4xl) with small label below
- Metrics: Total Operations, Win Rate %, Profit Factor, Total Equity
- Compact cards with minimal padding (p-4)

**Charts Grid**: 2-column responsive layout
- Chart 1: Trade Distribution (horizontal bar chart - Target/Stop/Breakeven counts)
- Chart 2: Direction Distribution (donut chart - Long vs Short percentage)
- Chart 3: Win Rate Visual (donut with center percentage)
- Chart 4: Equity Curve (line chart spanning full width below, lg:col-span-2)
- Chart 5: Emotional Frequency (vertical bar chart, full width, lg:col-span-2)

Each chart in card container with:
- Title: text-sm font-medium mb-4
- Chart area: h-64 for consistency
- Minimal borders, clean separation

### 4. Confluences Management
**Tag System**: 
- Badge-style tags with remove icon
- Two sections side-by-side: PRO | CONTRO
- Add new tag input with + button
- Visual counter showing total PRO vs CONTRO per operation
- Tag colors differentiated subtly through opacity variations

## Navigation
**Single-page layout with tabbed sections**:
- Sticky top nav bar (h-16)
- Horizontal tabs: Dashboard | Operations | New Entry | Settings
- Active tab indicator (border-b-2)
- Clean, minimal tab design without backgrounds

## Component Patterns

### Cards
- Rounded corners: rounded-lg
- Subtle borders for definition
- Padding: p-6 for content areas
- Shadow: minimal or none for flat aesthetic

### Forms
- Floating labels or left-aligned labels (text-sm mb-1)
- Input height: h-10 for consistency
- Focus rings: ring-2 for accessibility
- Error states: red accent border with helper text below

### Buttons
- Primary: px-6 py-2 rounded-md font-medium
- Secondary: px-4 py-2 with border variant
- Icon buttons: square aspect ratio, p-2
- Button groups: gap-2 between elements

### Tables
- Border collapse with subtle dividers
- Hover row highlight for interactivity
- Checkbox column for bulk actions
- Fixed width for action column (w-24)

## Iconography
**Library**: Heroicons (via CDN)
- 20px size for inline icons
- 24px for standalone/navigation icons
- Consistent stroke-width across interface

## Responsive Behavior
**Breakpoints**:
- Mobile (base): Single column, stacked components
- Tablet (md): 768px - 2-column dashboard grid
- Desktop (lg): 1024px - Full grid layouts, side-by-side forms

**Mobile Priorities**:
- Quick entry form converts to vertical layout
- Charts stack to single column
- Table becomes horizontally scrollable
- Metrics remain in 2-column grid (grid-cols-2)

## Data Visualization
**Chart Library**: Chart.js or Recharts
- Minimal grid lines
- Clear axis labels (text-xs)
- Tooltips on hover with detailed data
- Legend placement: top-right or bottom-center
- Consistent height: h-64 for all charts except equity curve (h-80)

## Accessibility
- Keyboard navigation throughout
- ARIA labels for all interactive elements
- Form validation with clear error messages
- High contrast ratios for text legibility
- Focus indicators on all inputs and buttons

## Special Features
**Keyboard Shortcuts**: Display modal with Cmd/Ctrl + K
- N: New entry
- D: Dashboard view
- T: Operations table
- /: Focus search/filter

**State Management**: Loading skeletons for async operations, inline success/error toasts

This design creates a professional, fast, and data-focused trading journal that prioritizes information clarity and rapid data entry while maintaining visual sophistication through precise typography and spacing.