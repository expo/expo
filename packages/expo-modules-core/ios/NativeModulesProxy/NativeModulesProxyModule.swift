import Foundation

public class NativeModulesProxyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SweetProxy")

    Constants { () -> [String: Any?] in
      guard let config = self.appContext?.legacyModulesProxy?.nativeModulesConfig else {
        // TODO: Throw, but what?
        return [:]
      }
      return config.toDictionary()
    }

    AsyncFunction("callMethod") { (_: String, _: String, _: Promise) in
      // TODO
    }
  }
}
