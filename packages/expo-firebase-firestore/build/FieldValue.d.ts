import { AnyJs } from './utils/any';
export default class FieldValue {
    _type: string;
    _elements: AnyJs[] | any;
    constructor(type: string, elements?: AnyJs[]);
    readonly type: string;
    readonly elements: AnyJs[];
    static delete(): FieldValue;
    static serverTimestamp(): FieldValue;
    static arrayUnion(...elements: AnyJs[]): FieldValue;
    static arrayRemove(...elements: AnyJs[]): FieldValue;
}
export declare const TypeFieldValueDelete = "delete";
export declare const TypeFieldValueRemove = "remove";
export declare const TypeFieldValueUnion = "union";
export declare const TypeFieldValueTimestamp = "timestamp";
