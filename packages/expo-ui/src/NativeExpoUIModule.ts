import { requireNativeModule } from 'expo';

import type { DummySharedObject } from './DummySharedObject';

export type ExpoUIModuleType = {
  DummySharedObject: typeof DummySharedObject;
  completeRefresh(id: string): Promise<void>;
};

export default requireNativeModule<ExpoUIModuleType>('ExpoUI');
