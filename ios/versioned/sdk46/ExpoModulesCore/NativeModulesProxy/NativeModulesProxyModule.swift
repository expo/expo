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
  }
}
