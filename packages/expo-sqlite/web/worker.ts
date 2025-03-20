// Copyright 2015-present 650 Industries. All rights reserved.

/// <reference types="./wa-sqlite/types" />

import { createSQLAction } from './SQLAction';
import { SQLiteOptions } from './SQLiteOptions';
import { sendWorkerResult } from './WorkerChannel';
import { type Changeset } from '../src/NativeSession';
import { type SQLiteColumnNames, type SQLiteColumnValues } from '../src/NativeStatement';
import { AccessHandlePoolVFS } from './wa-sqlite/AccessHandlePoolVFS';
import { MemoryVFS } from './wa-sqlite/MemoryVFS';
import * as SQLite from './wa-sqlite/sqlite-api';
import {
  SQLITE_ROW,
  SQLITE_DONE,
  SQLITE_OK,
  SQLITE_OPEN_READWRITE,
  SQLITE_OPEN_CREATE,
} from './wa-sqlite/sqlite-constants';
import WaSQLiteFactory from './wa-sqlite/wa-sqlite';
// @ts-expect-error wasm module is not typed
import wasmModule from './wa-sqlite/wa-sqlite.wasm';
import {
  type SQLiteWorkerMessage,
  type SQLiteWorkerMessageType,
  type MessageTypeMap,
  type ResultType,
  type ResultTypeMap,
  type OnDatabaseChangeMessage,
} from './web.types';

type DatabasePointer = number;
type StatementPointer = number;
type SessionPointer = number;

interface DatabaseEntity {
  pointer: DatabasePointer;
  databasePath: string;
  openOptions: SQLiteOptions;
}
interface StatementEntity {
  pointer: StatementPointer;
}
interface SessionEntity {
  pointer: SessionPointer;
}

const VFS_NAME_PERSISTENT = 'expo-sqlite';
const VFS_NAME_MEMORY = 'expo-sqlite-memfs';

const MAX_INT32 = 0x7fffffff;
const MIN_INT32 = -0x80000000;

let _sqlite3: SQLiteAPI | null = null;
let _vfs: AccessHandlePoolVFS | null = null;
let _vfsMemory: MemoryVFS | null = null;

const databaseIdMap = new Map<number, DatabaseEntity>();
const statementIdMap = new Map<number, StatementEntity>();
const sessionIdMap = new Map<number, SessionEntity>();

class SQLiteErrorException extends Error {}

self.onmessage = async (event: MessageEvent<SQLiteWorkerMessage>) => {
  let result: ResultType | null = null;
  let error: Error | null = null;
  try {
    const message = event.data as MessageTypeMap[typeof event.data.type];
    result = await handleMessageImpl(message);
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
  }

  const syncTrait = event.data.isSync
    ? {
        lockBuffer: event.data.lockBuffer,
        resultBuffer: event.data.resultBuffer,
      }
    : undefined;
  sendWorkerResult({
    id: event.data.id,
    result,
    error,
    syncTrait,
  });
};

