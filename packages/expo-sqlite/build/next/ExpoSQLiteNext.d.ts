declare const _default: {
    readonly name: string;
    openDatabaseAsync(dbName: string, options?: unknown): Promise<number>;
    deleteDatabaseAsync(dbName: string): Promise<void>;
    isInTransaction(databaseId: number): boolean;
    isInTransactionAsync(databaseId: number): Promise<boolean>;
    closeDatabaseAsync(databaseId: number): Promise<void>;
    execAsync(databaseId: number, source: string): Promise<void>;
    prepareAsync(databaseId: number, source: string): Promise<number>;
    statementArrayRunAsync(databaseId: number, statementId: number, bindParams: any): Promise<any>;
    statementObjectRunAsync(databaseId: number, statementId: number, bindParams: any): Promise<any>;
    statementArrayGetAsync(databaseId: number, statementId: number, bindParams: any): Promise<any>;
    statementObjectGetAsync(databaseId: number, statementId: number, bindParams: any): Promise<any>;
    statementArrayGetAllAsync(databaseId: number, statementId: number, bindParams: any): Promise<any[]>;
    statementObjectGetAllAsync(databaseId: number, statementId: number, bindParams: any): Promise<any[]>;
    statementResetAsync(databaseId: number, statementId: number): Promise<void>;
    statementFinalizeAsync(databaseId: number, statementId: number): Promise<void>;
    addListener(): void;
    removeListeners(): void;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map