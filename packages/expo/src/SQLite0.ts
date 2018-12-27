import './timer/polyfillNextTick';

import zipObject from 'lodash.zipobject';
import { NativeModules, Platform } from 'react-native';
import customOpenDatabase from '@expo/websql/custom';

const { ExponentSQLite } = NativeModules;

type InternalQuery = { sql: string; args: unknown[] };

type InternalResultSet =
  | { error: Error }
  | {
      insertId?: number;
      rowsAffected: number;
      rows: Array<{ [column: string]: any }>;
    };

export type SQLiteCallback = (error?: Error | null, resultSet?: InternalResultSet) => void;

class SQLiteDatabase {
  _name: string;
  _closed: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  exec(queries: InternalQuery[], readOnly: boolean, callback: SQLiteCallback): void {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    ExponentSQLite.exec(this._name, queries.map(_serializeQuery), readOnly).then(
      nativeResultSets => {
        callback(null, nativeResultSets.map(_deserializeResultSet));
      },
      error => {
        // TODO: make the native API consistently reject with an error, not a string or other type
        callback(error instanceof Error ? error : new Error(error));
      }
    );
  }

  close() {
    this._closed = true;
    ExponentSQLite.close(this._name);
  }
}

function _serializeQuery(query: InternalQuery): [string, unknown[]] {
  return [query.sql, Platform.OS === 'android' ? query.args.map(_escapeBlob) : query.args];
}

function _deserializeResultSet(nativeResult): InternalResultSet {
  let [errorMessage, insertId, rowsAffected, columns, rows] = nativeResult;
  // TODO: send more structured error information from the native module so we can better construct
  // a SQLException object
  if (errorMessage !== null) {
    return { error: new Error(errorMessage) };
  }

  return {
    insertId,
    rowsAffected,
    rows: rows.map(row => zipObject(columns, row)),
  };
}

function _escapeBlob<T>(data: T): T {
  if (typeof data === 'string') {
    /* eslint-disable no-control-regex */
    return data
      .replace(/\u0002/g, '\u0002\u0002')
      .replace(/\u0001/g, '\u0001\u0002')
      .replace(/\u0000/g, '\u0001\u0001') as any;
    /* eslint-enable no-control-regex */
  } else {
    return data;
  }
}

const _openExpoSQLiteDatabase = customOpenDatabase(SQLiteDatabase);

export function openDatabase(
  name: string,
  version: string = '1.0',
  description: string = name,
  size: number = 1,
  callback?: (db: WebSQLDatabase) => void
): WebSQLDatabase {
  if (name === undefined) {
    throw new TypeError(`The database name must not be undefined`);
  }
  return _openExpoSQLiteDatabase(name, version, description, size, callback);
}

type WebSQLDatabase = unknown;

export default {
  openDatabase,
};
