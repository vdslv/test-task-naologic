import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = '.';

  parse(value: string): NgbDateStruct | null {
    if (value) {
      const parts = value.split(this.DELIMITER);
      if (parts.length === 3) {
        return {
          month: parseInt(parts[0], 10),
          day: parseInt(parts[1], 10),
          year: parseInt(parts[2], 10)
        };
      }
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    if (date) {
      const month = date.month.toString().padStart(2, '0');
      const day = date.day.toString().padStart(2, '0');
      return `${month}${this.DELIMITER}${day}${this.DELIMITER}${date.year}`;
    }
    return '';
  }
}