async function handleMessageImpl<T extends SQLiteWorkerMessageType>({
  type,
  data,
}: MessageTypeMap[T]): Promise<ResultType> {
  let result: ResultType | undefined;

  switch (type) {
    case 'backupDatabase': {
      await backupDatabase(
        data.destNativeDatabaseId,
        data.destDatabaseName,
        data.sourceNativeDatabaseId,
        data.sourceDatabaseName
      );
      break;
    }

    case 'close': {
      await closeDatabase(data.nativeDatabaseId);
      break;
    }

    case 'deleteDatabase': {
      await deleteDatabase(data.databasePath);
      break;
    }

    case 'exec': {
      await exec(data.nativeDatabaseId, data.source);
      break;
    }

    case 'finalize': {
      await finalize(data.nativeDatabaseId, data.nativeStatementId);
      break;
    }

    case 'getAll': {
      result = await getAllRows(data.nativeDatabaseId, data.nativeStatementId);
      break;
    }

    case 'getColumnNames': {
      result = await getColumnNames(data.nativeStatementId);
      break;
    }

    case 'importAssetDatabase': {
      await importAssetDatabase(data.databasePath, data.assetDatabasePath, data.forceOverwrite);
      break;
    }

    case 'isInTransaction': {
      result = await isInTransaction(data.nativeDatabaseId);
      break;
    }

    case 'open': {
      await openDatabase(
        data.nativeDatabaseId,
        data.databasePath,
        new SQLiteOptions(data.options),
        data.serializedData
      );
      break;
    }

    case 'prepare': {
      result = await prepare(data.nativeDatabaseId, data.nativeStatementId, data.source);
      break;
    }

    case 'reset': {
      await reset(data.nativeDatabaseId, data.nativeStatementId);
      break;
    }

    case 'run': {
      result = await run(
        data.nativeDatabaseId,
        data.nativeStatementId,
        data.bindParams,
        data.bindBlobParams,
        data.shouldPassAsArray
      );
      break;
    }

    case 'serialize': {
      result = await serializeDatabase(data.nativeDatabaseId, data.schemaName);
      break;
    }

    case 'step': {
      result = await step(data.nativeDatabaseId, data.nativeStatementId);
      break;
    }

    case 'sessionCreate': {
      await sessionCreate(data.nativeDatabaseId, data.nativeSessionId, data.dbName);
      break;
    }

    case 'sessionAttach': {
      await sessionAttach(data.nativeDatabaseId, data.nativeSessionId, data.table);
      break;
    }

    case 'sessionEnable': {
      await sessionEnable(data.nativeDatabaseId, data.nativeSessionId, data.enabled);
      break;
    }

    case 'sessionClose': {
      await sessionClose(data.nativeDatabaseId, data.nativeSessionId);
      break;
    }

    case 'sessionCreateChangeset': {
      result = await sessionCreateChangeset(data.nativeDatabaseId, data.nativeSessionId);
      break;
    }

    case 'sessionCreateInvertedChangeset': {
      result = await sessionCreateInvertedChangeset(data.nativeDatabaseId, data.nativeSessionId);
      break;
    }

    case 'sessionApplyChangeset': {
      await sessionApplyChangeset(data.nativeDatabaseId, data.nativeSessionId, data.changeset);
      break;
    }

    case 'sessionInvertChangeset': {
      result = await sessionInvertChangeset(
        data.nativeDatabaseId,
        data.nativeSessionId,
        data.changeset
      );
      break;
    }

    default: {
      throw new Error(`Unknown message type: ${type}`);
    }
  }

  return result;
}

//#region Request handlers

async function backupDatabase(
  destNativeDatabaseId: number,
  destDatabaseName: string,
  sourceNativeDatabaseId: number,
  sourceDatabaseName: string
): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const destDb = databaseIdMap.get(destNativeDatabaseId);
  if (!destDb) throw new Error(`Database not found - nativeDatabaseId[${destNativeDatabaseId}]`);
  const sourceDb = databaseIdMap.get(sourceNativeDatabaseId);
  if (!sourceDb)
    throw new Error(`Database not found - nativeDatabaseId[${sourceNativeDatabaseId}]`);
  await sqlite3.backup(destDb.pointer, destDatabaseName, sourceDb.pointer, sourceDatabaseName);
}

async function closeDatabase(nativeDatabaseId: number) {
  maybeFinalizeAllStatements(nativeDatabaseId);
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (dbEntity) {
    databaseIdMap.delete(nativeDatabaseId);
    await sqlite3.close(dbEntity.pointer);
  }
}

async function deleteDatabase(databasePath: string): Promise<void> {
  const { vfs } = await maybeInitAsync();
  if (databasePath !== ':memory:') {
    vfs.jDelete(databasePath, 0 /* unused arg for AccessHandlePoolVFS */);
  }
}

async function deserializeDatabase(
  sqlite3: SQLiteAPI,
  serializedData: Uint8Array
): Promise<DatabasePointer> {
  const pointer = await sqlite3.open_v2(
    ':memory:',
    SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE,
    VFS_NAME_MEMORY
  );
  await sqlite3.deserialize(pointer, 'main', serializedData);
  return pointer;
}

