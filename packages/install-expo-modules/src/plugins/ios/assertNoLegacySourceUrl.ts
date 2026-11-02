export function assertNoLegacySourceUrl(contents: string): void {
  const method = maskSwiftNonCode(contents).match(
    /\bfunc\s+sourceURL\s*\(\s*for\s+\w+\s*:\s*(?:React\.)?RCTBridge\b/
  );
  if (!method) return;

  const line = contents.slice(0, method.index).split('\n').length;
  throw new Error(
    `Cannot install Expo modules because AppDelegate.swift contains the legacy sourceURL(for:) method at line ${line}. SDK 59 and later require bundleURL() instead. Remove sourceURL(for:) and its attributes. If it contains custom bundle selection, move that logic to bundleURL() first. Then run install-expo-modules again.`
  );
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
      return source.length;
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
    return source.length;
  }
}
