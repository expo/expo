import { requireNativeModule } from 'expo-modules-core';

/**
 * The ExpoRustJsi module is a loader module. When it initializes,
 * it installs all Rust-defined modules onto the JSI runtime.
 *
 * After this module loads, Rust modules are available via:
 * ```ts
 * import { requireNativeModule } from 'expo-modules-core';
 * const RustMath = requireNativeModule('RustMath');
 * ```
 */
const ExpoRustJsi = requireNativeModule('ExpoRustJsi');

export default ExpoRustJsi;
