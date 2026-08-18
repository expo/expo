export type DefaultEntry = { field: string; value: string };

/**
 * Builds a warning message listing all fields that were not explicitly provided —
 * whether they fell back to a hardcoded default or were auto-derived from the environment.
 * Returns null if every field was explicitly provided.
 */
export function buildDefaultsWarning(defaults: DefaultEntry[]): string | null {
  if (defaults.length === 0) return null;

  const maxLen = Math.max(...defaults.map((d) => d.field.length));

  const lines = defaults.map(({ field, value }) => {
    const displayValue = value === '' ? '(empty)' : value;
    const dots = '.'.repeat(maxLen - field.length + 4);
    return `  ${field} ${dots} ${displayValue}`;
  });

  return [
    'Warning: The following fields were not explicitly provided — using defaults or values derived from your environment:',
    ...lines,
    'To skip this warning, provide all values explicitly via CLI flags.',
  ].join('\n');
}
