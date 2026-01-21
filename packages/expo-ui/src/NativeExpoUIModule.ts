import { requireNativeModule } from 'expo';

import type { DummySharedObject } from './DummySharedObject';
import type { NativeStateString, NativeStateDouble, NativeStateBool } from './NativeState';

export type ExpoUIModuleType = {
  DummySharedObject: typeof DummySharedObject;
  NativeStateString: typeof NativeStateString;
  NativeStateDouble: typeof NativeStateDouble;
  NativeStateBool: typeof NativeStateBool;
  completeRefresh(id: string): Promise<void>;
};

export default requireNativeModule<ExpoUIModuleType>('ExpoUI');
