import { Injectable } from '@angular/core';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  // =============================================================================
  // DATE CONVERSION
  // =============================================================================

  /**
   * Convert NgbDateStruct to ISO string (YYYY-MM-DD)
   */
  ngbDateToISO(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert ISO string (YYYY-MM-DD) to NgbDateStruct
   */
  isoToNgbDate(isoString: string): NgbDateStruct | null {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  /**
   * Convert Date to ISO string (YYYY-MM-DD)
   */
  dateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert Date to NgbDateStruct
   */
  dateToNgbDate(date: Date): NgbDateStruct {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  /**
   * Convert NgbDateStruct to Date
   */
  ngbDateToDate(date: NgbDateStruct): Date {
    return new Date(date.year, date.month - 1, date.day);
  }

  // =============================================================================
  // DATE FORMATTING
  // =============================================================================

  /**
   * Format date for display (MM.DD.YYYY)
   */
  formatForDisplay(date: Date | string | NgbDateStruct): string {
    let d: Date;
    
    if (typeof date === 'string') {
      d = new Date(date);
    } else if ('year' in date) {
      d = this.ngbDateToDate(date);
    } else {
      d = date;
    }

    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}.${day}.${year}`;
  }

  /**
   * Format date for day label (e.g., "Jan 15")
   */
  formatDayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  /**
   * Format date for week label (e.g., "Jan 15 - Jan 21")
   */
  formatWeekLabel(startDate: Date): string {
    const endDate = this.addDays(startDate, 6);
    const startStr = this.formatDayLabel(startDate);
    const endStr = this.formatDayLabel(endDate);
    return `${startStr} - ${endStr}`;
  }

  /**
   * Format date for month label (e.g., "Jan 2026")
   */
  formatMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // =============================================================================
  // DATE ARITHMETIC
  // =============================================================================

  /**
   * Add days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Calculate days between two dates
   */
  daysBetween(start: Date, end: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end.getTime() - start.getTime()) / msPerDay);
  }

  /**
   * Calculate months between two dates (fractional)
   */
  monthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth()) + 
           (end.getDate() - 1) / 30;
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    return result;
  }

  // =============================================================================
  // DATE COMPARISON
  // =============================================================================

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Check if two dates are in the same month
   */
  isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  /**
   * Check if a date falls within a week
   */
  isInWeek(date: Date, weekStart: Date): boolean {
    const weekEnd = this.addDays(weekStart, 6);
    return date >= weekStart && date <= weekEnd;
  }

  /**
   * Normalize date to midnight (removes time component)
   */
  normalizeDate(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get today's date normalized to midnight
   */
  today(): Date {
    return this.normalizeDate(new Date());
  }
}
