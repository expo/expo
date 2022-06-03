import Foundation

public class NativeProxyModule: Module {
  public static let moduleName = "NativeProxy"

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
