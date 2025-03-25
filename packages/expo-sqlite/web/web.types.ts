// Copyright 2015-present 650 Industries. All rights reserved.

import { type SQLAction } from './SQLAction';
import { type SQLiteOpenOptions } from '../src/NativeDatabase';
import { type Changeset } from '../src/NativeSession';
import {
  type SQLiteBindBlobParams,
  type SQLiteBindPrimitiveParams,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
} from '../src/NativeStatement';

export interface SyncWorkerMessage {
  id: number;
  isSync: true;
  lockBuffer: SharedArrayBuffer;
  resultBuffer: SharedArrayBuffer;
}

export interface AsyncWorkerMessage {
  id: number;
  isSync: false;
}

export type BaseWorkerMessage = SyncWorkerMessage | AsyncWorkerMessage;

//#region Request messages

export interface MessageTypeMap {
  backupDatabase: BackupDatabaseMessage;
  close: CloseMessage;
  deleteDatabase: DeleteDatabaseMessage;
  exec: ExecMessage;
  finalize: FinalizeMessage;
  getAll: GetAllMessage;
  getColumnNames: GetColumnNamesMessage;
  importAssetDatabase: ImportAssetDatabaseMessage;
  isInTransaction: IsInTransactionMessage;
  open: OpenMessage;
  prepare: PrepareMessage;
  reset: ResetMessage;
  run: RunMessage;
  serialize: SerializeMessage;
  step: StepMessage;
  sessionCreate: SessionCreateMessage;
  sessionAttach: SessionAttachMessage;
  sessionEnable: SessionEnableMessage;
  sessionClose: SessionCloseMessage;
  sessionCreateChangeset: SessionCreateChangesetMessage;
  sessionCreateInvertedChangeset: SessionCreateInvertedChangesetMessage;
  sessionApplyChangeset: SessionApplyChangesetMessage;
  sessionInvertChangeset: SessionInvertChangesetMessage;
}

export type SQLiteWorkerMessageType = keyof MessageTypeMap;

export type SQLiteWorkerMessage = MessageTypeMap[SQLiteWorkerMessageType];

type BackupDatabaseMessage = BaseWorkerMessage & {
  type: 'backupDatabase';
  data: {
    destNativeDatabaseId: number;
    destDatabaseName: string;
    sourceNativeDatabaseId: number;
    sourceDatabaseName: string;
  };
};

type CloseMessage = BaseWorkerMessage & {
  type: 'close';
  data: {
    nativeDatabaseId: number;
  };
};

type DeleteDatabaseMessage = BaseWorkerMessage & {
  type: 'deleteDatabase';
  data: {
    databasePath: string;
  };
};

type ExecMessage = BaseWorkerMessage & {
  type: 'exec';
  data: {
    nativeDatabaseId: number;
    source: string;
  };
};

type FinalizeMessage = BaseWorkerMessage & {
  type: 'finalize';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
  };
};

type GetAllMessage = BaseWorkerMessage & {
  type: 'getAll';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
  };
};

type GetColumnNamesMessage = BaseWorkerMessage & {
  type: 'getColumnNames';
  data: {
    nativeStatementId: number;
  };
};

type ImportAssetDatabaseMessage = BaseWorkerMessage & {
  type: 'importAssetDatabase';
  data: {
    databasePath: string;
    assetDatabasePath: string;
    forceOverwrite: boolean;
  };
};

type IsInTransactionMessage = BaseWorkerMessage & {
  type: 'isInTransaction';
  data: {
    nativeDatabaseId: number;
  };
};

type OpenMessage = BaseWorkerMessage & {
  type: 'open';
  data: {
    nativeDatabaseId: number;
    databasePath: string;
    options: SQLiteOpenOptions;
    serializedData?: Uint8Array;
  };
};

type PrepareMessage = BaseWorkerMessage & {
  type: 'prepare';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
    source: string;
  };
};

type ResetMessage = BaseWorkerMessage & {
  type: 'reset';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
  };
};

type RunMessage = BaseWorkerMessage & {
  type: 'run';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
    bindParams: SQLiteBindPrimitiveParams;
    bindBlobParams: SQLiteBindBlobParams;
    shouldPassAsArray: boolean;
  };
};

type SerializeMessage = BaseWorkerMessage & {
  type: 'serialize';
  data: {
    nativeDatabaseId: number;
    schemaName: string;
  };
};

type StepMessage = BaseWorkerMessage & {
  type: 'step';
  data: {
    nativeDatabaseId: number;
    nativeStatementId: number;
  };
};

type SessionCreateMessage = BaseWorkerMessage & {
  type: 'sessionCreate';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
    dbName: string;
  };
};

type SessionAttachMessage = BaseWorkerMessage & {
  type: 'sessionAttach';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
    table: string | null;
  };
};

type SessionEnableMessage = BaseWorkerMessage & {
  type: 'sessionEnable';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
    enabled: boolean;
  };
};

type SessionCloseMessage = BaseWorkerMessage & {
  type: 'sessionClose';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
  };
};

type SessionCreateChangesetMessage = BaseWorkerMessage & {
  type: 'sessionCreateChangeset';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
  };
};

type SessionCreateInvertedChangesetMessage = BaseWorkerMessage & {
  type: 'sessionCreateInvertedChangeset';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
  };
};

type SessionApplyChangesetMessage = BaseWorkerMessage & {
  type: 'sessionApplyChangeset';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
    changeset: Changeset;
  };
};

type SessionInvertChangesetMessage = BaseWorkerMessage & {
  type: 'sessionInvertChangeset';
  data: {
    nativeDatabaseId: number;
    nativeSessionId: number;
    changeset: Changeset;
  };
};

//#endregion Request messages

//#region Response messages

interface RunResult {
  lastInsertRowId: number;
  changes: number;
  firstRowValues: SQLiteColumnValues;
}

export interface ResultTypeMap {
  open: void;
  isInTransaction: boolean;
  close: void;
  exec: void;
  importAssetDatabase: void;
  prepare: void;
  run: RunResult;
  step: SQLiteColumnValues | null;
  getAll: SQLiteColumnValues[];
  reset: void;
  getColumnNames: SQLiteColumnNames;
  finalize: void;
  deleteDatabase: void;
  backupDatabase: void;
  serialize: Uint8Array;
  sessionCreate: void;
  sessionAttach: void;
  sessionEnable: void;
  sessionClose: void;
  sessionCreateChangeset: Changeset;
  sessionCreateInvertedChangeset: Changeset;
  sessionApplyChangeset: void;
  sessionInvertChangeset: Changeset;
}

export type ResultType = ResultTypeMap[keyof ResultTypeMap];

export type SQLiteWorkerResponse = {
  id: number;
  result?: ResultType;
  error?: Error;
};

//#endregion Response messages

//#region Continuous events

export interface OnDatabaseChangeMessage {
  type: 'onDatabaseChange';
  data: {
    databaseName: string | null;
    databaseFilePath: string | null;
    tableName: string | null;
    rowId: number | bigint;
    typeId: SQLAction;
  };
}

//#endregion Continuous events
