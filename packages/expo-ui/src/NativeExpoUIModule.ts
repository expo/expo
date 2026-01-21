import { requireNativeModule } from 'expo';

import type { DummySharedObject } from './DummySharedObject';
import type { NativeStateString } from './NativeState/NativeStateString';

export type ExpoUIModuleType = {
  DummySharedObject: typeof DummySharedObject;
  NativeStateString: typeof NativeStateString;
  completeRefresh(id: string): Promise<void>;
};

export default requireNativeModule<ExpoUIModuleType>('ExpoUI');
