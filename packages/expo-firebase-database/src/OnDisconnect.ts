import { utils } from 'expo-firebase-app';

// import type Database from './index';
// import type Reference from './Reference';

type Database = { [key: string]: any };
type Reference = { [key: string]: any };

const { typeOf } = utils;

/**
 * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect
 * @class OmDisconnect
 */
export default class OnDisconnect {
  _database: Database;
  ref: Reference;
  path: string;

  /**
   *
   * @param ref
   */
  constructor(ref: Reference) {
    this.ref = ref;
    this.path = ref.path;
    this._database = ref._database;
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#set
   * @param value
   * @returns {*}
   */
  async set(value: string | Object): Promise<void> {
    return await this._database.nativeModule.onDisconnectSet(this.path, {
      type: typeOf(value),
      value,
    });
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#update
   * @param values
   * @returns {*}
   */
  async update(values: Object): Promise<void> {
    return await this._database.nativeModule.onDisconnectUpdate(this.path, values);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#remove
   * @returns {*}
   */
  async remove(): Promise<void> {
    return await this._database.nativeModule.onDisconnectRemove(this.path);
  }

  /**
   * @url https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect#cancel
   * @returns {*}
   */
  async cancel(): Promise<void> {
    return await this._database.nativeModule.onDisconnectCancel(this.path);
  }
}
