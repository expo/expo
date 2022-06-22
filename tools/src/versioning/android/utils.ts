export function deleteLinesBetweenTags(
  startRegex: RegExp | string,
  endRegex: RegExp | string,
  fileContent: string
): string {
  const lines = fileContent.split(/\r?\n/);
  let insideTags = 0;
  const filteredLines = lines.filter((line) => {
    if (line.match(startRegex)) {
      insideTags += 1;
    }

    const shouldDelete = insideTags > 0;

    if (line.match(endRegex)) {
      insideTags -= 1;
    }
    return !shouldDelete;
  });
  return filteredLines.join('\n');
}
