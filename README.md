# Work Order Schedule Timeline

An interactive timeline component for a manufacturing ERP system that allows users to visualize, create, and edit work orders across multiple work centers.

## Features

- **Timeline Grid**: Displays work orders across multiple work centers with Day/Week/Month zoom levels
- **Work Order Bars**: Visual representation with status indicators (Open, In Progress, Complete, Blocked)
- **Create/Edit Panel**: Slide-out panel with form validation for managing work orders
- **Overlap Detection**: Prevents scheduling conflicts on the same work center
- **localStorage Persistence**: Work orders survive page refresh (bonus feature)
- **Keyboard Navigation**: Escape key to close panel (bonus feature)
- **Today Button**: Quick navigation to current date (bonus feature)
- **Smooth Animations**: Panel slide-in/out transitions (bonus feature)

## Tech Stack

- **Angular 21** (standalone components)
- **TypeScript** (strict mode)
- **SCSS** for styling
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
│   ├── timeline/                 # Main timeline grid component
│   ├── work-order-bar/           # Individual work order bar component
│   └── work-order-panel/         # Create/Edit slide-out panel
├── models/
│   ├── work-center.model.ts      # WorkCenter interface
│   └── work-order.model.ts       # WorkOrder interface & status types
├── services/
│   ├── timeline.service.ts       # Date calculations & timeline logic
│   └── work-order.service.ts     # Data management & CRUD operations
└── data/
    └── sample-data.ts            # Hardcoded sample data
```

## Architecture Decisions

### Standalone Components
All components are standalone for better tree-shaking and simpler imports.

### Signal-based State Management
Using Angular Signals for reactive state management instead of RxJS BehaviorSubjects for simpler, more performant reactivity.

### Service Layer Separation
- **TimelineService**: Handles all date calculations, column generation, and bar positioning
- **WorkOrderService**: Manages work order CRUD operations, overlap detection, and localStorage persistence

### Reusable Components
- **WorkOrderBarComponent**: Reusable bar component with status styling and actions menu
- **WorkOrderPanelComponent**: Single panel component handles both create and edit modes

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
- [ ] Infinite scroll for timeline (dynamically load more dates)
- [ ] Tooltip on bar hover showing full details
- [ ] Unit tests with Jest
- [ ] E2E tests with Playwright
- [ ] Virtual scrolling for large datasets
- [ ] Undo/redo functionality
- [ ] Export to PDF/Excel

## Author

Built as a technical assessment for a Frontend Developer position.
