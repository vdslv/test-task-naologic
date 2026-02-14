import { Injectable, signal, computed } from '@angular/core';

export type TimescaleType = 'day' | 'week' | 'month';

export interface TimelineColumn {
  date: Date;
  label: string;
  isCurrentPeriod: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private timescaleSignal = signal<TimescaleType>('month');
  private viewStartDateSignal = signal<Date>(new Date());

  readonly timescale = this.timescaleSignal.asReadonly();
  readonly viewStartDate = this.viewStartDateSignal.asReadonly();

  // Column width in pixels based on timescale
  readonly columnWidth = computed(() => {
    switch (this.timescaleSignal()) {
      case 'day': return 120;
      case 'week': return 100;
      case 'month': return 100;
    }
  });

  // Number of columns to display based on timescale
  readonly visibleColumns = computed(() => {
    switch (this.timescaleSignal()) {
      case 'day': return 30;    // ~1 month of days
      case 'week': return 16;   // ~4 months of weeks
      case 'month': return 12;  // 1 year of months
    }
  });

  constructor() {
    this.centerOnToday();
  }

  setTimescale(scale: TimescaleType): void {
    this.timescaleSignal.set(scale);
    this.centerOnToday();
  }

  centerOnToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const offset = Math.floor(this.visibleColumns() / 2);

    switch (this.timescaleSignal()) {
      case 'day':
        this.viewStartDateSignal.set(this.addDays(today, -offset));
        break;
      case 'week':
        const weekStart = this.getWeekStart(today);
        this.viewStartDateSignal.set(this.addDays(weekStart, -offset * 7));
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        this.viewStartDateSignal.set(monthStart);
        break;
    }
  }

  /**
   * Generate timeline columns based on current timescale and view start date
   */
  generateColumns(): TimelineColumn[] {
    const columns: TimelineColumn[] = [];
    const startDate = new Date(this.viewStartDateSignal());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < this.visibleColumns(); i++) {
      let date: Date;
      let label: string;
      let isCurrentPeriod = false;

      switch (this.timescaleSignal()) {
        case 'day':
          date = this.addDays(startDate, i);
          label = this.formatDayLabel(date);
          isCurrentPeriod = this.isSameDay(date, today);
          break;
        case 'week':
          date = this.addDays(startDate, i * 7);
          label = this.formatWeekLabel(date);
          isCurrentPeriod = this.isCurrentWeek(date, today);
          break;
        case 'month':
          date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          label = this.formatMonthLabel(date);
          isCurrentPeriod = this.isSameMonth(date, today);
          break;
      }

      columns.push({ date, label, isCurrentPeriod });
    }

    return columns;
  }

  /**
   * Calculate the left position (in pixels) for a work order bar
   * @param startDate - Work order start date (ISO string)
   * @returns Left position in pixels, or null if outside visible range
   */
  calculateBarLeft(startDate: string): number | null {
    const orderStart = new Date(startDate);
    orderStart.setHours(0, 0, 0, 0);
    const viewStart = new Date(this.viewStartDateSignal());
    viewStart.setHours(0, 0, 0, 0);

    let position: number;

    switch (this.timescaleSignal()) {
      case 'day':
        const daysDiff = this.daysBetween(viewStart, orderStart);
        position = daysDiff * this.columnWidth();
        break;
      case 'week':
        const weeksDiff = this.daysBetween(viewStart, orderStart) / 7;
        position = weeksDiff * this.columnWidth();
        break;
      case 'month':
        const monthsDiff = this.monthsBetween(viewStart, orderStart);
        position = monthsDiff * this.columnWidth();
        break;
    }

    return position;
  }

  /**
   * Calculate the width (in pixels) for a work order bar
   * @param startDate - Work order start date (ISO string)
   * @param endDate - Work order end date (ISO string)
   * @returns Width in pixels
   */
  calculateBarWidth(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let width: number;
    const minWidth = 80; // Minimum bar width for readability

    switch (this.timescaleSignal()) {
      case 'day':
        const days = this.daysBetween(start, end) + 1; // +1 to include end date
        width = days * this.columnWidth();
        break;
      case 'week':
        const weeks = (this.daysBetween(start, end) + 1) / 7;
        width = weeks * this.columnWidth();
        break;
      case 'month':
        const months = this.monthsBetween(start, end) + (end.getDate() / 30);
        width = Math.max(months, 0.5) * this.columnWidth();
        break;
    }

    return Math.max(width, minWidth);
  }

  /**
   * Get the date from a click position on the timeline
   * @param offsetX - X offset from timeline container start
   * @returns Date at that position
   */
  getDateFromPosition(offsetX: number): Date {
    const columnIndex = Math.floor(offsetX / this.columnWidth());
    const viewStart = new Date(this.viewStartDateSignal());

    switch (this.timescaleSignal()) {
      case 'day':
        return this.addDays(viewStart, columnIndex);
      case 'week':
        return this.addDays(viewStart, columnIndex * 7);
      case 'month':
        return new Date(viewStart.getFullYear(), viewStart.getMonth() + columnIndex, 1);
    }
  }

  /**
   * Calculate the position of the "today" indicator line
   * @returns Left position in pixels, or null if today is outside visible range
   */
  getTodayIndicatorPosition(): number | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.calculateBarLeft(today.toISOString().split('T')[0]);
  }

  // Date utility methods
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private daysBetween(start: Date, end: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end.getTime() - start.getTime()) / msPerDay);
  }

  private monthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + (end.getDate() - 1) / 30;
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    result.setDate(diff);
    return result;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  private isCurrentWeek(weekStart: Date, today: Date): boolean {
    const weekEnd = this.addDays(weekStart, 6);
    return today >= weekStart && today <= weekEnd;
  }

  private formatDayLabel(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }

  private formatWeekLabel(date: Date): string {
    const weekEnd = this.addDays(date, 6);
    const startStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  }

  private formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Format date to ISO string (YYYY-MM-DD)
  formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Format date for display (DD.MM.YYYY)
  formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
