// Side effect file to load shared object support in worklets

import { installOnUIRuntime } from 'expo';

import { worklets } from './optionalWorklets';
import {
  EXPO_SHARED_OBJECT_ID_KEY,
  isExpoUISharedObject,
  type ExpoUISharedObject,
} from './sharedObjectBrand';

type PackedSharedObject = { objectId: number };

let _serializerRegistered = false;
/**
 * Registers a custom serializer so SharedObjects automatically work in worklets.
 * Call it after `installOnUIRuntime()`.
 */
function registerSharedObjectSerializer(): void {
  if (_serializerRegistered) {
    return;
  }

  if (!worklets) {
    return;
  }
  _serializerRegistered = true;

  const { registerCustomSerializable } = worklets;

  registerCustomSerializable<ExpoUISharedObject, PackedSharedObject>({
    name: 'ExpoSharedObject',
    determine: (value): value is ExpoUISharedObject => {
      'worklet';
      return isExpoUISharedObject(value);
    },
    pack: (value) => {
      'worklet';
      return { objectId: value[EXPO_SHARED_OBJECT_ID_KEY] };
    },
    unpack: (packed) => {
      'worklet';
      const obj = (globalThis as any).expo.SharedObject.__resolveInWorklet(packed.objectId);
      // Define .value plus the get/set accessors if the object has
      // getValue/setValue (e.g. ObservableState)
      if (typeof obj.getValue === 'function' && typeof obj.setValue === 'function') {
        Object.defineProperty(obj, 'value', {
          get() {
            return obj.getValue();
          },
          set(v: any) {
            obj.setValue({ value: v });
          },
        });
        obj.get = () => obj.getValue();
        obj.set = (v: any) => obj.setValue({ value: v });
      }
      return obj;
    },
  });
}

try {
  // reanimated import is needed to initialise __WORKLET_RUNTIME global, which is required by the installOnUIRuntime
  require('react-native-reanimated');

  installOnUIRuntime();
  registerSharedObjectSerializer();
} catch {
  // Fail silently as worklet support is currently optional in Expo UI
}
