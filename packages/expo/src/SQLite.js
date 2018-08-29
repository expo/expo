// @flow

import './timer/polyfillNextTick';

import map from 'lodash.map';
import zipObject from 'lodash.zipobject';
import { NativeModules, Platform } from 'react-native';
import customOpenDatabase from '@expo/websql/custom';

const { ExponentSQLite } = NativeModules;

function SQLiteResult(error, insertId, rowsAffected, rows) {
  this.error = error;
  this.insertId = insertId;
  this.rowsAffected = rowsAffected;
  this.rows = rows;
}

function massageError(err) {
  return typeof err === 'string' ? new Error(err) : err;
}

function SQLiteDatabase(name) {
  this._name = name;
  this._closed = false;
}

function dearrayifyRow(res) {
  // use a compressed array format to send minimal data between native and web layers
  var rawError = res[0];
  if (rawError) {
    return new SQLiteResult(massageError(res[0]));
  }
  var insertId = res[1];
  if (insertId === null) {
    insertId = undefined;
  }
  var rowsAffected = res[2];
  var columns = res[3];
  var rows = res[4];
  var zippedRows = [];
  for (var i = 0, len = rows.length; i < len; i++) {
    zippedRows.push(zipObject(columns, rows[i]));
  }

  // v8 likes predictable objects
  return new SQLiteResult(null, insertId, rowsAffected, zippedRows);
}

// send less data over the wire, use an array
function arrayifyQuery(query) {
  return [query.sql, escapeForAndroid(query.args || [])];
}

// for avoiding strings truncated with '\u0000'
function escapeForAndroid(args) {
  if (Platform.OS === 'android') {
    return map(args, escapeBlob);
  } else {
    return args;
  }
}

function escapeBlob(data) {
  if (typeof data === 'string') {
    /* eslint-disable no-control-regex */
    return data
      .replace(/\u0002/g, '\u0002\u0002')
      .replace(/\u0001/g, '\u0001\u0002')
      .replace(/\u0000/g, '\u0001\u0001');
    /* eslint-enable no-control-regex */
  } else {
    return data;
  }
}

SQLiteDatabase.prototype.exec = function exec(queries, readOnly, callback) {
  if (this._closed) {
    throw new Error('Database was closed.');
  }

  function onSuccess(rawResults) {
    var results = map(rawResults, dearrayifyRow);
    callback(null, results);
  }

  function onError(err) {
    callback(massageError(err));
  }

  ExponentSQLite.exec(this._name, map(queries, arrayifyQuery), readOnly).then(onSuccess, onError);
};

SQLiteDatabase.prototype.close = function close() {
  this._closed = true;
  ExponentSQLite.close(this._name);
};

const openDB = customOpenDatabase(SQLiteDatabase);

function openDatabase(
  name: string,
  version: string,
  description: string,
  size: number,
  callback: ?(db: *) => void
) {
  if (!size) {
    size = 1;
  }
  if (!description) {
    description = name;
  }
  if (!version) {
    version = '1.0';
  }
  if (typeof name === 'undefined') {
    throw new Error('please be sure to call: openDatabase("myname.db")');
  }
  return openDB(name, version, description, size, callback);
}

export default {
  openDatabase,
};
