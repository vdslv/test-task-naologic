import { Component, computed, signal } from '@angular/core';
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
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent {
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

  constructor(
    public workOrderService: WorkOrderService,
    public timelineService: TimelineService
  ) {}

  get currentTimescale(): TimescaleType {
    return this.timelineService.timescale();
  }

  set currentTimescale(value: TimescaleType) {
    this.timelineService.setTimescale(value);
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
}
