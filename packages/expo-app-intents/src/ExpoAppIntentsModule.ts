import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

import type {
  AppIntentDonationFilter,
  AppIntentEntity,
  AppIntentInvocation,
  AppIntentJSONValue,
  ExpoAppIntentsModuleEvents,
} from './ExpoAppIntents.types';

declare class ExpoAppIntentsNativeModule extends NativeModule<ExpoAppIntentsModuleEvents> {
  getPendingInvocationsAsync(): Promise<AppIntentInvocation[]>;
  removePendingInvocationAsync(id: string): Promise<void>;
  clearPendingInvocationsAsync(): Promise<void>;
  setEntityCatalogAsync(kind: string, entities: AppIntentEntity[]): Promise<void>;
  reindexEntitiesAsync(kind: string | null): Promise<void>;
  getEntityCatalogAsync(kind: string): Promise<AppIntentEntity[]>;
  refreshShortcutsAsync(): Promise<void>;
  donateIntentAsync(name: string, params?: Record<string, AppIntentJSONValue>): Promise<string>;
  deleteDonationsAsync(filter: AppIntentDonationFilter): Promise<string[]>;
}

export default requireOptionalNativeModule<ExpoAppIntentsNativeModule>('ExpoAppIntents');
