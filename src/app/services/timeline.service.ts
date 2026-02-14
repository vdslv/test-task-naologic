import { Injectable, signal, inject } from '@angular/core';
import { DateUtilsService } from './date-utils.service';

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
  private dateUtils = inject(DateUtilsService);

  private timescaleSignal = signal<TimescaleType>('month');
  private viewStartDateSignal = signal<Date>(new Date());
  private viewEndDateSignal = signal<Date>(new Date());

  readonly timescale = this.timescaleSignal.asReadonly();
  readonly viewStartDate = this.viewStartDateSignal.asReadonly();
  readonly viewEndDate = this.viewEndDateSignal.asReadonly();

  // Buffer columns to load when scrolling near edges
  private readonly BUFFER_COLUMNS = 6;

  // Fixed column width in pixels
  readonly columnWidth = () => 110;

  // Initial number of columns to display
  private readonly INITIAL_COLUMNS = 12;

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

    const offset = Math.floor(this.INITIAL_COLUMNS / 2);

    switch (this.timescaleSignal()) {
      case 'day':
        this.viewStartDateSignal.set(this.addDays(today, -offset));
        this.viewEndDateSignal.set(this.addDays(today, offset));
        break;
      case 'week':
        const weekStart = this.getWeekStart(today);
        this.viewStartDateSignal.set(this.addDays(weekStart, -offset * 7));
        this.viewEndDateSignal.set(this.addDays(weekStart, offset * 7));
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        this.viewStartDateSignal.set(monthStart);
        this.viewEndDateSignal.set(monthEnd);
        break;
    }
  }

  /**
   * Expand the timeline by prepending earlier dates
   * @returns Number of columns added (for scroll adjustment)
   */
  expandPast(): number {
    const columnsToAdd = this.BUFFER_COLUMNS;
    const currentStart = new Date(this.viewStartDateSignal());

    switch (this.timescaleSignal()) {
      case 'day':
        this.viewStartDateSignal.set(this.addDays(currentStart, -columnsToAdd));
        break;
      case 'week':
        this.viewStartDateSignal.set(this.addDays(currentStart, -columnsToAdd * 7));
        break;
      case 'month':
        this.viewStartDateSignal.set(new Date(currentStart.getFullYear(), currentStart.getMonth() - columnsToAdd, 1));
        break;
    }

    return columnsToAdd;
  }

  /**
   * Expand the timeline by appending future dates
   * @returns Number of columns added
   */
  expandFuture(): number {
    const columnsToAdd = this.BUFFER_COLUMNS;
    const currentEnd = new Date(this.viewEndDateSignal());

    switch (this.timescaleSignal()) {
      case 'day':
        this.viewEndDateSignal.set(this.addDays(currentEnd, columnsToAdd));
        break;
      case 'week':
        this.viewEndDateSignal.set(this.addDays(currentEnd, columnsToAdd * 7));
        break;
      case 'month':
        this.viewEndDateSignal.set(new Date(currentEnd.getFullYear(), currentEnd.getMonth() + columnsToAdd, 1));
        break;
    }

    return columnsToAdd;
  }

  /**
   * Get total number of columns based on start and end dates
   */
  getTotalColumns(): number {
    const start = this.viewStartDateSignal();
    const end = this.viewEndDateSignal();

    switch (this.timescaleSignal()) {
      case 'day':
        return this.daysBetween(start, end) + 1;
      case 'week':
        return Math.ceil(this.daysBetween(start, end) / 7) + 1;
      case 'month':
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    }
  }

  /**
   * Generate timeline columns based on current timescale and date range
   */
  generateColumns(): TimelineColumn[] {
    const columns: TimelineColumn[] = [];
    const startDate = new Date(this.viewStartDateSignal());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalColumns = this.getTotalColumns();

    for (let i = 0; i < totalColumns; i++) {
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
        // Calculate width based on actual days difference, converted to months
        const totalDays = this.daysBetween(start, end) + 1;
        const months = totalDays / 30; // Average days per month
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

  // Delegate to DateUtilsService for cleaner code
  private addDays(date: Date, days: number): Date {
    return this.dateUtils.addDays(date, days);
  }

  private daysBetween(start: Date, end: Date): number {
    return this.dateUtils.daysBetween(start, end);
  }

  private monthsBetween(start: Date, end: Date): number {
    return this.dateUtils.monthsBetween(start, end);
  }

  private getWeekStart(date: Date): Date {
    return this.dateUtils.getWeekStart(date);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return this.dateUtils.isSameDay(date1, date2);
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return this.dateUtils.isSameMonth(date1, date2);
  }

  private isCurrentWeek(weekStart: Date, today: Date): boolean {
    return this.dateUtils.isInWeek(today, weekStart);
  }

  private formatDayLabel(date: Date): string {
    return this.dateUtils.formatDayLabel(date);
  }

  private formatWeekLabel(date: Date): string {
    return this.dateUtils.formatWeekLabel(date);
  }

  private formatMonthLabel(date: Date): string {
    return this.dateUtils.formatMonthLabel(date);
  }

  formatDateToISO(date: Date): string {
    return this.dateUtils.dateToISO(date);
  }
}
