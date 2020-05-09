import './polyfillNextTick';

import customOpenDatabase from '@expo/websql/custom';
import { NativeModulesProxy } from '@unimodules/core';
import zipObject from 'lodash/zipObject';
import { Platform } from 'react-native';

import { Query, SQLiteCallback, ResultSet, ResultSetError, WebSQLDatabase, SQLiteFileInfo } from './SQLite.types';

const { ExponentSQLite } = NativeModulesProxy;

class SQLiteDatabase {
  _name: string;
  _key?: string;
  _closed: boolean = false;

  constructor({ name, key }: SQLiteFileInfo) {
    this._name = name;
    this._key = key;
  }

  exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    ExponentSQLite.exec(this._name, this._key, queries.map(_serializeQuery), readOnly).then(
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

function _serializeQuery(query: Query): [string, unknown[]] {
  return [query.sql, Platform.OS === 'android' ? query.args.map(_escapeBlob) : query.args];
}

function _deserializeResultSet(nativeResult): ResultSet | ResultSetError {
  const [errorMessage, insertId, rowsAffected, columns, rows] = nativeResult;
  // TODO: send more structured error information from the native module so we can better construct
  // a SQLException object
  if (errorMessage !== null) {
    return { error: new Error(errorMessage) } as ResultSetError;
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

function addExecMethod(db: any): WebSQLDatabase {
  db.exec = (queries: Query[], readOnly: boolean, callback: SQLiteCallback): void => {
    db._db.exec(queries, readOnly, callback);
  };
  return db;
}

export function openDatabase(
  fileInfo: SQLiteFileInfo | string,
  version: string = '1.0',
  description: string,
  size: number = 1,
  callback?: (db: WebSQLDatabase) => void
): WebSQLDatabase {
  let name: string;
  let key: string | undefined;

  if (typeof fileInfo === 'string') {
    name = fileInfo;
    key = undefined;
  } else {
    ({ name, key } = fileInfo);
  }

  if (name === undefined) {
    throw new TypeError(`The database name must not be undefined`);
  }
  description = description || name;

  const db = _openExpoSQLiteDatabase({ name, key }, version, description, size, callback);
  const dbWithExec = addExecMethod(db);
  return dbWithExec;
}
