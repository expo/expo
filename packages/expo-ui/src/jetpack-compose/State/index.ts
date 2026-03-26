export { installOnUIRuntime } from 'expo';

/**
 * Extracts the native shared object ID from a SharedObject instance.
 * Used internally to pass SharedObject references as view props.
 */
export function getStateId(state?: object): number | undefined {
  if (!state) {
    return undefined;
  }
  return (state as { __expo_shared_object_id__?: number }).__expo_shared_object_id__;
}

/**
 * Registers a custom serializer with react-native-worklets so that
 * SharedObject instances can cross the JS/worklet boundary by ID.
 *
 * `pack` sends only the integer ID; `unpack` calls the C++ resolver
 * installed by WorkletRuntimeInstaller to reconstruct a proxy with
 * property getters/setters on the worklet side.
 */
export function registerSharedObjectSerializer(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { registerCustomSerializable } = require('react-native-worklets');
    registerCustomSerializable({
      name: 'ExpoSharedObject',
      determine(value: object): value is { __expo_shared_object_id__: number } {
        'worklet';
        return '__expo_shared_object_id__' in value;
      },
      pack(value: { __expo_shared_object_id__: number }) {
        'worklet';
        return { id: value.__expo_shared_object_id__ };
      },
      unpack(packed: { id: number }) {
        'worklet';
        // @ts-expect-error — global.expo is set up by WorkletRuntimeInstaller
        return global.expo.SharedObject.__resolveInWorklet(packed.id);
      },
    });
  } catch {
    // react-native-worklets may not be installed.
  }
}
