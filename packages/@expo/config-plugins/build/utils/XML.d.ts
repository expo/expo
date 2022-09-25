export declare type XMLValue = boolean | number | string | null | XMLArray | XMLObject;
export interface XMLArray extends Array<XMLValue> {
}
export interface XMLObject {
    [key: string]: XMLValue | undefined;
}
export declare function writeXMLAsync(options: {
    path: string;
    xml: any;
}): Promise<void>;
export declare function readXMLAsync(options: {
    path: string;
    fallback?: string | null;
}): Promise<XMLObject>;
export declare function parseXMLAsync(contents: string): Promise<XMLObject>;
export declare function format(manifest: any, { indentLevel, newline }?: {
    indentLevel?: number | undefined;
    newline?: string | undefined;
}): string;
/**
 * Escapes Android string literals, specifically characters `"`, `'`, `\`, `\n`, `\r`, `\t`
 *
 * @param value unescaped Android XML string literal.
 */
export declare function escapeAndroidString(value: string): string;
export declare function unescapeAndroidString(value: string): string;
