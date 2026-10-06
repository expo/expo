/**
 * Returns the ISO string of the UTC midnight of `value`'s local calendar day, so Material3 shows
 * the same day the user sees locally.
 */
export declare function localDateToUtcDayISOString(value: Date): string;
/**
 * Converts the UTC-midnight day reported by Material3 back into a local date, keeping the time of
 * day from `timeOfDay`.
 */
export declare function utcDayToLocalDate(utcDay: Date, timeOfDay: Date): Date;
//# sourceMappingURL=utils.d.ts.map