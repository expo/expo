// The opening delimiter of a Swift string literal, with the `#` of a raw string. Sticky, to match at a position.
const stringStartRegex = /(#*)("""|")/y;
// The opening delimiter of an extended regex literal, `#/.../#`.
const extendedRegexStartRegex = /(#+)\//y;
// The characters after which a `/` starts a regex literal instead of a division.
const regexLiteralPrecedingCharacters = new Set([
  '(',
  '[',
  '{',
  ',',
  ':',
  ';',
  '=',
  '!',
  '&',
  '|',
  '^',
  '~',
  '?',
]);

/**
 * Returns the Swift source without its comments, and with each string and regex literal replaced with `""`, so that
 * a search for an attribute doesn't match a mention in a comment or a literal. Handles nested block comments,
 * multiline and raw strings, interpolations with their own strings, and regex literals. A `/` is a regex literal
 * when it follows an operator, a bracket or a keyword such as `return`, isn't followed by a space, and the literal
 * ends on the same line.
 */
export function stripSwiftCommentsAndStrings(source: string): string {
  let output = '';
  let i = 0;

  function matchAt(regex: RegExp): RegExpExecArray | null {
    regex.lastIndex = i;
    return regex.exec(source);
  }

  // Reads code until the end of the source, or until the `)` that closes an interpolation, which isn't consumed.
  // Only code outside interpolations goes to the output.
  function readCode(inInterpolation: boolean) {
    let depth = 0;
    while (i < source.length) {
      if (source.startsWith('//', i)) {
        const end = source.indexOf('\n', i);
        i = end === -1 ? source.length : end;
        continue;
      }
      if (source.startsWith('/*', i)) {
        skipBlockComment();
        if (!inInterpolation) {
          output += ' ';
        }
        continue;
      }
      const stringStart = source[i] === '"' || source[i] === '#' ? matchAt(stringStartRegex) : null;
      if (stringStart) {
        i += stringStart[0].length;
        skipString(stringStart[1] ?? '', stringStart[2] === '"""');
        if (!inInterpolation) {
          output += '""';
        }
        continue;
      }
      const extendedRegexStart = source[i] === '#' ? matchAt(extendedRegexStartRegex) : null;
      if (extendedRegexStart) {
        const end = source.indexOf('/' + extendedRegexStart[1], i + extendedRegexStart[0].length);
        i = end === -1 ? source.length : end + extendedRegexStart[0].length;
        if (!inInterpolation) {
          output += '""';
        }
        continue;
      }
      if (source[i] === '/') {
        const end = findRegexLiteralEnd();
        if (end !== -1) {
          i = end;
          if (!inInterpolation) {
            output += '""';
          }
          continue;
        }
      }
      if (inInterpolation) {
        if (source[i] === '(') {
          depth++;
        } else if (source[i] === ')') {
          if (depth === 0) {
            return;
          }
          depth--;
        }
      } else {
        output += source[i];
      }
      i++;
    }
  }

  function skipBlockComment() {
    let depth = 0;
    while (i < source.length) {
      if (source.startsWith('/*', i)) {
        depth++;
        i += 2;
      } else if (source.startsWith('*/', i)) {
        depth--;
        i += 2;
        if (depth === 0) {
          return;
        }
      } else {
        i++;
      }
    }
  }

  // Skips a string after its opening delimiter. A string that isn't multiline ends at the end of its line at the
  // latest, so an unterminated string can't hide the rest of the file.
  function skipString(hashes: string, isMultiline: boolean) {
    const closing = (isMultiline ? '"""' : '"') + hashes;
    const escape = '\\' + hashes;
    while (i < source.length) {
      if (source.startsWith(closing, i)) {
        i += closing.length;
        return;
      }
      if (source.startsWith(escape, i)) {
        i += escape.length;
        if (source[i] === '(') {
          i++;
          readCode(true);
        }
        i++;
        continue;
      }
      if (!isMultiline && source[i] === '\n') {
        return;
      }
      i++;
    }
  }

  // Returns the index after a regex literal that starts at `i`, or -1 when the `/` isn't one.
  function findRegexLiteralEnd(): number {
    const next = source[i + 1];
    if (
      next === undefined ||
      next === ' ' ||
      next === '\t' ||
      next === '\n' ||
      next === '/' ||
      next === '*'
    ) {
      return -1;
    }
    let k = i - 1;
    while (k >= 0 && (source[k] === ' ' || source[k] === '\t')) {
      k--;
    }
    const isRegexPosition =
      k < 0 ||
      source[k] === '\n' ||
      regexLiteralPrecedingCharacters.has(source[k]!) ||
      /(^|[^\w])return$/.test(source.slice(Math.max(0, k - 6), k + 1));
    if (!isRegexPosition) {
      return -1;
    }
    for (let j = i + 1; j < source.length && source[j] !== '\n'; j++) {
      if (source[j] === '\\') {
        j++;
      } else if (source[j] === '/') {
        return j + 1;
      }
    }
    return -1;
  }

  readCode(false);
  return output;
}
