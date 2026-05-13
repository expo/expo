/**
 * Ensures a text string ends with a period.
 */
export function ensureTrailingPeriod(text: string): string {
  if (!text) {
    return '';
  }
  return text.endsWith('.') ? text : `${text}.`;
}
