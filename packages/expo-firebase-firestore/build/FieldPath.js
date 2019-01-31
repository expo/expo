/**
 * @class FieldPath
 */
export default class FieldPath {
    constructor(...segments) {
        // TODO: Validation
        this._segments = segments;
    }
    static documentId() {
        return DOCUMENT_ID;
    }
}
export const DOCUMENT_ID = new FieldPath('__name__');
//# sourceMappingURL=FieldPath.js.map