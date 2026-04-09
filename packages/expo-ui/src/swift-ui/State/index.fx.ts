// Side effect file to load shared object support in worklets

import { installOnUIRuntime } from 'expo';

import { worklets } from './optionalWorklets';

type NativeSharedObject = { __expo_shared_object_id__: number };
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

  registerCustomSerializable<NativeSharedObject, PackedSharedObject>({
    name: 'ExpoSharedObject',
    determine: (value): value is NativeSharedObject => {
      'worklet';
      return (
        value != null &&
        typeof value === 'object' &&
        '__expo_shared_object_id__' in value &&
        (value as any).__expo_shared_object_id__ !== 0
      );
    },
    pack: (value) => {
      'worklet';
      return { objectId: value.__expo_shared_object_id__ };
    },
    unpack: (packed) => {
      'worklet';
      const obj = (globalThis as any).expo.SharedObject.__resolveInWorklet(packed.objectId);
      // Define .value property if the object has getValue/setValue (e.g. ObservableState)
      if (typeof obj.getValue === 'function' && typeof obj.setValue === 'function') {
        Object.defineProperty(obj, 'value', {
          get() {
            return obj.getValue();
          },
          set(v: any) {
            obj.setValue({ value: v });
          },
        });
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
