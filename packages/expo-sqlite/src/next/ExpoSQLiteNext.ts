import { SQLiteOpenOptions } from './NativeDatabase';

export default {
  get name(): string {
    return 'ExpoSQLiteNext';
  },

  NativeDatabase(
    databaseName: string,
    options?: SQLiteOpenOptions,
    serializedData?: Uint8Array
  ): void {
    throw new Error('Unimplemented');
  },

  NativeStatement(): void {
    throw new Error('Unimplemented');
  },

  async deleteDatabaseAsync(databaseName: string): Promise<void> {
    throw new Error('Unimplemented');
  },

  deleteDatabaseSync(databaseName: string): void {
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
