import { requireNativeModule } from 'expo-modules-core';

/**
 * ExpoRustJsi is the loader module. Importing it triggers the installation
 * of all Rust-defined modules onto the JSI runtime. After that, individual
 * Rust modules are available via requireNativeModule().
 */
const ExpoRustJsi = requireNativeModule('ExpoRustJsi');

export default ExpoRustJsi;

// Re-export typed Rust modules for convenient usage
export { RustMath } from './RustMath';
export { RustString } from './RustString';
