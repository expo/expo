/**
 * @class FieldPath
 */
export default class FieldPath {
    _segments: string[];
    constructor(...segments: string[]);
    static documentId(): FieldPath;
}
export declare const DOCUMENT_ID: FieldPath;
