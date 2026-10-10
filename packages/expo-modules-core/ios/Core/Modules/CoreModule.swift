// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import Foundation
import ExpoModulesJSI

// The core module that describes the `global.expo` object.
internal final class CoreModule: Module {
  internal func definition() -> ModuleDefinition {
    Constant("expoModulesCoreVersion") {
      let version = CoreModuleHelper.getVersion()
      let components = version.split(separator: "-")[0].split(separator: ".").compactMap { Int($0) }

      return [
        "version": version,
        "major": components[0],
        "minor": components[1],
        "patch": components[2]
      ]
    }

    Constant("cacheDir") {
      FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path ?? ""
    }

    Constant("documentsDir") {
      FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path ?? ""
    }

    Constant("isRunningOnQuest") {
      false
    }

    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") { () -> String in
      return UUID().uuidString.lowercased()
    }

    Function("uuidv5") { (name: String, namespace: String) -> String in
      guard let namespaceUuid = UUID(uuidString: namespace) else {
        throw InvalidNamespaceException(namespace)
      }

      return uuidv5(name: name, namespace: namespaceUuid).uuidString.lowercased()
    }

    // swiftlint:disable:next unused_closure_parameter
    Function("getViewConfig") { (moduleName: String, viewName: String?) -> [String: Any]? in
      var validAttributes: [String: Any] = [:]
      var directEventTypes: [String: Any] = [:]
      let moduleHolder = appContext?.moduleRegistry.get(moduleHolderForName: getHolderName(moduleName))

      guard let viewDefinition = moduleHolder?.definition.views[viewName ?? DEFAULT_MODULE_VIEW] else {
        return nil
      }
      for propName in viewDefinition.getSupportedPropNames() {
        validAttributes[propName] = true
      }
      for eventName in viewDefinition.getSupportedEventNames() {
        guard let normalizedEventName = RCTNormalizeInputEventName(eventName) else {
          continue
        }
        directEventTypes[normalizedEventName] = [
          "registrationName": eventName
        ]
      }

      return [
        "validAttributes": validAttributes,
        "directEventTypes": directEventTypes
      ]
    }

    AsyncFunction("reloadAppAsync") { (reason: String) in
      appContext?.reloadAppAsync(reason)
    }
  }

  private func getHolderName(_ viewName: String) -> String {
    if let appIdentifier = appContext?.appIdentifier, viewName.hasSuffix("_\(appIdentifier)") {
      return String(viewName.dropLast("_\(appIdentifier)".count))
    }

    return viewName
  }
}

internal final class WorkletUIRuntimeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot find UI worklet runtime"
  }
}

extension CoreModule {
  /**
   Installs the worklet UI runtime from the holder object that the worklets JS code passes to
   `global.expo.installOnUIRuntime`. Bound as a plain host function in `AppContext.prepareRuntime`
   rather than declared in the definition: the DSL carries arguments as `Any`, which the non-copyable
   `JavaScriptValue` cannot be.
   */
  internal func installOnUIRuntime(_ uiRuntimeHolder: consuming JavaScriptValue) throws {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }

    // Check if was already installed
    if appContext._uiRuntime != nil {
      return
    }

    let runtime = try appContext.runtime
    guard uiRuntimeHolder.isObject() else {
      throw WorkletUIRuntimeException()
    }

    guard let factory = AppContext.uiRuntimeFactory else {
      throw WorkletUIRuntimeException()
    }

    // Use a Sendable box to safely capture error across isolation boundaries
    final class ErrorHolder: @unchecked Sendable {
      var error: (any Error)?
    }
    let errorHolder = ErrorHolder()
    // The block below captures the holder, which a non-copyable value can't be, so it travels in a ref.
    let holderRef = uiRuntimeHolder.ref()

    let block = {
      do {
        let uiRuntime = try holderRef.withUnwrappedValue { (holder: borrowing JavaScriptValue) in
          return try factory(appContext, holder, runtime)
        }
        appContext._uiRuntime = uiRuntime
      } catch {
        errorHolder.error = error
      }
    }

    if Thread.isMainThread {
      block()
    } else {
      DispatchQueue.main.sync {
        block()
      }
    }

    if let error = errorHolder.error {
      throw error
    }
  }
}
