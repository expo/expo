export interface CodeBlock {
    start: number;
    end: number;
    code: string;
}
/**
 * Insert contents at given offset
 * @param srcContents source contents
 * @param insertion content to insert
 * @param offset `srcContents` offset to insert `insertion`
 * @returns updated contents
 */
export declare function insertContentsAtOffset(srcContents: string, insertion: string, offset: number): string;
/**
 * Replace contents at given start and end offset
 *
 * @param contents source contents
 * @param replacement new contents to place in [startOffset:endOffset]
 * @param startOffset `contents` start offset for replacement
 * @param endOffset `contents` end offset for replacement
 * @returns updated contents
 */
export declare function replaceContentsWithOffset(contents: string, replacement: string, startOffset: number, endOffset: number): string;
/**
 * String.prototype.search() with offset support
 *
 * @param source source string to search
 * @param regexp RegExp pattern to search
 * @param offset start offset of `source` to search `regexp` pattern
 * @returns The index of the first match between the regular expression and the given string, or -1 if no match was found.
 */
export declare function searchFromOffset(source: string, regexp: RegExp, offset: number): number;
