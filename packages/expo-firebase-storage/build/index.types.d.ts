import StorageStatics from './statics';
export declare type Storage = any;
export declare type StorageReference = any;
export declare type StorageTask = any;
export declare type UploadTaskSnapshotType = {
    bytesTransferred: number;
    downloadURL: string | null;
    metadata: any;
    ref: StorageReference;
    state: typeof StorageStatics.TaskState.RUNNING | typeof StorageStatics.TaskState.PAUSED | typeof StorageStatics.TaskState.SUCCESS | typeof StorageStatics.TaskState.CANCELLED | typeof StorageStatics.TaskState.ERROR;
    task: StorageTask;
    totalBytes: number;
};
export declare type FuncSnapshotType = null | ((snapshot: UploadTaskSnapshotType) => any);
export declare type FuncErrorType = null | ((error: Error) => any);
export declare type NextOrObserverType = null | {
    next?: FuncSnapshotType;
    error?: FuncErrorType;
    complete?: FuncSnapshotType;
} | FuncSnapshotType;
