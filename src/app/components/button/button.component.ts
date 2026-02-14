import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'regular' | 'primary';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'regular';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  
  @Output() clicked = new EventEmitter<void>();

  get buttonClass(): string {
    return `btn btn-${this.variant}`;
  }

  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
