/**
 * @flow
 * Query representation wrapper
 */
import { utils } from 'expo-firebase-app';
import type { DatabaseModifier } from './types';
import type Reference from './Reference';

const { objectToUniqueId } = utils;

// todo doc methods

/**
 * @class Query
 */
export default class Query {
  _reference: Reference;
  modifiers: Array<DatabaseModifier>;

  constructor(ref: Reference, existingModifiers?: Array<DatabaseModifier>) {
    this.modifiers = existingModifiers ? [...existingModifiers] : [];
    this._reference = ref;
  }

  /**
   *
   * @param name
   * @param key
   * @return {Reference|*}
   */
  orderBy(name: string, key?: string) {
    this.modifiers.push({
      id: `orderBy-${name}:${key || ''}`,
      type: 'orderBy',
      name,
      key,
    });

    return this._reference;
  }

  /**
   *
   * @param name
   * @param limit
   * @return {Reference|*}
   */
  limit(name: string, limit: number) {
    this.modifiers.push({
      id: `limit-${name}:${limit}`,
      type: 'limit',
      name,
      limit,
    });

    return this._reference;
  }

  /**
   *
   * @param name
   * @param value
   * @param key
   * @return {Reference|*}
   */
  filter(name: string, value: any, key?: string) {
    this.modifiers.push({
      id: `filter-${name}:${objectToUniqueId(value)}:${key || ''}`,
      type: 'filter',
      name,
      value,
      valueType: typeof value,
      key,
    });

    return this._reference;
  }

  /**
   *
   * @return {[*]}
   */
  getModifiers(): Array<DatabaseModifier> {
    return [...this.modifiers];
  }

  /**
   *
   * @return {*}
   */
  queryIdentifier() {
    // sort modifiers to enforce ordering
    const sortedModifiers = this.getModifiers().sort((a, b) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    // Convert modifiers to unique key
    let key = '{';
    for (let i = 0; i < sortedModifiers.length; i++) {
      if (i !== 0) key += ',';
      key += sortedModifiers[i].id;
    }
    key += '}';

    return key;
  }
}
