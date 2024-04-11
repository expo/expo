import type { EventEmitter } from './EventEmitter';
import type { NativeModule } from './NativeModule';
import type { SharedObject } from './SharedObject';
declare global {
    /**
     * Type definitions for the native modules that are installed in Apple runtime environments.
     *
     * ---
     * **TypeScript types**: The TypeScript types for the Apple native module.
     * ```ts
     * declare global {
     *   namespace AppleRuntime {
     *     interface NativeAppIcon {
     *       // Constants
     *       isSupported: boolean;
     *
     *       // Methods
     *       setAlternateIcon: (iconName: string | null) => Promise<string | null>;
     *     }
     *   }
     * }
     * ```
     * ---
     * **Swift module**: The module definition for the native module.
     * ```swift
     * import ExpoModulesCore
     *
     * public class NativeAppIconModule: Module {
     *     public func definition() -> ModuleDefinition {
     *         // Sets the name of the module in the global `expo.modules` object
     *         Name("NativeAppIcon")
     *
     *        // Constants
     *         Constants([
     *             "isSupported": UIApplication.shared.supportsAlternateIcons
     *         ])
     *
     *         // Methods
     *         AsyncFunction("setAlternateIcon") { (name: String?, promise: Promise) in
     *             // ...
     *         }
     *     }
     * }
     * ```
     */
    namespace AppleRuntime { }
    /**
     * Type definitions for the native modules that are installed in Android runtime environments.
     *
     * ---
     * **TypeScript types**: The TypeScript types for the Android native module.
     * ```ts
     * declare global {
     *   namespace AndroidRuntime {
     *     interface NativeAppIcon {
     *       // Constants
     *       isSupported: boolean;
     *
     *       // Methods
     *       setAlternateIcon: (iconName: string | null) => Promise<string | null>;
     *     }
     *   }
     * }
     * ```
     * ---
     * **Kotlin module**: The module definition for the native module.
     * ```kotlin
     * package expo.modules.haptics
     *
     * class NativeAppIconModule : Module() {
     *
     *   override fun definition() = ModuleDefinition {
     *     Name("NativeAppIcon")
     *
     *     Constants("isSupported" to true)
     *
     *     AsyncFunction("setAlternateIcon") { name: String ->
     *       // ...
     *     }
     *   }
     * }
     * ```
     */
    namespace AndroidRuntime { }
    /**
     * Interface for defining cross-platform native modules that are available on the global `expo.modules` object in custom native runtimes (iOS, Android clients).
     * Third-party packages can extend this interface to add their own native modules to the global `expo.modules` object.
     *
     * Create a native module with:
     * **`npx create-expo-module@latest --local`**
     *
     * Learn more: [creating a native module](https://docs.expo.dev/modules/get-started/).
     *
     *
     * @example
     * ```ts
     * declare global {
     *   namespace AppleRuntime {
     *     interface NativeAppIcon {
     *       setAlternateIcon: (iconName: string | null) => Promise<string | null>;
     *     }
     *   }
     *
     *   namespace AndroidRuntime {
     *     interface NativeAppIcon {
     *       setAlternateIcon: (iconName: string | null) => Promise<string | null>;
     *     }
     *   }
     *
     *   interface ExpoNativeModules {
     *     NativeAppIcon: AndroidRuntime.NativeAppIcon | AppleRuntime.NativeAppIcon;
     *   }
     * }
     * ```
     */
    interface ExpoNativeModules {
    }
}
export interface ExpoGlobal {
    /**
     * Host object that is used to access native Expo modules.
     */
    modules: ExpoNativeModules;
    /**
     * @see EventEmitter
     */
    EventEmitter: typeof EventEmitter;
    /**
     * @see SharedObject
     */
    SharedObject: typeof SharedObject;
    /**
     * @see NativeModule
     */
    NativeModule: typeof NativeModule;
    /**
     * Generates a random UUID v4 string.
     */
    uuidv4(): string;
    /**
     * Generates a UUID v5 string representation of the value in the specified namespace.
     */
    uuidv5(name: string, namespace: string): string;
    /**
     * Returns a static view config of the native view with the given name
     * or `null` if the view has not been registered.
     */
    getViewConfig(viewName: string): ViewConfig | null;
}
type ViewConfig = {
    validAttributes: Record<string, any>;
    directEventTypes: Record<string, {
        registrationName: string;
    }>;
};
declare global {
    /**
     * Global object containing all the native bindings installed by Expo.
     * This object is not available in projects without the `expo` package installed.
     */
    var expo: ExpoGlobal;
}
export {};
//# sourceMappingURL=global.d.ts.map