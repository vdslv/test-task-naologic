import { Component, computed, signal, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { WorkOrderService } from '../../services/work-order.service';
import { TimelineService, TimescaleType, TimelineColumn } from '../../services/timeline.service';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { WorkOrderPanelComponent, WorkOrderFormData } from '../work-order-panel/work-order-panel.component';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument } from '../../models/work-order.model';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    WorkOrderBarComponent,
    WorkOrderPanelComponent
  ],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent {
  // ViewChild references for scroll synchronization
  @ViewChild('timelineHeader') timelineHeader!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineContent') timelineContent!: ElementRef<HTMLDivElement>;
  @ViewChild('workCentersList') workCentersList!: ElementRef<HTMLDivElement>;

  // Panel state
  isPanelOpen = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  selectedWorkOrder = signal<WorkOrderDocument | null>(null);
  selectedWorkCenterId = signal<string>('');
  initialStartDate = signal<string>('');
  panelError = signal<string>('');

  // Hover state for rows
  hoveredRowId = signal<string | null>(null);

  // Tooltip state
  showTooltip = signal(false);
  tooltipPosition = signal({ x: 0, y: 0 });

  // Hover placeholder state
  hoverPlaceholder = signal<{ workCenterId: string; left: number; width: number } | null>(null);

  // Timescale options for dropdown
  timescaleOptions: { value: TimescaleType; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ];

  // Computed values
  columns = computed(() => this.timelineService.generateColumns());
  totalWidth = computed(() => this.columns().length * this.timelineService.columnWidth());
  todayPosition = computed(() => this.timelineService.getTodayIndicatorPosition());
  
  // Current period badge position (center of current period column)
  currentPeriodBadgePosition = computed(() => {
    const cols = this.columns();
    const currentIndex = cols.findIndex(c => c.isCurrentPeriod);
    if (currentIndex === -1) return null;
    const columnWidth = this.timelineService.columnWidth();
    return (currentIndex * columnWidth) + (columnWidth / 2);
  });

  constructor(
    public workOrderService: WorkOrderService,
    public timelineService: TimelineService
  ) {}

  get currentTimescale(): TimescaleType {
    return this.timelineService.timescale();
  }

  set currentTimescale(value: TimescaleType) {
    this.timelineService.setTimescale(value);
    // Center scroll position so user can scroll both directions
    requestAnimationFrame(() => {
      const content = this.timelineContent?.nativeElement;
      const header = this.timelineHeader?.nativeElement;
      if (content) {
        const centerScroll = (content.scrollWidth - content.clientWidth) / 2;
        content.scrollLeft = centerScroll;
        if (header) {
          header.scrollLeft = centerScroll;
        }
      }
    });
  }

  getWorkOrdersForCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrderService.getWorkOrdersForWorkCenter(workCenterId);
  }

  getBarLeft(workOrder: WorkOrderDocument): number {
    return this.timelineService.calculateBarLeft(workOrder.data.startDate) ?? 0;
  }

  getBarWidth(workOrder: WorkOrderDocument): number {
    return this.timelineService.calculateBarWidth(workOrder.data.startDate, workOrder.data.endDate);
  }

  onTimelineClick(event: MouseEvent, workCenter: WorkCenterDocument): void {
    const target = event.target as HTMLElement;

    // Don't trigger if clicking on a work order bar
    if (target.closest('.work-order-bar')) {
      return;
    }

    const container = target.closest('.timeline-row-content') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const offsetX = event.clientX - rect.left + scrollLeft;

    const clickedDate = this.timelineService.getDateFromPosition(offsetX);

    this.selectedWorkCenterId.set(workCenter.docId);
    this.initialStartDate.set(this.timelineService.formatDateToISO(clickedDate));
    this.selectedWorkOrder.set(null);
    this.panelMode.set('create');
    this.panelError.set('');
    this.isPanelOpen.set(true);
  }

  onEditWorkOrder(workOrder: WorkOrderDocument): void {
    this.selectedWorkOrder.set(workOrder);
    this.selectedWorkCenterId.set(workOrder.data.workCenterId);
    this.panelMode.set('edit');
    this.panelError.set('');
    this.isPanelOpen.set(true);
  }

  onDeleteWorkOrder(workOrder: WorkOrderDocument): void {
    this.workOrderService.deleteWorkOrder(workOrder.docId);
  }

  onPanelClose(): void {
    this.isPanelOpen.set(false);
    this.panelError.set('');
  }

  onPanelSave(formData: WorkOrderFormData): void {
    if (this.panelMode() === 'create') {
      const result = this.workOrderService.createWorkOrder({
        name: formData.name,
        workCenterId: formData.workCenterId,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      if (result.success) {
        this.isPanelOpen.set(false);
        this.panelError.set('');
      } else {
        this.panelError.set(result.error || 'Failed to create work order');
      }
    } else {
      const workOrder = this.selectedWorkOrder();
      if (!workOrder) return;

      const result = this.workOrderService.updateWorkOrder(workOrder.docId, {
        name: formData.name,
        workCenterId: formData.workCenterId,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      if (result.success) {
        this.isPanelOpen.set(false);
        this.panelError.set('');
      } else {
        this.panelError.set(result.error || 'Failed to update work order');
      }
    }
  }

  onRowMouseEnter(workCenterId: string): void {
    this.hoveredRowId.set(workCenterId);
  }

  onRowMouseLeave(): void {
    this.hoveredRowId.set(null);
  }

  onTimelineMouseMove(event: MouseEvent, workCenterId?: string): void {
    const target = event.target as HTMLElement;
    // Only show tooltip and placeholder when hovering over empty timeline area (not on work order bars)
    if (!target.closest('.work-order-bar') && target.closest('.timeline-row-content')) {
      this.showTooltip.set(true);
      this.tooltipPosition.set({ x: event.clientX + 10, y: event.clientY - 30 });

      // Calculate placeholder position
      if (workCenterId) {
        const container = target.closest('.timeline-row-content') as HTMLElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const offsetX = event.clientX - rect.left + container.scrollLeft;
          const columnWidth = this.timelineService.columnWidth();
          // Snap to column and center the placeholder
          const columnIndex = Math.floor(offsetX / columnWidth);
          const placeholderWidth = columnWidth * 0.8; // 80% of column width
          const left = columnIndex * columnWidth + (columnWidth - placeholderWidth) / 2;

          this.hoverPlaceholder.set({
            workCenterId,
            left,
            width: placeholderWidth
          });
        }
      }
    } else {
      this.showTooltip.set(false);
      this.hoverPlaceholder.set(null);
    }
  }

  onTimelineMouseLeave(): void {
    this.showTooltip.set(false);
    this.hoverPlaceholder.set(null);
  }

  goToToday(): void {
    this.timelineService.centerOnToday();
  }

  trackByWorkCenter(index: number, workCenter: WorkCenterDocument): string {
    return workCenter.docId;
  }

  trackByWorkOrder(index: number, workOrder: WorkOrderDocument): string {
    return workOrder.docId;
  }

  trackByColumn(index: number, column: TimelineColumn): string {
    return column.date.toISOString();
  }

  // Threshold in pixels to trigger loading more columns
  private readonly SCROLL_THRESHOLD = 200;
  private isExpandingPast = false;
  private isExpandingFuture = false;

  onTimelineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Sync horizontal scroll with header
    if (this.timelineHeader?.nativeElement) {
      this.timelineHeader.nativeElement.scrollLeft = target.scrollLeft;
    }
    
    // Sync vertical scroll with work centers list
    if (this.workCentersList?.nativeElement) {
      this.workCentersList.nativeElement.scrollTop = target.scrollTop;
    }

    // Check if we need to expand the timeline
    this.checkInfiniteScroll(target);
  }

  private checkInfiniteScroll(container: HTMLElement): void {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;

    // Expand past (prepend columns) when scrolling near left edge
    if (scrollLeft < this.SCROLL_THRESHOLD && !this.isExpandingPast) {
      this.isExpandingPast = true;
      const columnsAdded = this.timelineService.expandPast();
      
      // Adjust scroll position to compensate for prepended content
      requestAnimationFrame(() => {
        const addedWidth = columnsAdded * this.timelineService.columnWidth();
        container.scrollLeft = scrollLeft + addedWidth;
        this.isExpandingPast = false;
      });
    }

    // Expand future (append columns) when scrolling near right edge
    if (scrollRight < this.SCROLL_THRESHOLD && !this.isExpandingFuture) {
      this.isExpandingFuture = true;
      this.timelineService.expandFuture();
      
      requestAnimationFrame(() => {
        this.isExpandingFuture = false;
      });
    }
  }
}
