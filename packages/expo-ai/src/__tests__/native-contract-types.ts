import type { NativeModule, SharedObject } from 'expo';

// Compile-only checks for the JS<->native contract. Jest does not execute this file.
import type {
  NativeLanguageModels,
  NativeModuleEvents,
  NativeSession,
  NativeSessionEvents,
} from '../NativeLanguageModels.types';

export function checkNativeContract(
  session: NativeSession,
  models: NativeLanguageModels
): {
  sharedSession: InstanceType<SharedObject<NativeSessionEvents>>;
  nativeModels: InstanceType<NativeModule<NativeModuleEvents>>;
} {
  return { sharedSession: session, nativeModels: models };
}
