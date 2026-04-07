import * as __fbWatchman from 'fb-watchman';

declare module 'fb-watchman' {
  /** Information about a changed file */
  export interface FileChange {
    // See: https://github.com/facebook/metro/blob/6a63a34/flow-typed/fb-watchman.js#L77-L97
    dev?: number;
    cclock?: string;
    gid?: number;
    ino?: number;
    mode?: number;
    mtime?: number;
    mtime_us?: number;
    mtime_ns?: number;
    mtime_f?: number;
    new?: boolean;
    nlink?: number;
    uid?: number;
    'content.sha1hex'?: string;
    symlink_target?: string;
  }
}
