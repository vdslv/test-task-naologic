import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'open' | 'in-progress' | 'complete' | 'blocked';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: StatusType;
  @Input() label?: string;

  get statusClass(): string {
    return `status-${this.status}`;
  }

  get statusLabel(): string {
    if (this.label) return this.label;
    
    const labels: Record<StatusType, string> = {
      'open': 'Open',
      'in-progress': 'In progress',
      'complete': 'Complete',
      'blocked': 'Blocked'
    };
    return labels[this.status] || this.status;
  }
}
