/* @flow */
import type Database from './index';
import { typeof statics as DatabaseStatics } from './index';

export type DatabaseModifier = {
  id: string,
  type: 'orderBy' | 'limit' | 'filter',
  name?: string,
  key?: string,
  limit?: number,
  value?: any,
  valueType?: string,
};

export type DatabaseModule = {
  (): Database,
  nativeModuleExists: boolean,
} & DatabaseStatics;
