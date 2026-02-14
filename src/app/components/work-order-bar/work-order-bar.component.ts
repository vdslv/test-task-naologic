import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, WorkOrderStatus } from '../../models';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule],
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
