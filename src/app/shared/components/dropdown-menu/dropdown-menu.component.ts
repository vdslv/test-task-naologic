import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownMenuItem {
  label: string;
  value: string;
  variant?: 'default' | 'danger';
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.scss'
})
export class DropdownMenuComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Input() isOpen: boolean = false;
  @Input() position: { top: number; left: number } = { top: 0, left: 0 };
  
  @Output() itemClick = new EventEmitter<DropdownMenuItem>();
  @Output() close = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  onItemClick(item: DropdownMenuItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemClick.emit(item);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }
}
