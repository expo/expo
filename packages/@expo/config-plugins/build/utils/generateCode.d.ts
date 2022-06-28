export declare type MergeResults = {
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
export declare function mergeContents({ src, newSrc, tag, anchor, offset, comment, }: {
    src: string;
    newSrc: string;
    tag: string;
    anchor: string | RegExp;
    offset: number;
    comment: string;
}): MergeResults;
export declare function removeContents({ src, tag }: {
    src: string;
    tag: string;
}): MergeResults;
/**
 * Removes the generated section from a file, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made manually.
 *
 * @param src
 */
export declare function removeGeneratedContents(src: string, tag: string): string | null;
export declare function createGeneratedHeaderComment(contents: string, tag: string, comment: string): string;
export declare function createHash(src: string): string;