async function exec(nativeDatabaseId: number, source: string) {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  await sqlite3.exec(dbEntity.pointer, source);
}

async function finalize(nativeDatabaseId: number, nativeStatementId: number): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);

  statementIdMap.delete(nativeStatementId);
  if ((await sqlite3.finalize(stmt.pointer)) !== SQLITE_OK) {
    throw new Error('Error finalizing statement');
  }
}

async function getAllRows(
  nativeDatabaseId: number,
  nativeStatementId: number
): Promise<SQLiteColumnValues[]> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);

  const rows: SQLiteColumnValues[] = [];
  while (true) {
    const ret = await sqlite3.step(stmt.pointer);
    if (ret === SQLITE_ROW) {
      rows.push(getColumnValues(sqlite3, stmt.pointer));
      continue;
    } else if (ret === SQLITE_DONE) {
      break;
    }
    throw new Error('Error executing statement');
  }
  return rows;
}

async function getColumnNames(nativeStatementId: number): Promise<SQLiteColumnNames> {
  const { sqlite3 } = await maybeInitAsync();
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);
  const columnCount = sqlite3.column_count(stmt.pointer);
  const columnNames: SQLiteColumnNames = [];
  for (let i = 0; i < columnCount; i++) {
    columnNames.push(sqlite3.column_name(stmt.pointer, i));
  }
  return columnNames;
}

async function importAssetDatabase(
  databasePath: string,
  assetDatabasePath: string,
  forceOverwrite: boolean
): Promise<void> {
  const { sqlite3, vfs } = await maybeInitAsync();
  if (!forceOverwrite) {
    const buffer = new DataView(new ArrayBuffer(4));
    await vfs.jAccess(databasePath, 0 /* unused arg for AccessHandlePoolVFS */, buffer);
    if (buffer.getUint8(0) === 1) {
      return;
    }
  }
  const response = await fetch(assetDatabasePath);
  if (!response.ok) {
    throw new Error(
      `[importAssetDatabaseAsync] Failed to fetch asset database: ${response.statusText}`
    );
  }
  const serializedData = new Uint8Array(await response.arrayBuffer());
  const srcDb = await sqlite3.open_v2(
    databasePath,
    SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE,
    VFS_NAME_PERSISTENT
  );
  await sqlite3.deserialize(srcDb, 'main', serializedData);
  const destDb = await sqlite3.open_v2(databasePath);
  await sqlite3.backup(destDb, 'main', srcDb, 'main');
  await sqlite3.close(srcDb);
  await sqlite3.close(destDb);
}

async function isInTransaction(nativeDatabaseId: number): Promise<boolean> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  return sqlite3.get_autocommit(dbEntity.pointer) === 0;
}

async function openDatabase(
  nativeDatabaseId: number,
  databasePath: string,
  options: SQLiteOptions,
  serializedData?: Uint8Array
) {
  const { sqlite3 } = await maybeInitAsync();
  let pointer: DatabasePointer;

  if (serializedData) {
    pointer = await deserializeDatabase(sqlite3, serializedData);
  } else {
    const dbEntity = findCachedDatabase(
      (entity) =>
        entity.databasePath === databasePath &&
        entity.openOptions.equals(options) &&
        !options.useNewConnection
    );
    if (dbEntity) {
      databaseIdMap.set(nativeDatabaseId, dbEntity);
      await initDb(sqlite3, dbEntity);
      return;
    }

    const flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE;
    const vfsName = databasePath === ':memory:' ? VFS_NAME_MEMORY : VFS_NAME_PERSISTENT;
    pointer = await sqlite3.open_v2(databasePath, flags, vfsName);
  }

  const dbEntity = {
    pointer,
    databasePath,
    openOptions: options,
  };
  databaseIdMap.set(nativeDatabaseId, dbEntity);
  await initDb(sqlite3, dbEntity);
}

