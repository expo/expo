import ExpoModulesCore

/// Expo module that loads and initializes Rust-based JSI modules on iOS.
///
/// This module calls into the Rust static library via the C++ shim to install
/// Rust modules directly onto the JSI runtime.
public class ExpoRustJsiModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoRustJsi")

        OnCreate {
            guard let runtime = try? self.appContext?.runtime else {
                return
            }
            // The runtime pointer is passed to the Rust init function
            // which registers all Rust modules onto expo.modules
            let runtimePtr = runtime.unsafePointer()
            expo_rust_jsi_install(runtimePtr)
        }
    }
}
