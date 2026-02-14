# Work Order Schedule Timeline

An interactive timeline component for a manufacturing ERP system that allows users to visualize, create, and edit work orders across multiple work centers.

## Features

### Core Features
- **Timeline Grid**: Displays work orders across multiple work centers with Day/Week/Month zoom levels
- **Work Order Bars**: Visual representation with status indicators (Open, In Progress, Complete, Blocked)
- **Create/Edit Panel**: Slide-out panel with form validation for managing work orders
- **Overlap Detection**: Prevents scheduling conflicts on the same work center
- **Three-dot Actions Menu**: Edit/Delete options for each work order

### Bonus Features Implemented
- **localStorage Persistence**: Work orders survive page refresh
- **Infinite Scroll**: Dynamically loads more date columns as user scrolls left/right
- **Keyboard Navigation**: Escape key to close panel
- **Smooth Animations**: Panel slide-in/out transitions
- **Custom Datepicker Styling**: Matches design system
- **Click-to-Add Tooltip**: Shows hint when hovering over empty timeline area

## Tech Stack

- **Angular 17+** (standalone components)
- **TypeScript** (strict mode)
- **SCSS** for styling with design system (variables, mixins)
- **Reactive Forms** (FormGroup, FormControl, Validators)
- **ng-select** for dropdown components
- **@ng-bootstrap/ng-bootstrap** (ngb-datepicker) for date picking
- **Signals** for reactive state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
ng serve
# or
npm start
```

Navigate to `http://localhost:4200/` in your browser.

### Build

```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/app/
├── components/
│   ├── timeline/                 # Main timeline grid component (CSS Grid layout)
│   ├── work-order-bar/           # Individual work order bar with actions menu
│   └── work-order-panel/         # Create/Edit slide-out panel
├── shared/
│   ├── components/
│   │   ├── button/               # Reusable button component
│   │   └── status-badge/         # Status badge component
│   └── services/
│       └── custom-date-formatter.ts  # NgbDatepicker formatter (MM.DD.YYYY)
├── models/
│   ├── work-center.model.ts      # WorkCenter interface
│   └── work-order.model.ts       # WorkOrder interface & status types
├── services/
│   ├── date-utils.service.ts     # Centralized date operations
│   ├── timeline.service.ts       # Timeline logic & infinite scroll
│   └── work-order.service.ts     # CRUD operations & localStorage
├── styles/
│   ├── _variables.scss           # Design tokens (colors, spacing, etc.)
│   └── _mixins.scss              # Reusable SCSS mixins
└── data/
    └── sample-data.ts            # Hardcoded sample data (6 work centers, 8 orders)
```

## Architecture Decisions

### Standalone Components
All components are standalone for better tree-shaking and simpler imports.

### Signal-based State Management
Using Angular Signals for reactive state management instead of RxJS BehaviorSubjects for simpler, more performant reactivity.

### Service Layer Separation
- **DateUtilsService**: Centralized date operations (formatting, conversion, arithmetic, comparison)
- **TimelineService**: Timeline logic, column generation, bar positioning, infinite scroll
- **WorkOrderService**: CRUD operations, overlap detection, localStorage persistence

### Design System
- **_variables.scss**: Single source of truth for colors, spacing, typography, z-index
- **_mixins.scss**: Reusable SCSS patterns (forms, badges, tooltips, etc.)
- Status colors consolidated in variables for consistency

### CSS Grid Layout
Timeline uses CSS Grid (2x2) for proper alignment:
- Top-left: Work center header (fixed)
- Top-right: Timeline header (synced horizontal scroll)
- Bottom-left: Work center list (synced vertical scroll)
- Bottom-right: Timeline content (scrolls both ways)

### Reusable Components
- **StatusBadgeComponent**: Shared badge with status colors
- **ButtonComponent**: Reusable button with variants
- **WorkOrderPanelComponent**: Single panel handles both create and edit modes

## Key Implementation Details

### Date Positioning
Bar positions are calculated based on:
1. The visible date range (determined by timescale and view start date)
2. Column width (varies by timescale)
3. Date difference between work order start and view start

```typescript
// Calculate bar left position
calculateBarLeft(startDate: string): number {
  const daysDiff = this.daysBetween(viewStart, orderStart);
  return daysDiff * this.columnWidth();
}
```

### Overlap Detection
Before creating/updating a work order, the service checks for overlaps:

```typescript
checkOverlap(workCenterId, startDate, endDate, excludeOrderId?): boolean {
  // Overlap occurs if: newStart < orderEnd AND newEnd > orderStart
  return orders.some(order => newStart < orderEnd && newEnd > orderStart);
}
```

### Form Validation
- All fields required
- End date must be after start date
- Overlap validation on submit

## Sample Data

The application includes sample data with:
- 5 work centers (Genesis Hardware, Rodriques Electrics, etc.)
- 8 work orders across different centers
- All 4 status types represented
- Multiple orders on same work center (non-overlapping)

## Libraries Used

| Library | Purpose |
|---------|---------|
| @ng-select/ng-select | Dropdown/select components with custom templates |
| @ng-bootstrap/ng-bootstrap | Date picker component (ngb-datepicker) |
| @popperjs/core | Positioning engine for ng-bootstrap |

## Design Implementation

- **Font**: Circular Std (loaded from naologic CDN)
- **Colors**: Matched to Sketch designs
- **Status badges**: Color-coded by status type
- **Responsive**: Works on smaller screens with horizontal scroll

## Future Improvements (@upgrade)

- [ ] Drag-and-drop to resize/move work orders
- [ ] Tooltip on bar hover showing full work order details
- [ ] Unit tests with Jest
- [ ] E2E tests with Playwright
- [ ] Virtual scrolling for large datasets
- [ ] Undo/redo functionality
- [ ] Export to PDF/Excel
- [ ] "Today" button to quickly center on current date
- [ ] ARIA labels and focus management for accessibility

## Demo Video

[Loom video link here] - 5-10 minute walkthrough demonstrating:
- Application running with sample data
- All zoom levels (Day/Week/Month switching)
- Creating a new work order
- Editing an existing work order
- Deleting a work order
- Overlap error scenario
- Code structure overview

## Author

Built as a technical assessment for a Frontend Developer position.
