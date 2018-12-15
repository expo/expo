// @flow

export type Storage = object;

export type StorageReference = object;

export type StorageTask = object;

export type UploadTaskSnapshotType = {
  bytesTransferred: number,
  downloadURL: string | null,
  metadata: Object, // TODO flow type def for https://firebase.google.com/docs/reference/js/firebase.storage.FullMetadata.html
  ref: StorageReference,
  state:
    | typeof StorageStatics.TaskState.RUNNING
    | typeof StorageStatics.TaskState.PAUSED
    | typeof StorageStatics.TaskState.SUCCESS
    | typeof StorageStatics.TaskState.CANCELLED
    | typeof StorageStatics.TaskState.ERROR,
  task: StorageTask,
  totalBytes: number,
};

export type FuncSnapshotType = null | ((snapshot: UploadTaskSnapshotType) => any);

export type FuncErrorType = null | ((error: Error) => any);

export type NextOrObserverType =
  | null
  | {
      next?: FuncSnapshotType,
      error?: FuncErrorType,
      complete?: FuncSnapshotType,
    }
  | FuncSnapshotType;
