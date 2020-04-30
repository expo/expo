import 'core-js/es/string/match-all';
/**
 * @returns [`true`, modifiedContent: string] if replacement is successful, [`false`, originalContent] otherwise.
 */
export declare function replace(content: string, { replaceContent, replacePattern }: {
    replaceContent: string;
    replacePattern: string | RegExp;
}): [boolean, string];
/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns [`true`, modifiedContent: string] if insertion is successful, [`false`, originalContent] otherwise.
 */
export declare function insert(content: string, { insertContent, insertPattern }: {
    insertContent: string;
    insertPattern: RegExp | string;
}, insertBeforeLastOccurrence?: boolean): [boolean, string];
