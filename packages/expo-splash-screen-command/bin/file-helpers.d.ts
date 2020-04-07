import 'core-js/es/string/match-all';
export declare const COMMENTS: {
    wrapXML: (comment: string) => string;
    wrapJavaKotlin: (comment: string) => string;
    LINE: string;
    FILE_TOP: string;
    FILE_TOP_NO_MODIFY: string;
    ANDROID_MANIFEST: string;
};
/**
 * Modifies file's content if either `replacePattern` or `insertPattern` matches.
 * If `replacePattern` matches, `replaceContent` is used, otherwise if `insertPattern` matches, `insertContent` is used.
 * `insertBeforeLastOccurrence` - flag that indicates whether to insert before first or last occurrence.
 * @returns object describing which operation is successful.
 */
export declare function replaceOrInsertInFile(filePath: string, { replaceContent, replacePattern, insertContent, insertPattern, insertBeforeLastOccurrence, }: {
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
    insertBeforeLastOccurrence?: boolean;
}): Promise<{
    replaced: boolean;
    inserted: boolean;
}>;
/**
 * Tries to do following actions:
 * - when file doesn't exist or is empty - create it with given fileContent,
 * - when file does exist and contains provided replacePattern - replace replacePattern with replaceContent,
 * - when file does exist and doesn't contain provided replacePattern - insert given insertContent before first match of insertPattern,
 * - when insertPattern does not occur in the file - append insertContent to the end of the file.
 * @returns object describing which operation is successful.
 */
export declare function writeOrReplaceOrInsertInFile(filePath: string, { fileContent, replaceContent, replacePattern, insertContent, insertPattern, }: {
    fileContent: string;
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
}): Promise<{
    created?: boolean;
    replaced?: boolean;
    inserted?: boolean;
}>;
/**
 * Overrides or creates file (with possibly missing directories) with given content.
 */
export declare function writeToFile(filePath: string, fileContent: string): Promise<void>;
/**
 * @returns `true` if replacement is successful, `false` otherwise.
 */
export declare function replaceInFile(filePath: string, { replaceContent, replacePattern }: {
    replaceContent: string;
    replacePattern: string | RegExp;
}): Promise<boolean>;
/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns `true` if insertion is successful, `false` otherwise.
 */
export declare function insertToFile(filePath: string, { insertContent, insertPattern }: {
    insertContent: string;
    insertPattern: RegExp | string;
}): Promise<boolean>;
/**
 * Finds last occurrence of provided pattern and inserts content just before it.
 * @return `true` is insertion is successful, `false` otherwise.
 */
export declare function insertToFileBeforeLastOccurrence(filePath: string, { insertContent, insertPattern }: {
    insertContent: string;
    insertPattern: RegExp | string;
}): Promise<boolean>;
