export default {
    get name() {
        return 'ExpoSQLiteNext';
    },
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
    //#region EventEmitter implementations
    addListener() {
        throw new Error('Unimplemented');
    },
    removeListeners() {
        throw new Error('Unimplemented');
    },
    //#endregion
};
//# sourceMappingURL=ExpoSQLiteNext.js.map