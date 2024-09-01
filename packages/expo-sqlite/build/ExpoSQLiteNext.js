export default {
    NativeDatabase(databasePath, options, serializedData) {
        throw new Error('Unimplemented');
    },
    async ensureDatabasePathExistsAsync(databasePath) {
        throw new Error('Unimplemented');
    },
    ensureDatabasePathExistsSync(databasePath) {
        throw new Error('Unimplemented');
    },
    NativeStatement() {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(databasePath) {
        throw new Error('Unimplemented');
    },
    deleteDatabaseSync(databasePath) {
        throw new Error('Unimplemented');
    },
    importAssetDatabaseAsync(databasePath, assetDatabasePath, forceOverwrite) {
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