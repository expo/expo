/** Words that cannot name a parameter or variable, even though they may name a member. */
const RESERVED_WORDS = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

/**
 * A Swift identifier without the backticks that let a reserved word name a declaration
 * (`` `default` ``). The scanner reports names as written, and the backticks are not part of the name.
 */
export function stripBackticks(name: string): string {
  return name.length > 2 && name.startsWith('`') && name.endsWith('`') ? name.slice(1, -1) : name;
}

/** Whether `name` can appear unquoted as a TypeScript identifier (ASCII letters, digits, `_`, `$`). */
export function isIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

/** A class or type member name: as is when it is an identifier, quoted as a string literal otherwise. */
export function memberName(name: string): string {
  return isIdentifier(name) ? name : JSON.stringify(name);
}

/**
 * A parameter name that TypeScript accepts. A reserved word gets a trailing underscore, and a name
 * that is not an identifier at all falls back to a positional name.
 */
export function parameterName(name: string, index: number): string {
  if (RESERVED_WORDS.has(name)) {
    return `${name}_`;
  }
  return isIdentifier(name) ? name : `arg${index}`;
}
