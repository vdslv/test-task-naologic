import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateFormatter } from '../../shared/services/custom-date-formatter';
import { WorkOrderDocument, WorkOrderStatus } from '../../models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

export interface WorkOrderFormData {
  name: string;
  status: WorkOrderStatus;
  startDate: string;
  endDate: string;
  workCenterId: string;
}

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, NgbDatepickerModule, StatusBadgeComponent, ButtonComponent],
  providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateFormatter }],
  templateUrl: './work-order-panel.component.html',
  styleUrl: './work-order-panel.component.scss'
})
export class WorkOrderPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() workOrder: WorkOrderDocument | null = null;
  @Input() workCenterId: string = '';
  @Input() initialStartDate: string = '';
  @Input() errorMessage: string = '';
  @Input() existingWorkOrders: WorkOrderDocument[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<WorkOrderFormData>();

  form: FormGroup;

  statusOptions: { value: WorkOrderStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'blocked', label: 'Blocked' }
  ];

  validationError: string = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      status: ['open', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.mode === 'edit' && this.workOrder) {
      const startDate = this.parseDate(this.workOrder.data.startDate);
      const endDate = this.parseDate(this.workOrder.data.endDate);

      this.form.patchValue({
        name: this.workOrder.data.name,
        status: this.workOrder.data.status,
        startDate: startDate,
        endDate: endDate
      });
    } else {
      // Create mode - leave dates empty for user to select
      this.form.reset({
        name: '',
        status: 'open',
        startDate: null,
        endDate: null
      });
    }
  }

  private parseDate(dateStr: string): NgbDateStruct {
    const date = new Date(dateStr);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  private formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(date: NgbDateStruct | null): string {
    if (!date) return '';
    const day = date.day.toString().padStart(2, '0');
    const month = date.month.toString().padStart(2, '0');
    const year = date.year;
    return `${day}.${month}.${year}`;
  }

  onSubmit(): void {
    this.validationError = '';
    
    if (this.form.valid) {
      const formValue = this.form.value;
      const startDate = this.formatDate(formValue.startDate);
      const endDate = this.formatDate(formValue.endDate);

      // Validate end date is after start date
      if (new Date(endDate) <= new Date(startDate)) {
        this.validationError = 'End date must be after start date';
        return;
      }

      // Validate no overlap with existing work orders on same work center
      const overlapError = this.checkOverlap(startDate, endDate);
      if (overlapError) {
        this.validationError = overlapError;
        return;
      }

      this.save.emit({
        name: formValue.name,
        status: formValue.status,
        startDate: startDate,
        endDate: endDate,
        workCenterId: this.workCenterId
      });
    }
  }

  private checkOverlap(startDate: string, endDate: string): string | null {
    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();
    
    // Filter work orders for the same work center
    const workOrdersOnSameCenter = this.existingWorkOrders.filter(
      wo => wo.data.workCenterId === this.workCenterId
    );

    for (const wo of workOrdersOnSameCenter) {
      // Skip the current work order if editing
      if (this.mode === 'edit' && this.workOrder && wo.docId === this.workOrder.docId) {
        continue;
      }

      const existingStart = new Date(wo.data.startDate).getTime();
      const existingEnd = new Date(wo.data.endDate).getTime();

      // Check for overlap: ranges overlap if they share any common time
      // Two ranges [A, B] and [C, D] overlap if A <= D AND B >= C
      if (newStart <= existingEnd && newEnd >= existingStart) {
        return `This time period overlaps with "${wo.data.name}" (${wo.data.startDate} - ${wo.data.endDate})`;
      }
    }

    return null;
  }

  onCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-backdrop')) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  getStatusColor(status: WorkOrderStatus): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'in-progress': return 'status-in-progress';
      case 'complete': return 'status-complete';
      case 'blocked': return 'status-blocked';
      default: return '';
    }
  }

  onStartDateSelect(date: NgbDateStruct): void {
    this.form.patchValue({ startDate: date });
  }

  onEndDateSelect(date: NgbDateStruct): void {
    this.form.patchValue({ endDate: date });
  }

  // Mark dates as disabled for end date picker (must be after start date)
  markEndDateDisabled = (date: NgbDateStruct): boolean => {
    const startDate = this.form.get('startDate')?.value;
    if (!startDate) return false;
    
    const dateToCheck = new Date(date.year, date.month - 1, date.day);
    const start = new Date(startDate.year, startDate.month - 1, startDate.day);
    
    // Disable dates on or before start date
    return dateToCheck <= start;
  };

  // Mark dates as disabled for start date picker (must be before end date)
  markStartDateDisabled = (date: NgbDateStruct): boolean => {
    const endDate = this.form.get('endDate')?.value;
    if (!endDate) return false;
    
    const dateToCheck = new Date(date.year, date.month - 1, date.day);
    const end = new Date(endDate.year, endDate.month - 1, endDate.day);
    
    // Disable dates on or after end date
    return dateToCheck >= end;
  };

}
