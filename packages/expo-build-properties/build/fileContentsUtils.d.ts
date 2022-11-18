/**
 * A set of helper functions to update file contents. This is a simplified version to the config-plugins internal generateCode functions.
 */
/**
 * Options for a generated section
 */
export interface SectionOptions {
    /**
     * A meaningful tag to differentiate the generated section
     */
    tag: string;
    /**
     * Defines comment for the generated code.
     * E.g. '//' for js code or '#' for shell script
     */
    commentPrefix: string;
}
/**
 * Append new contents to src with generated section comments
 *
 * If there is already a generated section, this function will append the new contents at the end of the section.
 * Otherwise, this function will generate a new section at the end of file.
 */
export declare function appendContents(src: string, contents: string, sectionOptions: SectionOptions): string;
/**
 * Purge a generated section
 */
export declare function purgeContents(src: string, sectionOptions: SectionOptions): string;
