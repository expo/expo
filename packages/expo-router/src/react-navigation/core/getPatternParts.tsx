export type PatternPart = {
  segment: string;
  param?: string;
  regex?: string;
  optional?: boolean;
};

/**
 * Parse a path into an array of parts with information about each segment.
 */
export function getPatternParts(path: string): PatternPart[] {
  const parts: PatternPart[] = [];

  let current: PatternPart = { segment: '' };

  let isRegex = false;
  let isParam = false;
  let regexInnerParens = 0;

  // One extra iteration to add the last character
  for (let i = 0; i <= path.length; i++) {
    const char = path[i];

    if (char != null) {
      current.segment += char;
    }

    if (char === ':') {
      // The segment must start with a colon if it's a param
      if (current.segment === ':') {
        isParam = true;
      } else if (!isRegex) {
        throw new Error(
          `Encountered ':' in the middle of a segment in path: ${path}`
        );
      }
    } else if (char === '(') {
      if (isParam) {
        if (isRegex) {
          // The '(' is part of the regex if we're already inside one
          regexInnerParens++;
        } else {
          isRegex = true;
        }
      } else {
        throw new Error(
          `Encountered '(' without preceding ':' in path: ${path}`
        );
      }
    } else if (char === ')') {
      if (isParam && isRegex) {
        if (regexInnerParens) {
          // The ')' is part of the regex if we're already inside one
          regexInnerParens--;
          current.regex += char;
        } else {
          isRegex = false;
          isParam = false;
        }
      } else {
        throw new Error(
          `Encountered ')' without preceding '(' in path: ${path}`
        );
      }
    } else if (char === '?') {
      if (current.param) {
        isParam = false;

        current.optional = true;
      } else {
        throw new Error(
          `Encountered '?' without preceding ':' in path: ${path}`
        );
      }
    } else if (char == null || (char === '/' && !isRegex)) {
      isParam = false;

      // Remove trailing slash from segment
      current.segment = current.segment.replace(/\/$/, '');

      if (current.segment === '') {
        continue;
      }

      if (current.param) {
        current.param = current.param.replace(/^:/, '');
      }

      if (current.regex) {
        current.regex = current.regex.replace(/^\(/, '').replace(/\)$/, '');
      }

      parts.push(current);

      if (char == null) {
        break;
      }

      current = { segment: '' };
    }

    if (isRegex) {
      current.regex = current.regex || '';
      current.regex += char;
    }

    if (isParam && !isRegex) {
      current.param = current.param || '';
      current.param += char;
    }
  }

  if (isRegex) {
    throw new Error(`Could not find closing ')' in path: ${path}`);
  }

  const params = parts.map((part) => part.param).filter(Boolean);

  for (const [index, param] of params.entries()) {
    if (params.indexOf(param) !== index) {
      throw new Error(`Duplicate param name '${param}' found in path: ${path}`);
    }
  }

  return parts;
}
