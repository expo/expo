// Material3's DatePicker (and the native side's `toUtcDayMillis` bounds conversion) works in UTC
// days, while `value`, `minimumDate`, and `maximumDate` are local dates — matching
// `@react-native-community/datetimepicker`. These helpers convert between the two.

/**
 * Returns the ISO string of the UTC midnight of `value`'s local calendar day, so Material3 shows
 * the same day the user sees locally.
 */
export function localDateToUtcDayISOString(value: Date): string {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString();
}

/**
 * Converts the UTC-midnight day reported by Material3 back into a local date, keeping the time of
 * day from `timeOfDay`.
 */
export function utcDayToLocalDate(utcDay: Date, timeOfDay: Date): Date {
  const result = new Date(timeOfDay);
  result.setFullYear(utcDay.getUTCFullYear(), utcDay.getUTCMonth(), utcDay.getUTCDate());
  return result;
}
