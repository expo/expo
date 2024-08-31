export default {
    NativeDatabase(databaseName, directory, options, serializedData) {
        throw new Error('Unimplemented');
    },
    async ensureHasAccessAsync(databaseName, directory) {
        throw new Error('Unimplemented');
    },
    ensureHasAccessSync(databaseName, directory) {
        throw new Error('Unimplemented');
    },
    NativeStatement() {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(databaseName, directory) {
        throw new Error('Unimplemented');
    },
    deleteDatabaseSync(databaseName, directory) {
        throw new Error('Unimplemented');
    },
    importAssetDatabaseAsync(databaseName, directory, assetDatabasePath, forceOverwrite) {
        throw new Error('Unimplemented');
    },
    //#region EventEmitter implementations
    addListener(eventName, listener) {
        throw new Error('Unimplemented');
    },
    removeListeners() {
        throw new Error('Unimplemented');
    },
    //#endregion
};
//# sourceMappingURL=ExpoSQLiteNext.js.map