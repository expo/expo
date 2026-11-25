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
   Installs `expo.SharedRef`, the base class of shared refs, on the core object.
   */
  @JavaScriptActor
  internal func installSharedRefClass(
    on coreObject: borrowing JavaScriptObject,
    inheriting sharedObjectClass: consuming JavaScriptFunction
  ) throws {
    let sharedRefClass = try runtime.createClass(name: "SharedRef", inheriting: sharedObjectClass) { this, _ in
      return this
    }
    coreObject.setProperty("SharedRef", value: sharedRefClass.asValue())
  }

  /**
   Installs `expo.NativeModule`, the class of module objects, on the core object.
   */
  @JavaScriptActor
  internal func installNativeModuleClass(
    on coreObject: borrowing JavaScriptObject,
    inheriting eventEmitterClass: consuming JavaScriptFunction
  ) throws {
    let nativeModuleClass = try runtime.createClass(name: "NativeModule", inheriting: eventEmitterClass) { this, _ in
      return this
    }
    coreObject.setProperty("NativeModule", value: nativeModuleClass.asValue())
  }

  /**
   Installs `expo.modules`, the host object that returns module objects.
   */
  @JavaScriptActor
  internal func installExpoModulesHostObject(isMainRuntime: Bool) throws {
    let coreObject = try runtime.global().getPropertyAsObject(globalCoreObjectPropertyName)

    if coreObject.hasProperty("modules") {
      // Host object already installed
      return
    }
    // The getter is chosen here, so accessing a module doesn't check which runtime it is in.
    let getModule: @JavaScriptActor (_ moduleName: String) throws -> JavaScriptValue
    if isMainRuntime {
      getModule = { [weak appContext] moduleName in
        return appContext?.getNativeModuleObject(moduleName) ?? .undefined()
      }
    } else {
      // The getter reaches the runtime through its handle instead of capturing it. The runtime owns the host object,
      // so a capture would keep a runtime that owns its engine alive, and the wrapper can be freed before the engine
      // runtime (for example, when attaching the runtime fails).
      let runtimeHandle = runtime.handle
      getModule = { [weak appContext] moduleName in
        guard let runtime = runtimeHandle.runtime else {
          return .undefined()
        }
        return appContext?.getNativeModuleObject(moduleName, inAttachedRuntime: runtime) ?? .undefined()
      }
    }
    let modulesHostObject = runtime.createHostObject(
      get: getModule,
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
    // The getters reach the runtime through its handle, like the getter of `expo.modules`.
    let runtimeHandle = runtime.handle
    let packageObjects = JavaScriptValuesCache()

    let packagesHostObject = runtime.createHostObject(
      get: { [weak appContext] packageName in
        guard let appContext, let runtime = runtimeHandle.runtime else {
          return .undefined()
        }
        if let packageObject = packageObjects.store[packageName]?.withUnwrappedValue({ $0.copy() }) {
          return packageObject
        }
        guard let package = appContext.package(named: packageName) else {
          return .undefined()
        }
        let packageObject = Self.createPackageObject(package, appContext: appContext, runtime: runtime)
        packageObjects.store[packageName] = packageObject.refToValue()
        return packageObject.asValue()
      },
      set: { packageName, _ in
        throw ReadOnlyExpoPackagesPropertyException("expo.packages[\"\(packageName)\"]")
      },
      getPropertyNames: { [weak appContext] in
        return appContext?.packageRegistry.packageNames ?? []
      }
    )

    // Define the `global.expo.packages` object as a non-configurable, read-only and enumerable property.
    coreObject.defineProperty("packages", value: packagesHostObject, options: [.enumerable])
  }

  /**
   Creates the object that is installed as `expo.packages[packageName]`. It has a read-only lazy property
   for each export of the package: a module, a shared object class or the React component of a view.
   The first read creates the export, and later reads don't call native code.
   */
  @JavaScriptActor
  static func createPackageObject(
    _ package: PackageHolder,
    appContext: AppContext,
    runtime: JavaScriptRuntime
  ) -> JavaScriptObject {
    let packageName = package.name
    let packageObject = runtime.createObject()

    for exportName in package.exportNames {
      packageObject.defineLazyProperty(exportName, options: .enumerable) {
        [weak appContext] (_: borrowing JavaScriptUnownedValue, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue in
        guard let appContext, let package = appContext.package(named: packageName) else {
          return .undefined()
        }
        if let export = try package.export(named: exportName, appContext: appContext) {
          return export
        }
        // Only the React runtime can create components, so a view is `undefined` in the UI runtime.
        guard let viewType = package.viewType(named: exportName), NativeViewComponentFactory.isAvailable(in: runtime)
        else {
          return .undefined()
        }
        let config = NativeViewComponentConfig(
          viewType: viewType,
          componentName: ExpoNativeView.packageComponentName(packageName: packageName, viewName: exportName)
        )
        return try NativeViewComponentFactory.create(config, in: runtime)
      }
    }
    return packageObject
  }
}

/**
 Caches JavaScript values by name for one runtime, for example the package objects of `expo.packages`,
 so each access returns the same value.
 */
private final class JavaScriptValuesCache {
  // Values are kept behind `JavaScriptValue.Ref` because `JavaScriptValue` is ~Copyable and cannot be a
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
 Raised when JavaScript code attempts to assign to `expo.packages[...]`.
 The parameter is the path that JavaScript assigned to.
 */
internal final class ReadOnlyExpoPackagesPropertyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot assign to '\(param)': "
      + "the `expo.packages` object is owned by the native runtime and its bindings cannot be replaced from JavaScript. "
      + "Define or override behavior inside the native module instead."
  }
}
