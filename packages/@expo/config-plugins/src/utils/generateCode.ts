/**
 * Get line indexes for the generated section of a file.
 *
 * @param src
 */
import crypto from 'crypto';

function getGeneratedSectionIndexes(
  src: string,
  tag: string
): { contents: string[]; start: number; end: number } {
  const contents = src.split('\n');
  const start = contents.findIndex(line => line.includes(`@generated begin ${tag}`));
  const end = contents.findIndex(line => line.includes(`@generated end ${tag}`));

  return { contents, start, end };
}

export type MergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};

/**
 * Merge the contents of two files together and add a generated header.
 *
 * @param src contents of the original file
 * @param newSrc new contents to merge into the original file
 * @param identifier used to update and remove merges
 * @param anchor regex to where the merge should begin
 * @param offset line offset to start merging at (<1 for behind the anchor)
 * @param comment comment style `//` or `#`
 */
export function mergeContents({
  src,
  newSrc,
  tag,
  anchor,
  offset,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  anchor: string | RegExp;
  offset: number;
  comment: string;
}): MergeResults {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    return {
      contents: addLines(sanitizedTarget ?? src, anchor, offset, [
        header,
        ...newSrc.split('\n'),
        `${comment} @generated end ${tag}`,
      ]),
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

export function removeContents({ src, tag }: { src: string; tag: string }): MergeResults {
  // Ensure the old generated contents are removed.
  const sanitizedTarget = removeGeneratedContents(src, tag);
  return {
    contents: sanitizedTarget ?? src,
    didMerge: false,
    didClear: !!sanitizedTarget,
  };
}

function addLines(content: string, find: string | RegExp, offset: number, toAdd: string[]) {
  const lines = content.split('\n');

  let lineIndex = lines.findIndex(line => line.match(find));
  if (lineIndex < 0) {
    const error = new Error(`Failed to match "${find}" in contents:\n${content}`);
    // @ts-ignore
    error.code = 'ERR_NO_MATCH';
    throw error;
  }
  for (const newLine of toAdd) {
    lines.splice(lineIndex + offset, 0, newLine);
    lineIndex++;
  }

  return lines.join('\n');
}

/**
 * Removes the generated section from a file, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made manually.
 *
 * @param src
 */
export function removeGeneratedContents(src: string, tag: string): string | null {
  const { contents, start, end } = getGeneratedSectionIndexes(src, tag);
  if (start > -1 && end > -1 && start < end) {
    contents.splice(start, end - start + 1);
    // TODO: We could in theory check that the contents we're removing match the hash used in the header,
    // this would ensure that we don't accidentally remove lines that someone added or removed from the generated section.
    return contents.join('\n');
  }
  return null;
}

export function createGeneratedHeaderComment(
  contents: string,
  tag: string,
  comment: string
): string {
  const hashKey = createHash(contents);

  // Everything after the `${tag} ` is unversioned and can be freely modified without breaking changes.
  return `${comment} @generated begin ${tag} - expo prebuild (DO NOT MODIFY) ${hashKey}`;
}

export function createHash(src: string): string {
  // this doesn't need to be secure, the shorter the better.
  const hash = crypto.createHash('sha1').update(src).digest('hex');
  return `sync-${hash}`;
}