async function prepare(
  nativeDatabaseId: number,
  nativeStatementId: number,
  source: string
): Promise<ResultTypeMap['prepare']> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);

  const asyncIterable = sqlite3.statements(dbEntity.pointer, source, { unscoped: true });
  const asyncIterator = asyncIterable[Symbol.asyncIterator]();
  const { value: statementPointer } = await asyncIterator.next();
  asyncIterator.return?.();
  if (!statementPointer) throw new Error('Failed to prepare statement');
  statementIdMap.set(nativeStatementId, { pointer: statementPointer });
}

async function run(
  nativeDatabaseId: number,
  nativeStatementId: number,
  bindParams: any,
  bindBlobParams: any,
  shouldPassAsArray: boolean
) {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);

  sqlite3.reset(stmt.pointer);
  sqlite3.clear_bindings(stmt.pointer);
  for (const [key, param] of Object.entries(bindParams)) {
    const index = getBindParamIndex(sqlite3, stmt.pointer, key, shouldPassAsArray);
    if (index > 0) {
      bindStatementParam(sqlite3, stmt.pointer, param, index);
    }
  }
  for (const [key, param] of Object.entries(bindBlobParams)) {
    const index = getBindParamIndex(sqlite3, stmt.pointer, key, shouldPassAsArray);
    if (index > 0) {
      bindStatementParam(sqlite3, stmt.pointer, param, index);
    }
  }

  const ret = await sqlite3.step(stmt.pointer);
  if (ret !== SQLITE_ROW && ret !== SQLITE_DONE) {
    throw new SQLiteErrorException('Error executing statement');
  }

  const firstRowValues = ret === SQLITE_ROW ? getColumnValues(sqlite3, stmt.pointer) : [];
  return {
    lastInsertRowId: Number(sqlite3.last_insert_rowid(dbEntity.pointer)),
    changes: sqlite3.changes(dbEntity.pointer),
    firstRowValues,
  };
}

async function reset(nativeDatabaseId: number, nativeStatementId: number): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);

  if ((await sqlite3.reset(stmt.pointer)) !== SQLITE_OK) {
    throw new Error('Error resetting statement');
  }
}

async function serializeDatabase(
  nativeDatabaseId: number,
  schemaName: string
): Promise<Uint8Array | null> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  return sqlite3.serialize(dbEntity.pointer, schemaName);
}

async function step(
  nativeDatabaseId: number,
  nativeStatementId: number
): Promise<SQLiteColumnValues | null> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const stmt = statementIdMap.get(nativeStatementId);
  if (!stmt) throw new Error(`Statement not found - nativeStatementId[${nativeStatementId}]`);

  const ret = await sqlite3.step(stmt.pointer);
  if (ret === SQLITE_ROW) {
    return getColumnValues(sqlite3, stmt.pointer);
  }
  if (ret !== SQLITE_DONE) {
    throw new Error('Error executing statement');
  }
  return null;
}

async function sessionCreate(
  nativeDatabaseId: number,
  nativeSessionId: number,
  dbName: string
): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);

  const session = sqlite3.session_create(dbEntity.pointer, dbName);
  sessionIdMap.set(nativeSessionId, { pointer: session });
}

async function sessionAttach(
  nativeDatabaseId: number,
  nativeSessionId: number,
  table: string | null
): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const session = sessionIdMap.get(nativeSessionId);
  if (!session) throw new Error(`Session not found - nativeSessionId[${nativeSessionId}]`);

  sqlite3.session_attach(session.pointer, table);
}

async function sessionEnable(
  nativeDatabaseId: number,
  nativeSessionId: number,
  enabled: boolean
): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const session = sessionIdMap.get(nativeSessionId);
  if (!session) throw new Error(`Session not found - nativeSessionId[${nativeSessionId}]`);

  sqlite3.session_enable(session.pointer, enabled);
}

async function sessionClose(nativeDatabaseId: number, nativeSessionId: number): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const session = sessionIdMap.get(nativeSessionId);
  if (!session) throw new Error(`Session not found - nativeSessionId[${nativeSessionId}]`);

  sessionIdMap.delete(nativeSessionId);
  sqlite3.session_delete(session.pointer);
}

