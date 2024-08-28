import type { SQLiteOpenOptions, IOSOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';

export default {
  NativeDatabase(
    databaseName: string,
    iosOptions?: IOSOptions,
    options?: SQLiteOpenOptions,
    serializedData?: Uint8Array
  ): void {
    throw new Error('Unimplemented');
  },

  NativeStatement(): void {
    throw new Error('Unimplemented');
  },

  async deleteDatabaseAsync(databaseName: string, iosOptions: IOSOptions): Promise<void> {
    throw new Error('Unimplemented');
  },

  deleteDatabaseSync(databaseName: string, iosOptions: IOSOptions): void {
    throw new Error('Unimplemented');
  },

  importAssetDatabaseAsync(
    databaseName: string,
    iosOptions: IOSOptions,
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
