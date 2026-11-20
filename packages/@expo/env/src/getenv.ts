/** Read an environment variable at call time, applying a fallback only when it is absent. */
export function string(name: string, fallback?: string | null): string {
  const value = process.env[name];
  if (value != null) return value;
  if (fallback != null) return '' + fallback;
  throw new Error(
    `Environment variable $${name} is not set and no fallback was provided. Set $${name} or provide a fallback.`
  );
}

/** Read a strict decimal integer. */
export function int(name: string, fallback?: number | null): number {
  const value = string(name, fallback == null ? undefined : '' + fallback);
  if (!/^-?\d+$/.test(value)) {
    throw new Error(
      `Invalid value for environment variable $${name}: ${JSON.stringify(value)}. Set it to a decimal integer such as "42" or "-42".`
    );
  }
  return +value;
}

/** Read a case-insensitive true/false value or an exact 1/0 value. */
export function boolish(name: string, fallback?: boolean | null): boolean {
  const value = string(name, fallback == null ? undefined : '' + fallback);
  const lower = value.toLowerCase();
  if (lower === 'true' || value === '1') return true;
  if (lower === 'false' || value === '0') return false;
  throw new Error(
    `Invalid value for environment variable $${name}: ${JSON.stringify(value)}. Set it to "true", "false", "1", or "0" (case-insensitive).`
  );
}
