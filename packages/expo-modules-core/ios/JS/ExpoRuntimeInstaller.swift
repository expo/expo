// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Property name of the core object in the global scope of the Expo JS runtime, i.e. `global.expo`.
internal let globalCoreObjectPropertyName = "expo"

@JavaScriptActor
internal class ExpoRuntimeInstaller: EXJavaScriptRuntimeManager {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime

  internal init(appContext: AppContext, runtime: JavaScriptRuntime) {
    self.appContext = appContext
    self.runtime = runtime
    let pointer = runtime.withUnsafePointee { $0 }
    super.init(runtime: pointer)
  }

  /**
   Installs `global.expo`.
   */
  @JavaScriptActor
  @discardableResult
  internal func installCoreObject() -> JavaScriptObject {
    let coreObject = runtime.createObject()
    runtime.global().defineProperty(globalCoreObjectPropertyName, value: coreObject, options: [.enumerable])
    return coreObject
  }

  /// Attaches the `AppContext.NativeState` to the `global.expo` object. This ties the app
  /// context's lifetime to the runtime (its release defers to runtime finalization) and lets
  /// code recover the app context from the runtime via `AppContext.from(runtime:)`.
  ///
  /// Pass `ownsLifecycle: true` for the runtime that owns the app context's lifecycle (the main
  /// runtime), so only its teardown runs `destroy()`. Subordinate runtimes (e.g. the UI runtime)
  /// pass `false` to pin the app context and enable recovery without destroying it.
  @JavaScriptActor
  internal func installAppContextNativeState(on coreObject: borrowing JavaScriptObject, ownsLifecycle: Bool) {
    if coreObject.hasNativeState() {
      // Already attached.
      return
    }
    coreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: ownsLifecycle))
  }

  /**
   Installs `expo.modules`, the host object that returns module objects.
   */
  @JavaScriptActor
  internal func installExpoModulesHostObject() throws {
    let coreObject = try runtime.global().getPropertyAsObject(globalCoreObjectPropertyName)

    if coreObject.hasProperty("modules") {
      // Host object already installed
      return
    }
    let modulesHostObject = runtime.createHostObject(
      get: { [weak appContext] moduleName in
        return appContext?.getNativeModuleObject(moduleName) ?? .undefined()
      },
      set: { propertyName, _ in
        throw ReadOnlyExpoModulesPropertyException(propertyName)
      },
      getPropertyNames: { [weak appContext] in
        return appContext?.getModuleNames() ?? []
      }
    )

    // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
    coreObject.defineProperty("modules", value: modulesHostObject, options: [.enumerable])
  }

  /**
   Installs `expo.packages`, the host object that returns the native exports of each npm package
   (its modules and shared object classes) by the package name, for example `expo.packages['expo-audio']`.
   */
  @JavaScriptActor
  internal func installExpoPackagesHostObject() throws {
    let coreObject = try runtime.global().getPropertyAsObject(globalCoreObjectPropertyName)

    if coreObject.hasProperty("packages") {
      // Host object already installed
      return
    }
    let runtime = self.runtime
    let packageObjects = PackageObjectsCache()

    let packagesHostObject = runtime.createHostObject(
      get: { [weak appContext] packageName in
        guard let appContext else {
          return .undefined()
        }
        if let packageObject = packageObjects.store[packageName]?.withUnwrappedValue({ $0.copy() }) {
          return packageObject
        }
        guard appContext.moduleRegistry.hasPackage(named: packageName) else {
          return .undefined()
        }
        let packageObject = Self.createPackageObject(packageName, appContext: appContext, runtime: runtime)
        packageObjects.store[packageName] = packageObject.refToValue()
        return packageObject.asValue()
      },
      set: { packageName, _ in
        throw ReadOnlyExpoPackagesPropertyException("expo.packages[\"\(packageName)\"]")
      },
      getPropertyNames: { [weak appContext] in
        return appContext?.moduleRegistry.packageNames ?? []
      }
    )

    // Define the `global.expo.packages` object as a non-configurable, read-only and enumerable property.
    coreObject.defineProperty("packages", value: packagesHostObject, options: [.enumerable])
  }

  /**
   Creates the object that is installed as `expo.packages[packageName]`. It returns the modules
   and shared object classes of the package by their names.
   */
  @JavaScriptActor
  private static func createPackageObject(
    _ packageName: String,
    appContext: AppContext,
    runtime: JavaScriptRuntime
  ) -> JavaScriptObject {
    // Logs name collisions once, when the package object is created.
    _ = appContext.packageExportNames(inPackage: packageName)

    return runtime.createHostObject(
      get: { [weak appContext] exportName in
        return try appContext?.packageExport(named: exportName, inPackage: packageName) ?? .undefined()
      },
      set: { exportName, _ in
        throw ReadOnlyExpoPackagesPropertyException("expo.packages[\"\(packageName)\"].\(exportName)")
      },
      getPropertyNames: { [weak appContext] in
        return appContext?.packageExportNames(inPackage: packageName) ?? []
      }
    )
  }
}

/**
 Caches the package objects of `expo.packages` for one runtime, so each access returns the same object.
 */
private final class PackageObjectsCache {
  // Objects are kept behind `JavaScriptValue.Ref` because `JavaScriptValue` is ~Copyable and cannot be a
  // Dictionary value.
  var store: [String: JavaScriptValue.Ref] = [:]
}

/**
 Raised when JavaScript code attempts to assign to `expo.modules.*`. Module bindings
 are owned by the native side and cannot be replaced from JS.
 */
internal final class ReadOnlyExpoModulesPropertyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot assign to 'expo.modules.\(param)': "
      + "the `expo.modules` namespace is owned by the native runtime and its bindings cannot be replaced from JavaScript. "
      + "Define or override behavior inside the native module instead."
  }

  // `Exception.message` is the `description`, which is just `reason` here (no cause chain).
  // Override it explicitly so the JS-facing error stays the bare `reason`.
  override var message: String { reason }
}

/**
 Raised when JavaScript code attempts to assign to `expo.packages[...]` or to an export of a package.
 The parameter is the path that JavaScript assigned to.
 */
internal final class ReadOnlyExpoPackagesPropertyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot assign to '\(param)': "
      + "the `expo.packages` object is owned by the native runtime and its bindings cannot be replaced from JavaScript. "
      + "Define or override behavior inside the native module instead."
  }
}
