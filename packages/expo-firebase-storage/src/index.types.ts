import StorageStatics from './statics';

export type Storage = any;

export type StorageReference = any;

export type StorageTask = any;

export type UploadTaskSnapshotType = {
  bytesTransferred: number;
  downloadURL: string | null;
  metadata: any; // TODO flow type def for https://firebase.google.com/docs/reference/js/firebase.storage.FullMetadata.html
  ref: StorageReference;
  state:
    | typeof StorageStatics.TaskState.RUNNING
    | typeof StorageStatics.TaskState.PAUSED
    | typeof StorageStatics.TaskState.SUCCESS
    | typeof StorageStatics.TaskState.CANCELLED
    | typeof StorageStatics.TaskState.ERROR;
  task: StorageTask;
  totalBytes: number;
};

export type FuncSnapshotType = null | ((snapshot: UploadTaskSnapshotType) => any);

export type FuncErrorType = null | ((error: Error) => any);

export type NextOrObserverType =
  | null
  | {
      next?: FuncSnapshotType;
      error?: FuncErrorType;
      complete?: FuncSnapshotType;
    }
  | FuncSnapshotType;
