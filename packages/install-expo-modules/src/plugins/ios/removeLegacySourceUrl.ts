const migrationError = (reason: string, action: string) =>
  new Error(
    `Cannot migrate sourceURL(for:) in AppDelegate.swift automatically: ${reason}. ${action} Then run install-expo-modules again.`
  );

function syntaxError(source: string, offset: number, reason: string): Error {
  const line = source.slice(0, offset).split('\n').length;
  return new Error(
    `Cannot parse AppDelegate.swift while migrating sourceURL(for:): ${reason} at line ${line}. Check the Swift syntax, then run install-expo-modules again.`
  );
}

export function removeLegacySourceUrl(contents: string): string {
  const code = maskSwiftNonCode(contents);
  const removals: { start: number; end: number }[] = [];
  const classes =
    /\bclass\s+\w+\s*:\s*(?:RCTDefaultReactNativeFactoryDelegate|ExpoReactNativeFactoryDelegate)\b[^{]*\{/g;

  for (const factory of code.matchAll(classes)) {
    const classStart = factory.index! + factory[0].length;
    const classEnd = findClosingBrace(code, classStart);
    const methods = /\bfunc\s+sourceURL\s*\(\s*for\b[^{}]*\{/g;
    const classBody = code.slice(classStart, classEnd);
    for (const method of classBody.matchAll(methods)) {
      // Only migrate methods directly on the factory delegate, not nested types or functions.
      const preceding = classBody.slice(0, method.index);
      const depth = [...preceding.matchAll(/[{}]/g)].reduce(
        (depth, brace) => depth + (brace[0] === '{' ? 1 : -1),
        0
      );
      if (depth !== 0 || !/\bRCTBridge\b/.test(method[0])) {
        continue;
      }

      const methodStart = classStart + method.index!;
      let start = code.lastIndexOf('\n', methodStart) + 1;
      const bodyStart = methodStart + method[0].length;
      const bodyEnd = findClosingBrace(code, bodyStart);
      const signature = method[0].match(
        /^func\s+sourceURL\s*\(\s*for\s+(\w+)\s*:\s*RCTBridge\s*\)\s*->\s*URL\?\s*\{$/
      );
      const hasAttribute =
        /@\w+(?:\([^@{}]*\))?\s*$/.test(code.slice(0, start)) ||
        code.slice(start, methodStart).includes('@');
      const prefix = contents.slice(start, methodStart);
      const hasLeadingModifier = /\b(?:public|internal|open|final|override)\s*$/.test(
        code.slice(classStart, start)
      );
      if (
        !signature ||
        hasLeadingModifier ||
        (!hasAttribute &&
          !/^[\t ]*(?:(?:public|internal|open|final)\s+)*override\s+(?:(?:public|internal|open|final)\s+)*$/.test(
            prefix
          ))
      ) {
        throw migrationError(
          'the method declaration is not recognized',
          'Review the declaration, preserve any custom bundle selection in bundleURL(), and remove sourceURL(for:) manually.'
        );
      }

      const body = code
        .slice(bodyStart, bodyEnd)
        .trim()
        .replace(/^return\s+/, '')
        .replace(/\s+/g, '')
        .replace(/;$/, '');
      const bundleCall = '(?:self\\.)?bundleURL\\(\\)';
      if (!new RegExp(`^(?:${signature[1]}\\.bundleURL\\?\\?)?${bundleCall}$`).test(body)) {
        throw migrationError(
          'the method has a custom implementation',
          'Move its bundle selection to bundleURL() and remove sourceURL(for:).'
        );
      }
      if (hasAttribute) {
        throw migrationError(
          'the forwarding method has attributes',
          'Remove the method together with its attributes.'
        );
      }
      if (!contents.slice(bodyEnd + 1, classEnd).trim()) {
        const blankLine = contents.slice(0, start).match(/\r?\n[\t ]*\r?\n$/);
        if (blankLine) start -= blankLine[0].replace(/^\r?\n/, '').length;
      }
      const trailingNewlines =
        contents.slice(bodyEnd + 1).match(/^[\t ]*\r?\n(?:[\t ]*\r?\n)?/)?.[0].length ?? 0;
      removals.push({ start, end: bodyEnd + 1 + trailingNewlines });
    }
  }

  const merged: typeof removals = [];
  for (const removal of removals.sort((a, b) => a.start - b.start)) {
    const previous = merged.at(-1);
    if (previous && removal.start <= previous.end) {
      previous.end = Math.max(previous.end, removal.end);
    } else {
      merged.push(removal);
    }
  }
  for (const { start, end } of merged.reverse()) {
    contents = contents.slice(0, start) + contents.slice(end);
  }

  const remainingCode = maskSwiftNonCode(contents);
  for (const method of remainingCode.matchAll(/\bfunc\s+sourceURL\s*\(\s*for\b[^{}]*\{/g)) {
    if (/\bRCTBridge\b/.test(method[0])) {
      const line = remainingCode.slice(0, method.index).split('\n').length;
      console.warn(
        `Unmigrated sourceURL(for:) method in AppDelegate.swift at line ${line}: its superclass could not be verified. If this is a React Native factory delegate, move any custom bundle selection to bundleURL() and remove sourceURL(for:) before building.`
      );
    }
  }
  return contents;
}

function findClosingBrace(code: string, start: number): number {
  let depth = 1;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}' && --depth === 0) return i;
  }
  throw syntaxError(code, start - 1, 'unmatched opening brace');
}

/** Preserve offsets and newlines while hiding comments and string contents from matching. */
function maskSwiftNonCode(source: string): string {
  const result = source.split('');
  for (let i = 0; i < source.length; i++) {
    const end = skipNonCode(i);
    if (end === i) continue;
    const isComment = source.startsWith('//', i) || source.startsWith('/*', i);
    for (let j = i; j < end; j++) {
      if (result[j] !== '\n' && result[j] !== '\r') result[j] = isComment ? ' ' : '_';
    }
    i = end - 1;
  }
  return result.join('');

  function skipNonCode(start: number): number {
    if (source.startsWith('//', start)) {
      const end = source.indexOf('\n', start);
      return end < 0 ? source.length : end;
    }
    if (source.startsWith('/*', start)) {
      let depth = 1;
      for (let i = start + 2; i < source.length; i++) {
        if (source.startsWith('/*', i)) {
          depth++;
          i++;
        } else if (source.startsWith('*/', i)) {
          if (--depth === 0) return i + 2;
          i++;
        }
      }
      throw syntaxError(source, start, 'unterminated block comment');
    }
    if (source[start] !== '"' && source[start] !== '#') return start;
    const literal = source.slice(start).match(/^(#*)("""|")/);
    if (!literal) return start;
    const delimiter = literal[2]! + literal[1]!;
    const escape = '\\' + literal[1]!;
    for (let i = start + literal[0].length; i < source.length; i++) {
      if (source.startsWith(delimiter, i)) return i + delimiter.length;
      if (source.startsWith(escape, i)) {
        i += escape.length;
        if (source[i] === '(') {
          let depth = 1;
          for (i++; i < source.length; i++) {
            const end = skipNonCode(i);
            if (end !== i) {
              i = end - 1;
            } else if (source[i] === '(') {
              depth++;
            } else if (source[i] === ')' && --depth === 0) {
              break;
            }
          }
        }
      }
    }
    throw syntaxError(source, start, 'unterminated string literal');
  }
}
