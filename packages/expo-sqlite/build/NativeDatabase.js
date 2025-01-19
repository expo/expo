/**
 * Flattens the SQLiteOpenOptions that are passed to the native module.
 */
export function flattenOpenOptions(options) {
    const { libSQLOptions, ...restOptions } = options;
    const result = {
        ...restOptions,
    };
    if (libSQLOptions) {
        Object.assign(result, {
            libSQLUrl: libSQLOptions.url,
            libSQLAuthToken: libSQLOptions.authToken,
            libSQLRemoteOnly: libSQLOptions.remoteOnly,
            libSQLSyncInterval: libSQLOptions.syncInterval,
        });
    }
    return result;
}
//# sourceMappingURL=NativeDatabase.js.map