// Forked from `@expo/config-plugins`, because its not exposed as public API or through a correct dependency chain
// See: https://github.com/expo/expo/blob/07bfd0447f8d80ba9ff19d2ab335792f8dc8aa53/packages/%40expo/config-plugins/src/utils/generateCode.ts
import crypto from 'node:crypto';

export type CodeMergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};

type CodeCommentLocation = {
  /** All lines of code of the (generated) comment */
  contents: string[];
  /** The line number where the (generated) comment starts */
  start: number;
  /** The line number where the (generated) comment ends */
  end: number;
};

/** Create a short insecure hash from a string, used as comment in the code */
function createHash(src: string): string {
  return `sync-${crypto.createHash('sha1').update(src).digest('hex')}`;
}

/** Create the starting and ending comments to mark generated code */
function createGeneratedComment(generatedCode: string, tag: string, comment: string) {
  return {
    // Everything after the `${tag} ` is unversioned and can be freely modified without breaking changes.
    start: `${comment} @generated begin ${tag} - expo prebuild (DO NOT MODIFY) ${createHash(generatedCode)}`,
    // Nothing after the `${tag}` is allowed to be modified.
    end: `${comment} @generated end ${tag}`,
  };
}

/** Find the first generated code comment and return the position */
function getGeneratedCodeSections(src: string, tag: string): CodeCommentLocation {
  const contents = src.split('\n');
  const start = contents.findIndex((line) => new RegExp(`@generated begin ${tag} -`).test(line));
  const end = contents.findIndex((line) => new RegExp(`@generated end ${tag}$`).test(line));

  return { contents, start, end };
}

/**
 * Removes the generated section from a file, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made manually.
 */
function removeGeneratedCodeContents(src: string, tag: string): string | null {
  const { contents, start, end } = getGeneratedCodeSections(src, tag);

  if (start > -1 && end > -1 && start < end) {
    contents.splice(start, end - start + 1);
    // TODO: We could in theory check that the contents we're removing match the hash used in the header,
    // this would ensure that we don't accidentally remove lines that someone added or removed from the generated section.
    return contents.join('\n');
  }

  return null;
}

/** Fork of `mergeContents`, but appends the contents to the end of the file instead. */
export function appendGeneratedCodeContents({
  src,
  tag,
  comment,
  generatedCode,
}: {
  src: string;
  tag: string;
  comment: string;
  generatedCode: string;
}): CodeMergeResults {
  const generatedComment = createGeneratedComment(generatedCode, tag, comment);
  if (!src.includes(generatedComment.start)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedCodeContents(src, tag);
    const contentsToAdd = [
      generatedComment.start, // @begin
      generatedCode, // contents
      generatedComment.end, // @end
    ].join('\n');

    return {
      contents: sanitizedTarget ?? src + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}
