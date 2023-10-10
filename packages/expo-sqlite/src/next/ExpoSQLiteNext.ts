export default {
  get name(): string {
    return 'ExpoSQLiteNext';
  },

  async openDatabaseAsync(dbName: string, options?: unknown): Promise<number> {
    throw new Error('Unimplemented');
  },

  async deleteDatabaseAsync(dbName: string): Promise<void> {
    throw new Error('Unimplemented');
  },

  isInTransaction(databaseId: number): boolean {
    throw new Error('Unimplemented');
  },

  async isInTransactionAsync(databaseId: number): Promise<boolean> {
    throw new Error('Unimplemented');
  },

  async closeDatabaseAsync(databaseId: number): Promise<void> {
    throw new Error('Unimplemented');
  },

  async execAsync(databaseId: number, source: string): Promise<void> {
    throw new Error('Unimplemented');
  },

  async prepareAsync(databaseId: number, source: string): Promise<number> {
    throw new Error('Unimplemented');
  },

  async statementArrayRunAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any> {
    throw new Error('Unimplemented');
  },

  async statementObjectRunAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any> {
    throw new Error('Unimplemented');
  },

  async statementArrayGetAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any> {
    throw new Error('Unimplemented');
  },

  async statementObjectGetAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any> {
    throw new Error('Unimplemented');
  },

  async statementArrayGetAllAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any[]> {
    throw new Error('Unimplemented');
  },

  async statementObjectGetAllAsync(
    databaseId: number,
    statementId: number,
    bindParams: any
  ): Promise<any[]> {
    throw new Error('Unimplemented');
  },

  async statementResetAsync(databaseId: number, statementId: number): Promise<void> {
    throw new Error('Unimplemented');
  },

  async statementFinalizeAsync(databaseId: number, statementId: number): Promise<void> {
    throw new Error('Unimplemented');
  },

  //#region EventEmitter implementations

  addListener() {},
  removeListeners() {},

  //#endregion
};
