declare type Reference = any;
/**
 * @class DataSnapshot
 * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot
 */
export default class DataSnapshot {
    ref: Reference;
    key: string;
    _value: any;
    _priority: any;
    _childKeys: Array<string>;
    constructor(ref: Reference, snapshot: {
        [key: string]: any;
    });
    /**
     * Extracts a JavaScript value from a DataSnapshot.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#val
     * @returns {any}
     */
    val(): any;
    /**
     * Gets another DataSnapshot for the location at the specified relative path.
     * @param path
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#forEach
     * @returns {Snapshot}
     */
    child(path: string): DataSnapshot;
    /**
     * Returns true if this DataSnapshot contains any data.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#exists
     * @returns {boolean}
     */
    exists(): boolean;
    /**
     * Enumerates the top-level children in the DataSnapshot.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#forEach
     * @param action
     */
    forEach(action: (key: any) => any): boolean;
    /**
     * Gets the priority value of the data in this DataSnapshot.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#getPriority
     * @returns {String|Number|null}
     */
    getPriority(): string | number | null;
    /**
     * Returns true if the specified child path has (non-null) data.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#hasChild
     * @param path
     * @returns {Boolean}
     */
    hasChild(path: string): boolean;
    /**
     * Returns whether or not the DataSnapshot has any non-null child properties.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#hasChildren
     * @returns {boolean}
     */
    hasChildren(): boolean;
    /**
     * Returns the number of child properties of this DataSnapshot.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#numChildren
     * @returns {Number}
     */
    numChildren(): number;
    /**
     * Returns a JSON-serializable representation of this object.
     * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#toJSON
     * @returns {any}
     */
    toJSON(): Object;
}
export {};
