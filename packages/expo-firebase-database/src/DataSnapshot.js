/**
 * @flow
 * DataSnapshot representation wrapper
 */
import { utils } from 'expo-firebase-app';
import type Reference from './Reference';
const { isObject, deepGet, deepExists } = utils;

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

  constructor(ref: Reference, snapshot: Object) {
    this.key = snapshot.key;

    if (ref.key !== snapshot.key) {
      this.ref = ref.child(snapshot.key);
    } else {
      this.ref = ref;
    }

    // internal use only
    this._value = snapshot.value;
    this._priority = snapshot.priority === undefined ? null : snapshot.priority;
    this._childKeys = snapshot.childKeys || [];
  }

  /**
   * Extracts a JavaScript value from a DataSnapshot.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#val
   * @returns {any}
   */
  val(): any {
    // clone via JSON stringify/parse - prevent modification of this._value
    if (isObject(this._value) || Array.isArray(this._value))
      return JSON.parse(JSON.stringify(this._value));
    return this._value;
  }

  /**
   * Gets another DataSnapshot for the location at the specified relative path.
   * @param path
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#forEach
   * @returns {Snapshot}
   */
  child(path: string): DataSnapshot {
    // TODO validate path is a string
    let value = deepGet(this._value, path);
    if (value === undefined) value = null;
    const childRef = this.ref.child(path);
    return new DataSnapshot(childRef, {
      value,
      key: childRef.key,
      exists: value !== null,

      // TODO this is wrong - child keys needs to be the ordered keys, from FB
      // TODO potential solution is build up a tree/map of a snapshot and its children
      // TODO natively and send that back to JS to be use in this class.

      // null check to keep flow happy even though isObject already does this
      childKeys: isObject(value) && value !== null ? Object.keys(value) : [],
    });
  }

  /**
   * Returns true if this DataSnapshot contains any data.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#exists
   * @returns {boolean}
   */
  exists(): boolean {
    return this._value !== null;
  }

  /**
   * Enumerates the top-level children in the DataSnapshot.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#forEach
   * @param action
   */
  forEach(action: (key: any) => any): boolean {
    if (!this._childKeys.length) return false;
    let cancelled = false;

    for (let i = 0, len = this._childKeys.length; i < len; i++) {
      const key = this._childKeys[i];
      const childSnapshot = this.child(key);
      const returnValue = action(childSnapshot);

      if (returnValue === true) {
        cancelled = true;
        break;
      }
    }

    return cancelled;
  }

  /**
   * Gets the priority value of the data in this DataSnapshot.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#getPriority
   * @returns {String|Number|null}
   */
  getPriority(): string | number | null {
    return this._priority;
  }

  /**
   * Returns true if the specified child path has (non-null) data.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#hasChild
   * @param path
   * @returns {Boolean}
   */
  hasChild(path: string): boolean {
    return deepExists(this._value, path);
  }

  /**
   * Returns whether or not the DataSnapshot has any non-null child properties.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#hasChildren
   * @returns {boolean}
   */
  hasChildren(): boolean {
    return this.numChildren() > 0;
  }

  /**
   * Returns the number of child properties of this DataSnapshot.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#numChildren
   * @returns {Number}
   */
  numChildren(): number {
    if (!isObject(this._value)) return 0;
    return Object.keys(this._value).length;
  }

  /**
   * Returns a JSON-serializable representation of this object.
   * @link https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot#toJSON
   * @returns {any}
   */
  toJSON(): Object {
    return this.val();
  }
}
