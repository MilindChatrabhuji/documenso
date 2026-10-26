import { Settings } from 'luxon';
import { afterEach, describe, expect, it } from 'vitest';

import {
  convertToLocalSystemFormat,
  DEFAULT_DOCUMENT_DATE_FORMAT,
  isDateOnlyFormat,
  toLuxonDateFormat,
} from './date-formats';

describe('date-formats', () => {
  const originalZone = Settings.defaultZone;

  afterEach(() => {
    Settings.defaultZone = originalZone;
  });

  describe('toLuxonDateFormat', () => {
    it('converts ISO 8601 XXX token to Luxon ZZ', () => {
      expect(toLuxonDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX")).toBe("yyyy-MM-dd'T'HH:mm:ss.SSSZZ");
    });

    it('leaves standard formats unchanged', () => {
      expect(toLuxonDateFormat('yyyy-MM-dd')).toBe('yyyy-MM-dd');
      expect(toLuxonDateFormat('MM/dd/yyyy')).toBe('MM/dd/yyyy');
      expect(toLuxonDateFormat('yyyy-MM-dd hh:mm a')).toBe('yyyy-MM-dd hh:mm a');
    });
  });

  describe('isDateOnlyFormat', () => {
    it('identifies date-only formats', () => {
      expect(isDateOnlyFormat('yyyy-MM-dd')).toBe(true);
      expect(isDateOnlyFormat('dd/MM/yyyy')).toBe(true);
      expect(isDateOnlyFormat('dd-MM-yyyy')).toBe(true);
      expect(isDateOnlyFormat('MM/dd/yyyy')).toBe(true);
      expect(isDateOnlyFormat('yy-MM-dd')).toBe(true);
      expect(isDateOnlyFormat('MMMM dd, yyyy')).toBe(true);
      expect(isDateOnlyFormat('EEEE, MMMM dd, yyyy')).toBe(true);
      expect(isDateOnlyFormat('dd.MM.yyyy')).toBe(true);
    });

    it('identifies date-and-time formats', () => {
      expect(isDateOnlyFormat(DEFAULT_DOCUMENT_DATE_FORMAT)).toBe(false);
      expect(isDateOnlyFormat('yyyy-MM-dd HH:mm')).toBe(false);
      expect(isDateOnlyFormat('dd/MM/yyyy hh:mm a')).toBe(false);
      expect(isDateOnlyFormat('dd/MM/yyyy HH:mm')).toBe(false);
      expect(isDateOnlyFormat('yyyy-MM-dd HH:mm:ss')).toBe(false);
      expect(isDateOnlyFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX")).toBe(false);
    });
  });

  describe('convertToLocalSystemFormat', () => {
    it('preserves calendar date for date-only formats regardless of viewer timezone', () => {
      // Simulate viewer in America/Chicago (UTC-5/UTC-6)
      Settings.defaultZone = 'America/Chicago';

      // Field signed in UTC on 10/20/2026
      const resultChicago = convertToLocalSystemFormat('10/20/2026', 'MM/dd/yyyy', 'Etc/UTC');
      expect(resultChicago).toBe('10/20/2026');

      // Simulate viewer in Pacific/Honolulu (UTC-10)
      Settings.defaultZone = 'Pacific/Honolulu';
      const resultHonolulu = convertToLocalSystemFormat('10/20/2026', 'MM/dd/yyyy', 'Etc/UTC');
      expect(resultHonolulu).toBe('10/20/2026');

      // Simulate viewer in Asia/Tokyo (UTC+9)
      Settings.defaultZone = 'Asia/Tokyo';
      const resultTokyo = convertToLocalSystemFormat('10/20/2026', 'MM/dd/yyyy', 'Etc/UTC');
      expect(resultTokyo).toBe('10/20/2026');

      // Verify for ISO yyyy-MM-dd date-only
      Settings.defaultZone = 'America/Chicago';
      expect(convertToLocalSystemFormat('2026-10-20', 'yyyy-MM-dd', 'Etc/UTC')).toBe('2026-10-20');
    });

    it('accurately converts date-time formats to viewer local timezone', () => {
      // Document signed at 14:00 (2:00 PM) UTC
      Settings.defaultZone = 'America/New_York'; // UTC-4 in October (EDT)

      const result = convertToLocalSystemFormat('2026-10-20 02:00 PM', 'yyyy-MM-dd hh:mm a', 'Etc/UTC');
      // 14:00 UTC is 10:00 AM EDT
      expect(result).toBe('2026-10-20 10:00 AM');
    });

    it('handles ISO 8601 format with timezone offset', () => {
      Settings.defaultZone = 'UTC';

      const isoWithOffset = '2026-03-05T10:20:30.123+05:30';
      const result = convertToLocalSystemFormat(isoWithOffset, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", 'Asia/Kolkata');

      // In UTC, 10:20:30.123 +05:30 is 04:50:30.123 +00:00
      expect(result).toBe('2026-03-05T04:50:30.123+00:00');
    });

    it('handles legacy ISO 8601 customText containing literal XXX', () => {
      Settings.defaultZone = 'UTC';

      const legacyIso = '2026-03-05T10:20:30.123XXX';
      const result = convertToLocalSystemFormat(legacyIso, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", 'UTC');

      expect(result).toBe('2026-03-05T10:20:30.123+00:00');
    });

    it('returns "Invalid date" for unparseable input', () => {
      expect(convertToLocalSystemFormat('not-a-date', 'MM/dd/yyyy', 'Etc/UTC')).toBe('Invalid date');
    });
  });
});
