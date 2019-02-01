export default class FieldValue {
    constructor(type, elements) {
        this._type = type;
        this._elements = elements;
    }
    get type() {
        return this._type;
    }
    get elements() {
        return this._elements;
    }
    static delete() {
        return new FieldValue(TypeFieldValueDelete);
    }
    static serverTimestamp() {
        return new FieldValue(TypeFieldValueTimestamp);
    }
    static arrayUnion(...elements) {
        return new FieldValue(TypeFieldValueUnion, elements);
    }
    static arrayRemove(...elements) {
        return new FieldValue(TypeFieldValueRemove, elements);
    }
}
export const TypeFieldValueDelete = 'delete';
export const TypeFieldValueRemove = 'remove';
export const TypeFieldValueUnion = 'union';
export const TypeFieldValueTimestamp = 'timestamp';
//# sourceMappingURL=FieldValue.js.map