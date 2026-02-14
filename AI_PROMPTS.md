# AI Prompts Used During Development

This document captures key AI-assisted decisions and prompts used during the development of the Work Order Schedule Timeline component.

## Project Setup

**Prompt**: "Create an Angular 17+ project with standalone components, SCSS styling, and the required dependencies (ng-select, ng-bootstrap)"

**Decision**: Used Angular CLI to scaffold the project with standalone components as the default, which aligns with modern Angular best practices and provides better tree-shaking.

## Architecture Decisions

### State Management

**Prompt**: "What's the best approach for state management in a timeline component with reactive updates?"

**Decision**: Chose Angular Signals over RxJS BehaviorSubjects because:
- Simpler API with less boilerplate
- Better performance with fine-grained reactivity
- Native Angular feature (no additional dependencies)
- Easier to understand and maintain

### Service Separation

**Prompt**: "How should I organize the services for timeline calculations and data management?"

**Decision**: Created two separate services:
1. `TimelineService` - Handles all date/time calculations, column generation, and positioning logic
2. `WorkOrderService` - Manages CRUD operations, overlap detection, and localStorage persistence

This follows the Single Responsibility Principle (SOLID) and makes the code more testable.

## Date Positioning Logic

**Prompt**: "How to calculate pixel positions for work order bars based on dates and zoom levels?"

**Solution**: 
```typescript
// The key insight is to calculate the difference between the work order start date
// and the visible timeline start date, then multiply by column width
calculateBarLeft(startDate: string): number {
  const daysDiff = this.daysBetween(viewStart, orderStart);
  
  switch (timescale) {
    case 'day': return daysDiff * columnWidth;
    case 'week': return (daysDiff / 7) * columnWidth;
    case 'month': return monthsDiff * columnWidth;
  }
}
```

## Overlap Detection Algorithm

**Prompt**: "What's the most efficient way to detect overlapping date ranges?"

**Solution**: Two date ranges overlap if and only if:
- Range A starts before Range B ends, AND
- Range A ends after Range B starts

```typescript
// Overlap formula: startA < endB && endA > startB
const hasOverlap = newStart < orderEnd && newEnd > orderStart;
```

## Component Design

### Panel Component

**Prompt**: "Should I create separate components for Create and Edit panels, or use a single component with modes?"

**Decision**: Single component with `mode: 'create' | 'edit'` input because:
- DRY principle - avoids code duplication
- Same form structure for both operations
- Easier to maintain consistency
- Single source of truth for form validation

### Work Order Bar

**Prompt**: "How to handle the three-dot menu and hover states efficiently?"

**Decision**: Used `@HostListener` for document clicks to close dropdown, and CSS-based hover states with Angular class bindings for performance.

## Styling Approach

**Prompt**: "How to achieve pixel-perfect design matching while maintaining maintainability?"

**Decisions**:
1. Used SCSS variables for consistent colors and spacing
2. Followed BEM-like naming conventions
3. Used `::ng-deep` sparingly and only for third-party component styling (ng-select, ngb-datepicker)
4. Kept component styles scoped to prevent leakage

## Performance Considerations

**Prompt**: "How to optimize the timeline for smooth scrolling and rendering?"

**Decisions**:
1. Used `trackBy` functions in all `@for` loops
2. Computed values with Angular `computed()` for derived state
3. Minimal DOM updates through signal-based reactivity
4. CSS transforms for animations (GPU-accelerated)

## localStorage Implementation

**Prompt**: "Best practice for persisting work orders to localStorage?"

**Decision**: 
- Save on every CRUD operation (immediate persistence)
- Load on service initialization
- Fall back to sample data if localStorage is empty
- Use JSON serialization for the document structure

## Future Considerations

These are areas identified for potential improvement:

1. **Virtual Scrolling**: For timelines with many work centers, implement virtual scrolling
2. **Drag & Drop**: Add ability to drag work order bars to reschedule
3. **Infinite Scroll**: Dynamically load more date columns as user scrolls
4. **Undo/Redo**: Implement command pattern for reversible actions
