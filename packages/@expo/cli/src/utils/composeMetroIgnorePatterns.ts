const NEVER_MATCHES = /(?!)/;

function isEscapedAt(source: string, dotIdx: number): boolean {
  let backslashes = 0;
  for (let i = dotIdx - 1; i >= 0 && source.charCodeAt(i) === 92; i--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
}

function stripUnanchoredDecoration(source: string): string {
  let s = source;

  if (s.startsWith('^.*?')) s = s.slice(4);
  else if (s.startsWith('^.*')) s = s.slice(3);
  else if (s.startsWith('^[\\s\\S]*?')) s = s.slice(9);
  else if (s.startsWith('^[\\s\\S]*')) s = s.slice(8);
  else if (s.startsWith('.*?')) s = s.slice(3);
  else if (s.startsWith('.*')) s = s.slice(2);
  else if (s.startsWith('[\\s\\S]*?')) s = s.slice(8);
  else if (s.startsWith('[\\s\\S]*')) s = s.slice(7);

  if (s.endsWith('.*?$') && !isEscapedAt(s, s.length - 4)) s = s.slice(0, -4);
  else if (s.endsWith('.*$') && !isEscapedAt(s, s.length - 3)) s = s.slice(0, -3);
  else if (s.endsWith('[\\s\\S]*?$')) s = s.slice(0, -9);
  else if (s.endsWith('[\\s\\S]*$')) s = s.slice(0, -8);
  else if (s.endsWith('.*?') && !isEscapedAt(s, s.length - 3)) s = s.slice(0, -3);
  else if (s.endsWith('.*') && !isEscapedAt(s, s.length - 2)) s = s.slice(0, -2);
  else if (s.endsWith('[\\s\\S]*?')) s = s.slice(0, -8);
  else if (s.endsWith('[\\s\\S]*')) s = s.slice(0, -7);

  if (s === '' || s === '^' || s === '$' || s === '^$') return source;
  return s;
}

function rankForOrdering(source: string): number {
  if (source.startsWith('^')) return 0;
  if (source.startsWith('.*') || source.startsWith('.*?') || source.startsWith('[\\s\\S]*')) {
    return 2;
  }
  return 1;
}

/**
 * Composes Metro `blockList` regexes into a single ignore pattern, normalizing
 * leading/trailing `.*` decoration so V8 can extract a literal prefilter from
 * each alternative.
 */
export function composeMetroIgnorePatterns(
  input: RegExp | readonly RegExp[] | null | undefined
): RegExp {
  if (!input) return NEVER_MATCHES;
  if (!Array.isArray(input)) {
    const regex = input as RegExp;
    return new RegExp(stripUnanchoredDecoration(regex.source), regex.flags);
  }

  const patterns = input as readonly RegExp[];
  if (patterns.length === 0) return NEVER_MATCHES;
  if (patterns.length === 1) {
    const regex = patterns[0]!;
    return new RegExp(stripUnanchoredDecoration(regex.source), regex.flags);
  }

  const flags = patterns[0]!.flags;
  for (let i = 1; i < patterns.length; i++) {
    if (patterns[i]!.flags !== flags) {
      throw new Error(
        'Cannot combine blockList patterns, because they have different flags:\n' +
          ` - Pattern 0: ${patterns[0]!.toString()}\n` +
          ` - Pattern ${i}: ${patterns[i]!.toString()}`
      );
    }
  }

  const sources = patterns
    .map((regex) => stripUnanchoredDecoration(regex.source))
    .sort((a, b) => rankForOrdering(a) - rankForOrdering(b))
    .map((s) => '(?:' + s + ')');
  return new RegExp(sources.join('|'), flags);
}
