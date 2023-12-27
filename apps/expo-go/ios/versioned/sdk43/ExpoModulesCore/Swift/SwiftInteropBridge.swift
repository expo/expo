
import Foundation

@objc
public class SwiftInteropBridge: NSObject {
  let appContext: AppContext

  var registry: ModuleRegistry {
    appContext.moduleRegistry
  }

  @objc
  public init(modulesProvider: ModulesProviderObjCProtocol, legacyModuleRegistry: ABI43_0_0EXModuleRegistry) {
    self.appContext = AppContext(withModulesProvider: modulesProvider as! ModulesProviderProtocol, legacyModuleRegistry: legacyModuleRegistry)
    super.init()
  }

  @objc
  public func hasModule(_ moduleName: String) -> Bool {
    return registry.has(moduleWithName: moduleName)
  }

  @objc
  public func callMethod(_ methodName: String,
                         onModule moduleName: String,
                         withArgs args: [Any],
                         resolve: @escaping ABI43_0_0EXPromiseResolveBlock,
                         reject: @escaping ABI43_0_0EXPromiseRejectBlock) {
    registry
      .get(moduleHolderForName: moduleName)?
      .call(method: methodName, args: args) { value, error in
        if let error = error as? CodedError {
          reject(error.code, error.description, error)
        } else if let error = error {
          reject("ERR_UNKNOWN_ERROR", error.localizedDescription, error)
        } else {
          resolve(value)
        }
      }
  }

  @objc
  public func exportedMethodNames() -> [String: [[String: Any]]] {
    var constants = [String: [[String: Any]]]()

    for holder in registry {
      var index = -1

      constants[holder.name] = holder.definition.methods.map({ (methodName, method) in
        index += 1
        return [
          "name": methodName,
          "argumentsCount": method.argumentsCount,
          "key": methodName,
        ]
      })
    }
    return constants
  }

  @objc
  public func exportedModulesConstants() -> [String: Any] {
    return registry.reduce(into: [String: Any]()) { acc, holder in
      acc[holder.name] = holder.definition.constants
    }
  }

  @objc
  public func exportedViewManagersNames() -> [String] {
    return registry.compactMap { holder in
      return holder.definition.viewManager != nil ? holder.name : nil
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
}
