// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation
import React

@objc
public final class SwiftInteropBridge: NSObject {
  let appContext: AppContext

  var registry: ModuleRegistry {
    appContext.moduleRegistry
  }

  internal init(appContext: AppContext) {
    self.appContext = appContext
    super.init()
  }

  @objc
  public init(modulesProvider: ModulesProvider, legacyModuleRegistry: EXModuleRegistry) {
    self.appContext = AppContext(withModulesProvider: modulesProvider, legacyModuleRegistry: legacyModuleRegistry)
    super.init()
  }

  @objc
  public func hasModule(_ moduleName: String) -> Bool {
    return registry.has(moduleWithName: moduleName)
  }

  @objc
  public func setReactBridge(_ reactBridge: RCTBridge) {
    appContext.reactBridge = reactBridge
  }

  @objc
  public func callFunction(
    _ functionName: String,
    onModule moduleName: String,
    withArgs args: [Any],
    resolve: @escaping EXPromiseResolveBlock,
    reject: @escaping EXPromiseRejectBlock
  ) {
    registry
      .get(moduleHolderForName: moduleName)?
      .call(function: functionName, args: args) { value, error in
        if let error = error {
          reject(error.code, error.description, error)
        } else if let error = error {
          reject("ERR_UNKNOWN_ERROR", error.localizedDescription, error)
        } else {
          resolve(value)
        }
      }
  }

  @objc
  public func callFunctionSync(
    _ functionName: String,
    onModule moduleName: String,
    withArgs args: [Any]
  ) -> Any? {
    return registry
      .get(moduleHolderForName: moduleName)?
      .callSync(function: functionName, args: args)
  }

  @objc
  public func exportedFunctionNames() -> [String: [[String: Any]]] {
    var constants = [String: [[String: Any]]]()

    for holder in registry {
      constants[holder.name] = holder.definition.functions.map({ functionName, function in
        return [
          "name": functionName,
          "argumentsCount": function.argumentsCount,
          "key": functionName
        ]
      })
    }
    return constants
  }

  @objc
  public func exportedModulesConstants() -> [String: Any] {
    return registry.reduce(into: [String: Any]()) { acc, holder in
      acc[holder.name] = holder.getConstants()
    }
  }

  @objc
  public func viewManagersMetadata() -> [String: Any] {
    return registry.reduce(into: [String: Any]()) { acc, holder in
      if let viewManager = holder.definition.viewManager {
        acc[holder.name] = [
          "propsNames": viewManager.props.map { $0.name }
        ]
      }
    }
  }

  /**
   Returns view modules wrapped by the base `ViewModuleWrapper` class.
   */
  @objc
  public func getViewManagers() -> [ViewModuleWrapper] {
    return registry.compactMap { holder in
      if holder.definition.viewManager != nil {
        return ViewModuleWrapper(holder)
      } else {
        return nil
      }
    }
  }

  /**
   Sets the JSI runtime on the operating `AppContext`.
   */
  @objc
  public func setRuntime(_ runtime: JavaScriptRuntime?) {
    appContext.runtime = runtime
  }

  @objc
  public func getModuleNames() -> [String] {
    return registry.getModuleNames()
  }

  @objc
  public func getNativeModuleObject(_ moduleName: String) -> JavaScriptObject? {
    return registry.get(moduleHolderForName: moduleName)?.javaScriptObject
  }

  // MARK: - Events

  /**
   Returns an array of event names supported by all Swift modules.
   */
  @objc
  public func getSupportedEvents() -> [String] {
    return registry.reduce(into: [String]()) { events, holder in
      events.append(contentsOf: holder.definition.eventNames)
    }
  }

  /**
   Modifies listeners count for module with given name. Depending on the listeners count,
   `onStartObserving` and `onStopObserving` are called.
   */
  @objc
  public func modifyEventListenersCount(_ moduleName: String, count: Int) {
    registry
      .get(moduleHolderForName: moduleName)?
      .modifyListenersCount(count)
  }
}
