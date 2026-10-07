import { TurboModuleRegistry, NativeModules } from "react-native";
// In bridgeless mode (RN 0.79+) __turboModuleProxy is not set; use
// TurboModuleRegistry as primary and fall back to legacy NativeModules.
const RNViewShotModule = TurboModuleRegistry.get("RNViewShot") ?? NativeModules.RNViewShot;
export default RNViewShotModule;
//# sourceMappingURL=NativeRNViewShot.js.map