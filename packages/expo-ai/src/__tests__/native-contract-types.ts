// Compile-only checks for the JS<->native contract. Jest does not execute this file.
import type { NativeModule, SharedObject } from 'expo';

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
  // The `NativeModule` type alias drops its events map; `typeof` reaches the class it aliases,
  // so this also checks which map the module is wired to. The map is only comparable through
  // `EventEmitter._TEventsMap_DONT_USE_IT`; if that phantom ever goes away, this line stops biting.
  nativeModels: InstanceType<typeof NativeModule<NativeModuleEvents>>;
} {
  return { sharedSession: session, nativeModels: models };
}
