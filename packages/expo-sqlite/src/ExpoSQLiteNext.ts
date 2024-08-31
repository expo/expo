import type { SQLiteOpenOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';

export default {
  NativeDatabase(
    databasePath: string,
    options?: SQLiteOpenOptions,
    serializedData?: Uint8Array
  ): void {
    throw new Error('Unimplemented');
  },

  async ensureHasAccessAsync(databasePath: string): Promise<void> {
    throw new Error('Unimplemented');
  },

  ensureHasAccessSync(databasePath: string): void {
    throw new Error('Unimplemented');
  },

  NativeStatement(): void {
    throw new Error('Unimplemented');
  },

  async deleteDatabaseAsync(databaseName: string, directory?: string): Promise<void> {
    throw new Error('Unimplemented');
  },

  deleteDatabaseSync(databaseName: string, directory?: string): void {
    throw new Error('Unimplemented');
  },

  importAssetDatabaseAsync(
    databasePath: string,
    assetDatabasePath: string,
    forceOverwrite: boolean
  ): Promise<void> {
    throw new Error('Unimplemented');
  },

  //#region EventEmitter implementations

  addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void) {
    throw new Error('Unimplemented');
  },
  removeListeners() {
    throw new Error('Unimplemented');
  },

  //#endregion
};
