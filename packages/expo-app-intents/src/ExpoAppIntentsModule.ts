import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

import type {
  AppIntentEntity,
  AppIntentInvocation,
  ExpoAppIntentsModuleEvents,
} from './ExpoAppIntents.types';

declare class ExpoAppIntentsNativeModule extends NativeModule<ExpoAppIntentsModuleEvents> {
  getPendingInvocationsAsync(): Promise<AppIntentInvocation[]>;
  removePendingInvocationAsync(id: string): Promise<void>;
  clearPendingInvocationsAsync(): Promise<void>;
  setEntityCatalogAsync(kind: string, entities: AppIntentEntity[]): Promise<void>;
  getEntityCatalogAsync(kind: string): Promise<AppIntentEntity[]>;
  refreshShortcutsAsync(): Promise<void>;
}

export default requireOptionalNativeModule<ExpoAppIntentsNativeModule>('ExpoAppIntents');
