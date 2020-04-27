// runtime polyfills
import 'core-js/es/string/match-all';

import fs from 'fs-extra';
import path from 'path';

export const COMMENTS = {
  wrapXML: (comment: string) => `<!-- ${comment} -->`,
  wrapJavaKotlin: (comment: string) => `// ${comment}`,

  LINE: `This line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually`,
  FILE_TOP: `\n    This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand\n`,
  FILE_TOP_NO_MODIFY: `\n    This file was created by 'expo-splash-screen' command and it's discouraged to modify it manually\n`,
  ANDROID_MANIFEST: `This Activity's 'android:theme' attribute is handled by 'expo-splash-screen' command and it's discouraged to modify it manually`,
};

/**
 * Modifies file's content if either `replacePattern` or `insertPattern` matches.
 * If `replacePattern` matches, `replaceContent` is used, otherwise if `insertPattern` matches, `insertContent` is used.
 * `insertBeforeLastOccurrence` - flag that indicates whether to insert before first or last occurrence.
 * @returns object describing which operation is successful.
 */
export async function replaceOrInsertInFile(
  filePath: string,
  {
    replaceContent,
    replacePattern,
    insertContent,
    insertPattern,
    insertBeforeLastOccurrence,
  }: {
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
    insertBeforeLastOccurrence?: boolean;
  }
): Promise<{ replaced: boolean; inserted: boolean }> {
  const insertFunction = insertBeforeLastOccurrence
    ? insertToFileBeforeLastOccurrence
    : insertToFile;
  const replaced = await replaceInFile(filePath, { replaceContent, replacePattern });
  const inserted = !replaced && (await insertFunction(filePath, { insertContent, insertPattern }));
  return { replaced, inserted };
}

/**
 * Tries to do following actions:
 * - when file doesn't exist or is empty - create it with given fileContent,
 * - when file does exist and contains provided replacePattern - replace replacePattern with replaceContent,
 * - when file does exist and doesn't contain provided replacePattern - insert given insertContent before first match of insertPattern,
 * - when insertPattern does not occur in the file - append insertContent to the end of the file.
 * @returns object describing which operation is successful.
 */
export async function writeOrReplaceOrInsertInFile(
  filePath: string,
  {
    fileContent,
    replaceContent,
    replacePattern,
    insertContent,
    insertPattern,
  }: {
    fileContent: string;
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
  }
): Promise<{ created?: boolean; replaced?: boolean; inserted?: boolean }> {
  if (!(await fs.pathExists(filePath)) || !/\S/m.test(await fs.readFile(filePath, 'utf8'))) {
    await writeToFile(filePath, fileContent);
    return { created: true };
  }

  const { replaced, inserted } = await replaceOrInsertInFile(filePath, {
    replaceContent,
    replacePattern,
    insertContent,
    insertPattern,
  });
  if (replaced || inserted) {
    return { replaced, inserted };
  }

  const originalFileContent = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, `${originalFileContent}${insertPattern}`);
  return { inserted: true };
}

/**
 * Overrides or creates file (with possibly missing directories) with given content.
 */
export async function writeToFile(filePath: string, fileContent: string) {
  const fileDirnamePath = path.dirname(filePath);
  if (!(await fs.pathExists(fileDirnamePath))) {
    await fs.mkdirp(fileDirnamePath);
  }
  return await fs.writeFile(filePath, fileContent);
}

/**
 * @returns `true` if replacement is successful, `false` otherwise.
 */
export async function replaceInFile(
  filePath: string,
  { replaceContent, replacePattern }: { replaceContent: string; replacePattern: string | RegExp }
) {
  const originalFileContent = await fs.readFile(filePath, 'utf8');
  const replacePatternOccurrence = originalFileContent.search(replacePattern);
  if (replacePatternOccurrence !== -1) {
    await fs.writeFile(filePath, originalFileContent.replace(replacePattern, replaceContent));
    return true;
  }
  return false;
}

/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns `true` if insertion is successful, `false` otherwise.
 */
export async function insertToFile(
  filePath: string,
  { insertContent, insertPattern }: { insertContent: string; insertPattern: RegExp | string }
) {
  const originalFileContent = await fs.readFile(filePath, 'utf8');
  const insertPatternOccurrence = originalFileContent.search(insertPattern);
  if (insertPatternOccurrence !== -1) {
    await fs.writeFile(
      filePath,
      `${originalFileContent.slice(
        0,
        insertPatternOccurrence
      )}${insertContent}${originalFileContent.slice(insertPatternOccurrence)}`
    );
    return true;
  }
  return false;
}

/**
 * Finds last occurrence of provided pattern and inserts content just before it.
 * @return `true` is insertion is successful, `false` otherwise.
 */
export async function insertToFileBeforeLastOccurrence(
  filePath: string,
  { insertContent, insertPattern }: { insertContent: string; insertPattern: RegExp | string }
) {
  const originalFileContent = await fs.readFile(filePath, 'utf8');

  const results = [...originalFileContent.matchAll(new RegExp(insertPattern, 'gm'))];
  const patternLastOccurrence = results[results.length - 1];
  if (!patternLastOccurrence) {
    return false;
  }
  await fs.writeFile(
    filePath,
    `${originalFileContent.slice(
      0,
      patternLastOccurrence.index
    )}${insertContent}${originalFileContent.slice(patternLastOccurrence.index)}`
  );
  return true;
}
