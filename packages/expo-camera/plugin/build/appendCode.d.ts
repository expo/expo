export type CodeMergeResults = {
    contents: string;
    didClear: boolean;
    didMerge: boolean;
};
/** Fork of `mergeContents`, but appends the contents to the end of the file instead. */
export declare function appendGeneratedCodeContents({ src, tag, comment, generatedCode, }: {
    src: string;
    tag: string;
    comment: string;
    generatedCode: string;
}): CodeMergeResults;