async function sessionCreateChangeset(
  nativeDatabaseId: number,
  nativeSessionId: number
): Promise<Changeset> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const session = sessionIdMap.get(nativeSessionId);
  if (!session) throw new Error(`Session not found - nativeSessionId[${nativeSessionId}]`);

  return sqlite3.session_changeset(session.pointer);
}

async function sessionCreateInvertedChangeset(
  nativeDatabaseId: number,
  nativeSessionId: number
): Promise<Changeset> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  const session = sessionIdMap.get(nativeSessionId);
  if (!session) throw new Error(`Session not found - nativeSessionId[${nativeSessionId}]`);

  return sqlite3.session_changeset_inverted(session.pointer);
}

async function sessionApplyChangeset(
  nativeDatabaseId: number,
  nativeSessionId: number,
  changeset: Changeset
): Promise<void> {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);

  sqlite3.changeset_apply(dbEntity.pointer, changeset);
}

async function sessionInvertChangeset(
  nativeDatabaseId: number,
  nativeSessionId: number,
  changeset: Changeset
): Promise<Changeset> {
  const { sqlite3 } = await maybeInitAsync();
  return sqlite3.changeset_invert(changeset);
}

//#endregion Request handlers

//#region Internal helpers

function addUpdateHook(sqlite3: SQLiteAPI, dbEntity: DatabaseEntity) {
  sqlite3.update_hook(
    dbEntity.pointer,
    (updateType: number, dbName: string | null, tblName: string | null, rowId: bigint) => {
      const message: OnDatabaseChangeMessage = {
        type: 'onDatabaseChange',
        data: {
          databaseName: dbName,
          databaseFilePath: sqlite3.db_filename(dbEntity.pointer, dbName ?? 'main'),
          tableName: tblName,
          rowId: Number.isSafeInteger(rowId) ? rowId : Number(rowId),
          typeId: createSQLAction(updateType),
        },
      };
      self.postMessage(message);
    }
  );
}

function bindStatementParam(sqlite3: SQLiteAPI, stmt: StatementPointer, param: any, index: number) {
  if (param == null) {
    sqlite3.bind_null(stmt, index);
  } else if (typeof param === 'number') {
    if (Number.isInteger(param)) {
      if (param > MAX_INT32 || param < MIN_INT32) {
        sqlite3.bind_int64(stmt, index, BigInt(param));
      } else {
        sqlite3.bind_int(stmt, index, param);
      }
    } else {
      sqlite3.bind_double(stmt, index, param);
    }
  } else if (typeof param === 'string') {
    sqlite3.bind_text(stmt, index, param);
  } else if (param instanceof Uint8Array) {
    sqlite3.bind_blob(stmt, index, param);
  } else if (typeof param === 'boolean') {
    sqlite3.bind_int(stmt, index, param ? 1 : 0);
  } else {
    throw new Error(`Unsupported parameter type: ${typeof param}`);
  }
}

function findCachedDatabase(predicate: (entity: DatabaseEntity) => boolean): DatabaseEntity | null {
  for (const entity of databaseIdMap.values()) {
    if (predicate(entity)) {
      return entity;
    }
  }
  return null;
}

function getBindParamIndex(
  sqlite3: SQLiteAPI,
  stmt: StatementPointer,
  key: string,
  shouldPassAsArray: boolean
): number {
  let index: number;
  if (shouldPassAsArray) {
    const intKey = parseInt(key, 10);
    if (isNaN(intKey)) {
      throw new Error('Invalid bind parameter');
    }
    index = intKey + 1;
  } else {
    index = sqlite3.bind_parameter_index(stmt, key);
  }
  return index;
}

