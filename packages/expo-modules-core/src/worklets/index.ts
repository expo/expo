import Platform from '../Platform';
import type { SharedObject } from '../SharedObject';

type PackedSharedObject = { objectId: number };

let isSharedObjectSerializerRegistered = false;

/**
 * Registers a custom serializable of `react-native-worklets` for shared objects, so a worklet can capture them.
 * A worklet gets the JS object of the same native object in its own runtime.
 */
function registerSharedObjectSerializer() {
  if (isSharedObjectSerializerRegistered) {
    return;
  }
  let worklets: typeof import('react-native-worklets');
  try {
    worklets = require('react-native-worklets');
  } catch {
    // `react-native-worklets` is an optional peer dependency.
    return;
  }
  isSharedObjectSerializerRegistered = true;

  worklets.registerCustomSerializable<SharedObject, PackedSharedObject>({
    name: 'ExpoSharedObject',
    determine: (value): value is SharedObject => {
      'worklet';
      return (
        value instanceof (globalThis as any).expo.SharedObject &&
        (value as any).__expo_shared_object_id__ !== 0
      );
    },
    pack: (value) => {
      'worklet';
      return { objectId: (value as any).__expo_shared_object_id__ };
    },
    unpack: (packed) => {
      'worklet';
      return (globalThis as any).expo.SharedObject.__resolveInWorklet(packed.objectId);
    },
  });
}

/**
 * Installs Expo Modules on the UI worklet runtime so worklet callbacks and
 * serializable SharedObjects work there.
 *
 * @param uiRuntimeHolder The UI runtime holder from `getUIRuntimeHolder()` in
 * `react-native-worklets`.
 */
export function installOnUIRuntime(uiRuntimeHolder: object) {
  const installOnUIRuntimeNative = globalThis?.expo?.installOnUIRuntime;
  if (!installOnUIRuntimeNative) {
    throw Error(
      "Native method to install Expo Modules on the worklets UI runtime wasn't found in `expo-modules-core`."
    );
  }

  installOnUIRuntimeNative(uiRuntimeHolder);

  // TODO: Register it on Android too, once its shared objects have the members that `@expo/ui` defines in its
  // serializer today.
  if (Platform.OS === 'ios') {
    registerSharedObjectSerializer();
  }
}
