export default {
    get name() {
        return 'ExpoSQLiteNext';
    },
    NativeDatabase(dbName, options) {
        throw new Error('Unimplemented');
    },
    NativeStatement() {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(dbName) {
        throw new Error('Unimplemented');
    },
    deleteDatabaseSync(dbName) {
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