export default {
    NativeDatabase(databaseName, appGroup, options, serializedData) {
        throw new Error('Unimplemented');
    },
    NativeStatement() {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(databaseName, appGroup) {
        throw new Error('Unimplemented');
    },
    deleteDatabaseSync(databaseName, appGroup) {
        throw new Error('Unimplemented');
    },
    importAssetDatabaseAsync(databaseName, appGroup, assetDatabasePath, forceOverwrite) {
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