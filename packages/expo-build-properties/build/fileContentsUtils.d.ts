/**
 * A set of helper functions to update file contents. This is a simplified version to internal generateCode in config-plugin.
 */
export interface SectionOptions {
    tag: string;
    commentPrefix: string;
}
export declare function appendContents(src: string, contents: string, sectionOptions: SectionOptions): string;
export declare function purgeContents(src: string, sectionOptions: SectionOptions): string;
