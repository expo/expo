import type { TurboModule } from 'react-native';
import { TurboModuleRegistry, NativeModules } from 'react-native';
import { Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

// Options stay `Object` (codegen → ReadableMap / NSDictionary).
// Narrowing here would force a coordinated change to both native module
// signatures.
export interface Spec extends TurboModule {
  releaseCapture: (uri: string) => void;
  captureRef: (target: WithDefault<number, -1>, withOptions: Object) => Promise<string>;
  captureScreen: (options: Object) => Promise<string>;
}

// In bridgeless mode (RN 0.79+) __turboModuleProxy is not set; use
// TurboModuleRegistry as primary and fall back to legacy NativeModules.
const RNViewShotModule = TurboModuleRegistry.get<Spec>('RNViewShot') ?? NativeModules.RNViewShot;

export default RNViewShotModule as Spec;
