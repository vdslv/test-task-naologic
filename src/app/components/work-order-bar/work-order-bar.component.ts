import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, WorkOrderStatus } from '../../models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './work-order-bar.component.html',
  styleUrl: './work-order-bar.component.scss'
})
export class WorkOrderBarComponent {
  @Input() workOrder!: WorkOrderDocument;
  @Input() left: number = 0;
  @Input() width: number = 100;

  @Output() edit = new EventEmitter<WorkOrderDocument>();
  @Output() delete = new EventEmitter<WorkOrderDocument>();

  isMenuOpen = false;
  isHovered = false;
  dropdownPosition = { top: 0, left: 0 };

  constructor(private elementRef: ElementRef) {}

  get statusLabel(): string {
    switch (this.workOrder.data.status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In progress';
      case 'complete': return 'Complete';
      case 'blocked': return 'Blocked';
      default: return '';
    }
  }

  get statusClass(): string {
    return `status-${this.workOrder.data.status}`;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    
    if (!this.isMenuOpen) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + 4,
        left: rect.right - 120 // 120px is min-width of dropdown
      };
    }
    
    this.isMenuOpen = !this.isMenuOpen;
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = false;
    this.edit.emit(this.workOrder);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = false;
    this.delete.emit(this.workOrder);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isHovered = false;
    if (!this.isMenuOpen) {
      // Keep menu button visible if menu is open
    }
  }
}
