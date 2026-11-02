const migrationError = () =>
  new Error(
    'Cannot migrate sourceURL(for:) in AppDelegate.swift automatically. SDK 58 and later use bundleURL() on the React Native factory delegate. Move custom bundle selection to bundleURL(), remove sourceURL(for:), and run install-expo-modules again.'
  );

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
      const start = code.lastIndexOf('\n', methodStart) + 1;
      const bodyStart = methodStart + method[0].length;
      const bodyEnd = findClosingBrace(code, bodyStart);
      const declaration = code.slice(start, bodyStart);
      const signature = declaration.match(
        /^\s*(?:(?:public|internal|open|final)\s+)*override\s+(?:(?:public|internal|open|final)\s+)*func\s+sourceURL\s*\(\s*for\s+(\w+)\s*:\s*RCTBridge\s*\)\s*->\s*URL\?\s*\{$/
      );
      const hasAttribute = /@\w+(?:\([^@{}]*\))?\s*$/.test(code.slice(0, start));
      const prefix = contents.slice(start, methodStart);
      if (
        !signature ||
        hasAttribute ||
        !/^[\t ]*(?:(?:public|internal|open|final|override)\s+)+$/.test(prefix)
      ) {
        throw migrationError();
      }

      const body = code
        .slice(bodyStart, bodyEnd)
        .trim()
        .replace(/^return\s+/, '')
        .replace(/\s+/g, '')
        .replace(/;$/, '');
      const bundleCall = '(?:self\\.)?bundleURL\\(\\)';
      if (!new RegExp(`^(?:${signature[1]}\\.bundleURL\\?\\?)?${bundleCall}$`).test(body)) {
        throw migrationError();
      }
      const trailingNewlines =
        contents.slice(bodyEnd + 1).match(/^[\t ]*\r?\n(?:[\t ]*\r?\n)?/)?.[0].length ?? 0;
      removals.push({ start, end: bodyEnd + 1 + trailingNewlines });
    }
  }

  for (const { start, end } of removals.sort((a, b) => b.start - a.start)) {
    contents = contents.slice(0, start) + contents.slice(end);
  }
  return contents;
}

function findClosingBrace(code: string, start: number): number {
  let depth = 1;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}' && --depth === 0) return i;
  }
  throw migrationError();
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
      throw migrationError();
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
    throw migrationError();
  }
}
