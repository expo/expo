export function addLines(content: string, find: string | RegExp, offset: number, toAdd: string[]) {
  const lines = content.split('\n');

  let lineIndex = lines.findIndex((line) => line.match(find));

  for (const newLine of toAdd) {
    if (!content.includes(newLine)) {
      lines.splice(lineIndex + offset, 0, newLine);
      lineIndex++;
    }
  }

  return lines.join('\n');
}

export function replaceLine(content: string, find: string | RegExp, replace: string) {
  const lines = content.split('\n');

  if (!content.includes(replace)) {
    const lineIndex = lines.findIndex((line) => line.match(find));
    lines.splice(lineIndex, 1, replace);
  }

  return lines.join('\n');
}