function getColumnValue(sqlite3: SQLiteAPI, stmt: StatementPointer, index: number): any {
  const type = sqlite3.column_type(stmt, index);
  let value: any;

  switch (type) {
    case SQLite.SQLITE_INTEGER: {
      value = sqlite3.column_int_safe(stmt, index);
      break;
    }
    case SQLite.SQLITE_FLOAT: {
      value = sqlite3.column_double(stmt, index);
      break;
    }
    case SQLite.SQLITE_TEXT: {
      value = sqlite3.column_text(stmt, index);
      break;
    }
    case SQLite.SQLITE_BLOB: {
      value = sqlite3.column_blob(stmt, index);
      break;
    }
    case SQLite.SQLITE_NULL: {
      value = null;
      break;
    }
    default: {
      throw new Error(`Unsupported column type: ${type}`);
    }
  }
  return value;
}

function getColumnValues(sqlite3: SQLiteAPI, stmt: StatementPointer): SQLiteColumnValues {
  const columnCount = sqlite3.column_count(stmt);
  const columnValues: SQLiteColumnValues = [];
  for (let i = 0; i < columnCount; i++) {
    columnValues[i] = getColumnValue(sqlite3, stmt, i);
  }
  return columnValues;
}

async function initDb(sqlite3: SQLiteAPI, dbEntity: DatabaseEntity) {
  if (dbEntity.openOptions.enableChangeListener) {
    addUpdateHook(sqlite3, dbEntity);
  }
}

async function maybeFinalizeAllStatements(nativeDatabaseId: number) {
  const { sqlite3 } = await maybeInitAsync();
  const dbEntity = databaseIdMap.get(nativeDatabaseId);
  if (!dbEntity) throw new Error(`Database not found - nativeDatabaseId[${nativeDatabaseId}]`);
  if (!dbEntity.openOptions.finalizeUnusedStatementsBeforeClosing) {
    return;
  }

  let error: Error | null = null;
  const finalizedStatements: StatementPointer[] = [];
  let stmt: StatementPointer | null = sqlite3.next_stmt(dbEntity.pointer, null);
  while (stmt != null && stmt !== 0) {
    const nextStmt: StatementPointer = sqlite3.next_stmt(dbEntity.pointer, stmt);
    try {
      sqlite3.finalize(stmt);
      finalizedStatements.push(stmt);
    } catch (e) {
      error = e;
    }
    stmt = nextStmt;
  }

  // Delete finalized statements from the map
  const statementsToDelete: number[] = [];
  for (const [nativeStatementId, stmtEntity] of statementIdMap.entries()) {
    if (finalizedStatements.includes(stmtEntity.pointer)) {
      statementsToDelete.push(nativeStatementId);
    }
  }
  for (const nativeStatementId of statementsToDelete) {
    statementIdMap.delete(nativeStatementId);
  }

  if (error) throw error;
}

async function maybeInitAsync(): Promise<{
  sqlite3: SQLiteAPI;
  vfs: AccessHandlePoolVFS;
  vfsMemory: MemoryVFS;
}> {
  if (!_sqlite3) {
    const module = await WaSQLiteFactory({
      locateFile: () => wasmModule,
    });
    _sqlite3 = SQLite.Factory(module) as SQLiteAPI;
    if (!_sqlite3) {
      throw new Error('Failed to initialize wa-sqlite');
    }

    if (_vfs == null) {
      _vfs = await AccessHandlePoolVFS.create(VFS_NAME_PERSISTENT, module);
      if (_vfs == null) {
        throw new Error('Failed to initialize AccessHandlePoolVFS');
      }
    }
    _sqlite3.vfs_register(_vfs, true);

    if (_vfsMemory == null) {
      _vfsMemory = await MemoryVFS.create(VFS_NAME_MEMORY, module);
      if (_vfsMemory == null) {
        throw new Error('Failed to initialize MemoryVFS');
      }
    }
    _sqlite3.vfs_register(_vfsMemory, false);
  }
  if (_vfs == null || _vfsMemory == null) {
    throw new Error('Invalid VFS state');
  }
  return { sqlite3: _sqlite3, vfs: _vfs, vfsMemory: _vfsMemory };
}

//#endregion Internal helpers
