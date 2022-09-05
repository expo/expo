import Foundation

public class NativeModulesProxyModule: Module {
  public static let moduleName = "NativeModulesProxy"

  public func definition() -> ModuleDefinition {
    Name(Self.moduleName)

    Constants { () -> [String: Any?] in
      guard let config = self.appContext?.legacyModulesProxy?.nativeModulesConfig else {
        // TODO: Throw, but what?
        return [:]
      }
      return config.toDictionary()
    }

    AsyncFunction("callMethod") { (moduleName: String, methodName: String, arguments: [Any], promise: Promise) in
      guard let appContext = self.appContext else {
        return promise.reject(Exceptions.AppContextLost())
      }

      // Call a method on the new module if exists
      if appContext.hasModule(moduleName) {
        appContext.callFunction(methodName, onModule: moduleName, withArgs: arguments, resolve: promise.resolver, reject: promise.legacyRejecter)
        return
      }

      // Call a method on the legacy module
      guard let legacyModule = appContext.legacyModuleRegistry?.getExportedModule(forName: moduleName) else {
        return promise.reject(ModuleHolder.ModuleNotFoundException(moduleName))
      }
      legacyModule.methodQueue().async {
        legacyModule.callExportedMethod(methodName, withArguments: arguments, resolver: promise.resolver, rejecter: promise.legacyRejecter)
      }
    }
  }
}
