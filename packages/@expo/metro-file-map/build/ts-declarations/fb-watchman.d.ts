declare module 'fb-watchman' {
    /** Information about a changed file */
    interface FileChange {
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
export {};
