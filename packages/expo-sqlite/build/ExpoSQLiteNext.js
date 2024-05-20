export default {
    NativeDatabase(databaseName, options, serializedData) {
        throw new Error('Unimplemented');
    },
    NativeStatement() {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(databaseName) {
        throw new Error('Unimplemented');
    },
    deleteDatabaseSync(databaseName) {
        throw new Error('Unimplemented');
    },
    importAssetDatabaseAsync(databaseName, assetDatabasePath, forceOverwrite) {
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