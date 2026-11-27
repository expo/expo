import { NativeModule, requireOptionalNativeModule } from 'expo';

/** Which Observe data is stored on the device. */
export type StoredData = {
  databaseExists: boolean;
  legacyStoreExists: boolean;
  crashFileCount: number;
  pendingErrorFileCount: number;
  installationIdStored: boolean;
  /** Sorted, comma-separated keys of the settings suite, or `none`. */
  appMetricsSettingsKeys: string;
  appMetricsSettingsFileExists: boolean;
  observeSettingsKeys: string;
  observeSettingsFileExists: boolean;
};

declare class StorageInspectorModule extends NativeModule {
  /** Reads the stored data without creating any of it. Test-only, absent on web. */
  inspect(): StoredData;
}

export default requireOptionalNativeModule<StorageInspectorModule>('StorageInspector');
