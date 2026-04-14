export const ALL_FEATURES = [
  'Constant',
  'Function',
  'AsyncFunction',
  'Event',
  'View',
  'ViewEvent',
  'SharedObject',
] as const;

export type Feature = (typeof ALL_FEATURES)[number];

/**
 * Validates, deduplicates, and applies ViewEvent→View auto-include.
 */
export function resolveFeatures(selected: string[], fullExample = false): Feature[] {
  if (fullExample) {
    return [...ALL_FEATURES];
  }
  const valid = selected.filter((f): f is Feature =>
    (ALL_FEATURES as readonly string[]).includes(f)
  );
  if (valid.includes('ViewEvent') && !valid.includes('View')) {
    valid.unshift('View');
  }

  return [...new Set(valid)] as Feature[];
}
