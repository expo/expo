// runtime polyfills
import 'core-js/es/string/match-all';

/**
 * @returns [`true`, modifiedContent: string] if replacement is successful, [`false`, originalContent] otherwise.
 */
export function replace(
  content: string,
  { replaceContent, replacePattern }: { replaceContent: string; replacePattern: string | RegExp }
): [boolean, string] {
  const replacePatternOccurrence = content.search(replacePattern);
  if (replacePatternOccurrence !== -1) {
    return [true, content.replace(replacePattern, replaceContent)];
  }
  return [false, content];
}

/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns [`true`, modifiedContent: string] if insertion is successful, [`false`, originalContent] otherwise.
 */
export function insert(
  content: string,
  { insertContent, insertPattern }: { insertContent: string; insertPattern: RegExp | string },
  insertBeforeLastOccurrence: boolean = false
): [boolean, string] {
  if (insertBeforeLastOccurrence) {
    return insertBeforeLastOccurrenceFun(content, { insertContent, insertPattern });
  }
  const insertPatternOccurrence = content.search(insertPattern);
  if (insertPatternOccurrence !== -1) {
    return [
      true,
      `${content.slice(0, insertPatternOccurrence)}${insertContent}${content.slice(
        insertPatternOccurrence
      )}`,
    ];
  }
  return [false, content];
}

/**
 * Finds last occurrence of provided pattern and inserts content just before it.
 *@returns [`true`, modifiedContent: string] if insertion is successful, [`false`, originalContent] otherwise.
 */
function insertBeforeLastOccurrenceFun(
  content: string,
  { insertContent, insertPattern }: { insertContent: string; insertPattern: RegExp | string }
): [boolean, string] {
  const results = [...content.matchAll(new RegExp(insertPattern, 'gm'))];
  const patternLastOccurrence = results[results.length - 1];
  if (!patternLastOccurrence) {
    return [false, content];
  }
  return [
    true,
    `${content.slice(0, patternLastOccurrence.index)}${insertContent}${content.slice(
      patternLastOccurrence.index
    )}`,
  ];
}
