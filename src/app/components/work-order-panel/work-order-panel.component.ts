import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
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
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule, StatusBadgeComponent, ButtonComponent],
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

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<WorkOrderFormData>();

  form: FormGroup;

  statusOptions: { value: WorkOrderStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'complete', label: 'Complete' },
    { value: 'blocked', label: 'Blocked' }
  ];

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
      // Create mode - use initial start date or today
      const startDate = this.initialStartDate
        ? this.parseDate(this.initialStartDate)
        : this.parseDate(new Date().toISOString().split('T')[0]);

      // Default end date is start + 7 days
      const endDateObj = new Date(this.initialStartDate || new Date());
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDate = this.parseDate(endDateObj.toISOString().split('T')[0]);

      this.form.reset({
        name: '',
        status: 'open',
        startDate: startDate,
        endDate: endDate
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
    if (this.form.valid) {
      const formValue = this.form.value;

      // Validate end date is after start date
      const startDate = this.formatDate(formValue.startDate);
      const endDate = this.formatDate(formValue.endDate);

      if (new Date(endDate) <= new Date(startDate)) {
        return; // Could show error, but form validation should handle this
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
}
