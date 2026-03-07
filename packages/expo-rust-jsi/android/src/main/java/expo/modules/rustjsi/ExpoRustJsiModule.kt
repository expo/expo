package expo.modules.rustjsi

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module that loads and initializes Rust-based JSI modules.
 *
 * This module acts as a bridge: it loads the native shared library containing
 * both the C++ shim and the Rust static library, then calls into Rust to
 * install modules directly onto the JSI runtime.
 *
 * The Rust modules register themselves into `expo.modules[name]` just like
 * Kotlin/Swift modules do, so they're accessible via `requireNativeModule()`.
 */
class ExpoRustJsiModule : Module() {
    companion object {
        init {
            System.loadLibrary("expo-rust-jsi")
        }
    }

    override fun definition() = ModuleDefinition {
        Name("ExpoRustJsi")

        OnCreate {
            val runtime = appContext.runtime
            if (runtime != null) {
                nativeInstall(runtime.rawPointer)
            }
        }
    }

    private external fun nativeInstall(jsiRuntimePtr: Long)
}
