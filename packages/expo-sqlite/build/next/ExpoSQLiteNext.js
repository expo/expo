export default {
    get name() {
        return 'ExpoSQLiteNext';
    },
    async openDatabaseAsync(dbName, options) {
        throw new Error('Unimplemented');
    },
    async deleteDatabaseAsync(dbName) {
        throw new Error('Unimplemented');
    },
    isInTransaction(databaseId) {
        throw new Error('Unimplemented');
    },
    async isInTransactionAsync(databaseId) {
        throw new Error('Unimplemented');
    },
    async closeDatabaseAsync(databaseId) {
        throw new Error('Unimplemented');
    },
    async execAsync(databaseId, source) {
        throw new Error('Unimplemented');
    },
    async prepareAsync(databaseId, source) {
        throw new Error('Unimplemented');
    },
    async statementArrayRunAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementObjectRunAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementArrayGetAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementObjectGetAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementArrayGetAllAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementObjectGetAllAsync(databaseId, statementId, bindParams) {
        throw new Error('Unimplemented');
    },
    async statementResetAsync(databaseId, statementId) {
        throw new Error('Unimplemented');
    },
    async statementFinalizeAsync(databaseId, statementId) {
        throw new Error('Unimplemented');
    },
    //#region EventEmitter implementations
    addListener() { },
    removeListeners() { },
    //#endregion
};
//# sourceMappingURL=ExpoSQLiteNext.js.map