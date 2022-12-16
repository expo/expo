/**
 * Find lines matched by startRegex and endRegexp and remove all the
 * lines between them. Note, it will remove entire line matched by startRegex
 * and endRegexp even if pattern does not match entire line
 *
 * This function supports removing multiple sections in one file and
 * handles correctly nested ones
 */
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
