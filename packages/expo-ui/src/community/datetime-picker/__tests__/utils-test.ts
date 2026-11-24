import { localDateToUtcDayISOString, utcDayToLocalDate } from '../utils';

// Material3's DatePicker works in UTC days while `value`, `minimumDate`, and `maximumDate` are
// local dates. These conversions only read local calendar fields, so the assertions hold in any
// timezone the test runs in (run with TZ=Europe/Istanbul to see the mismatch they guard against).

describe(localDateToUtcDayISOString, () => {
  it('maps a local date to the UTC midnight of the same calendar day', () => {
    expect(localDateToUtcDayISOString(new Date(2026, 9, 2))).toBe('2026-10-02T00:00:00.000Z');
    expect(localDateToUtcDayISOString(new Date(2026, 9, 2, 23, 59, 59))).toBe(
      '2026-10-02T00:00:00.000Z'
    );
  });
});

describe(utcDayToLocalDate, () => {
  it('maps a UTC day back to a local date, keeping the reference time of day', () => {
    const value = new Date(2026, 9, 2, 14, 30, 15);
    const picked = new Date('2026-10-05T00:00:00.000Z');
    const result = utcDayToLocalDate(picked, value);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(15);
  });

  it('round-trips the initial day and time', () => {
    const value = new Date(2026, 9, 2, 8, 0);
    const roundTripped = utcDayToLocalDate(new Date(localDateToUtcDayISOString(value)), value);
    expect(roundTripped.getTime()).toBe(value.getTime());
  });

  it('keeps the exact day across month and year boundaries', () => {
    const value = new Date(2026, 0, 31, 9, 15);
    const picked = new Date('2027-02-28T00:00:00.000Z');
    const result = utcDayToLocalDate(picked, value);
    expect([result.getFullYear(), result.getMonth(), result.getDate()]).toEqual([2027, 1, 28]);
  });
});
