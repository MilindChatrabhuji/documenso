import { describe, expect, it } from 'vitest';
import { convertToLocalSystemFormat, isDateOnlyFormat } from './date-formats';

describe('date-formats', () => {
  describe('isDateOnlyFormat', () => {
    it('correctly identifies date-only formats', () => {
      expect(isDateOnlyFormat('yyyy-MM-dd')).toBe(true);
      expect(isDateOnlyFormat('dd/MM/yyyy')).toBe(true);
      expect(isDateOnlyFormat('MM/dd/yyyy')).toBe(true);
      expect(isDateOnlyFormat('dd-MM-yyyy')).toBe(true);
      expect(isDateOnlyFormat('dd.MM.yyyy')).toBe(true);
      expect(isDateOnlyFormat('MMMM dd, yyyy')).toBe(true);
      expect(isDateOnlyFormat('EEEE, MMMM dd, yyyy')).toBe(true);
    });

    it('correctly identifies datetime formats', () => {
      expect(isDateOnlyFormat('yyyy-MM-dd hh:mm a')).toBe(false);
      expect(isDateOnlyFormat('yyyy-MM-dd HH:mm')).toBe(false);
      expect(isDateOnlyFormat('dd/MM/yyyy HH:mm')).toBe(false);
      expect(isDateOnlyFormat('yyyy-MM-dd HH:mm:ss')).toBe(false);
      expect(isDateOnlyFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX")).toBe(false);
    });
  });

  describe('convertToLocalSystemFormat', () => {
    it('preserves the calendar date for date-only formats regardless of viewer timezone (#3463)', () => {
      // Date stored at UTC midnight
      const storedDate = '10/19/2026';
      const dateFormat = 'MM/dd/yyyy';
      const documentTimeZone = 'Etc/UTC';

      const result = convertToLocalSystemFormat(storedDate, dateFormat, documentTimeZone);

      // Should remain 10/19/2026 and NOT shift to 10/18/2026 in western timezones
      expect(result).toBe('10/19/2026');
    });

    it('preserves date-only ISO format yyyy-MM-dd', () => {
      const storedDate = '2026-10-19';
      const dateFormat = 'yyyy-MM-dd';
      const documentTimeZone = 'Etc/UTC';

      const result = convertToLocalSystemFormat(storedDate, dateFormat, documentTimeZone);
      expect(result).toBe('2026-10-19');
    });

    it('returns "Invalid date" for unparseable input', () => {
      expect(convertToLocalSystemFormat('not-a-date', 'yyyy-MM-dd')).toBe('Invalid date');
    });
  });
});
