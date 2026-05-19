import { matchGroupName } from 'expo-router/internal/routing';

/**
 * Builds a function to generate a minimal routeKey using only a-z and minimal
 * number of characters.
 */
function buildGetSafeRouteKey() {
  let currentCharCode = 96; // Starting one before 'a' to make the increment logic simpler
  let currentLength = 1;

  return () => {
    let result = '';
    let incrementNext = true;

    // Iterate from right to left to build the key
    for (let i = 0; i < currentLength; i++) {
      if (incrementNext) {
        currentCharCode++;
        if (currentCharCode > 122) {
          currentCharCode = 97; // Reset to 'a'
          incrementNext = true; // Continue to increment the next character
        } else {
          incrementNext = false;
        }
      }
      result = String.fromCharCode(currentCharCode) + result;
    }

    // If all characters are 'z', increase the length of the key
    if (incrementNext) {
      currentLength++;
      currentCharCode = 96; // This will make the next key start with 'a'
    }

    return result;
  };
}

function removeTrailingSlash(route: string): string {
  return route.replace(/\/$/, '') || '/';
}

export function getNamedParametrizedRoute(route: string): {
  namedParameterizedRoute: string;
  routeKeys: Record<string, string>;
  /** Cleaned route-key names whose captures should be split into arrays (wildcards). */
  wildcardKeys: Set<string>;
} {
  const segments = removeTrailingSlash(route).slice(1).split('/');
  const getSafeRouteKey = buildGetSafeRouteKey();
  const routeKeys: Record<string, string> = {};
  const wildcardKeys = new Set<string>();
  const namedParameterizedRoute = segments
    .map((segment, index) => {
      if (segment === '+not-found' && index === segments.length - 1) {
        segment = '[...not-found]';
      }
      if (/^\[.*\]$/.test(segment)) {
        const { name, optional, repeat } = parseParameter(segment);
        // replace any non-word characters since they can break
        // the named regex
        let cleanedKey = name.replace(/\W/g, '');
        let invalidKey = false;

        // check if the key is still invalid and fallback to using a known
        // safe key
        if (cleanedKey.length === 0 || cleanedKey.length > 30) {
          invalidKey = true;
        }
        if (!isNaN(parseInt(cleanedKey.slice(0, 1), 10))) {
          invalidKey = true;
        }

        // Prevent duplicates after sanitizing the key
        if (cleanedKey in routeKeys) {
          invalidKey = true;
        }

        if (invalidKey) {
          cleanedKey = getSafeRouteKey();
        }

        routeKeys[cleanedKey] = name;
        if (repeat) wildcardKeys.add(cleanedKey);
        return repeat
          ? optional
            ? `(?:/(?<${cleanedKey}>.+?))?`
            : `/(?<${cleanedKey}>.+?)`
          : `/(?<${cleanedKey}>[^/]+?)`;
      } else if (/^\(.*\)$/.test(segment)) {
        const groupName = matchGroupName(segment)!
          .split(',')
          .map((group) => group.trim())
          .filter(Boolean);
        if (groupName.length > 1) {
          const optionalSegment = `\\((?:${groupName.map(escapeStringRegexp).join('|')})\\)`;
          // Make section optional
          return `(?:/${optionalSegment})?`;
        } else {
          // Use simpler regex for single groups
          return `(?:/${escapeStringRegexp(segment)})?`;
        }
      } else {
        return `/${escapeStringRegexp(segment)}`;
      }
    })
    .join('');
  return { namedParameterizedRoute, routeKeys, wildcardKeys };
}

// regexp is based on https://github.com/sindresorhus/escape-string-regexp
const reHasRegExp = /[|\\{}()[\]^$+*?.-]/;
const reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g;

function escapeStringRegexp(str: string) {
  // see also: https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/escapeRegExp.js#L23
  if (reHasRegExp.test(str)) {
    return str.replace(reReplaceRegExp, '\\$&');
  }
  return str;
}

export function parseParameter(param: string) {
  let repeat = false;
  let optional = false;
  let name = param;

  if (/^\[.*\]$/.test(name)) {
    optional = true;
    name = name.slice(1, -1);
  }

  if (/^\.\.\./.test(name)) {
    repeat = true;
    name = name.slice(3);
  }

  return { name, repeat, optional };
}
