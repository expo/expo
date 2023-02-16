// From TypeScript: https://github.com/microsoft/TypeScript/blob/5b1897969769449217237aecbe364f823096c63e/src/compiler/core.ts
// License: https://github.com/microsoft/TypeScript/blob/214df64/LICENSE.txt

export interface Pattern {
  prefix: string;
  suffix: string;
}

const asterisk = 0x2a;

function hasZeroOrOneAsteriskCharacter(str: string): boolean {
  let seenAsterisk = false;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) === asterisk) {
      if (!seenAsterisk) {
        seenAsterisk = true;
      } else {
        return false;
      }
    }
  }
  return true;
}

function tryParsePattern(pattern: string): Pattern | undefined {
  // This should be verified outside of here and a proper error thrown.
  const indexOfStar = pattern.indexOf('*');
  return indexOfStar === -1
    ? undefined
    : {
        prefix: pattern.slice(0, indexOfStar),
        suffix: pattern.slice(indexOfStar + 1),
      };
}

function isPatternMatch({ prefix, suffix }: Pattern, candidate: string) {
  return (
    candidate.length >= prefix.length + suffix.length &&
    candidate.startsWith(prefix) &&
    candidate.endsWith(suffix)
  );
}

/**
 * Return the object corresponding to the best pattern to match `candidate`.
 *
 * @internal
 */
function findBestPatternMatch<T>(
  values: readonly T[],
  getPattern: (value: T) => Pattern,
  candidate: string
): T | undefined {
  let matchedValue: T | undefined;
  // use length of prefix as betterness criteria
  let longestMatchPrefixLength = -1;

  for (const v of values) {
    const pattern = getPattern(v);
    if (isPatternMatch(pattern, candidate) && pattern.prefix.length > longestMatchPrefixLength) {
      longestMatchPrefixLength = pattern.prefix.length;
      matchedValue = v;
    }
  }

  return matchedValue;
}

/**
 * patternStrings contains both pattern strings (containing "*") and regular strings.
 * Return an exact match if possible, or a pattern match, or undefined.
 * (These are verified by verifyCompilerOptions to have 0 or 1 "*" characters.)
 */
function matchPatternOrExact(
  patternStrings: readonly string[],
  candidate: string
): string | Pattern | undefined {
  const patterns: Pattern[] = [];
  for (const patternString of patternStrings) {
    if (!hasZeroOrOneAsteriskCharacter(patternString)) continue;
    const pattern = tryParsePattern(patternString);
    if (pattern) {
      patterns.push(pattern);
    } else if (patternString === candidate) {
      // pattern was matched as is - no need to search further
      return patternString;
    }
  }

  return findBestPatternMatch(patterns, (_) => _, candidate);
}

/**
 * Given that candidate matches pattern, returns the text matching the '*'.
 * E.g.: matchedText(tryParsePattern("foo*baz"), "foobarbaz") === "bar"
 */
function matchedText(pattern: Pattern, candidate: string): string {
  return candidate.substring(pattern.prefix.length, candidate.length - pattern.suffix.length);
}

function getStar(matchedPattern: string | Pattern, moduleName: string) {
  return typeof matchedPattern === 'string' ? undefined : matchedText(matchedPattern, moduleName);
}

export function matchTsConfigPathAlias(pathsKeys: string[], moduleName: string) {
  // If the module name does not match any of the patterns in `paths` we hand off resolving to webpack
  const matchedPattern = matchPatternOrExact(pathsKeys, moduleName);
  if (!matchedPattern) {
    return null;
  }

  return {
    star: getStar(matchedPattern, moduleName),
    text:
      typeof matchedPattern === 'string'
        ? matchedPattern
        : `${matchedPattern.prefix}*${matchedPattern.suffix}`,
  };
}
