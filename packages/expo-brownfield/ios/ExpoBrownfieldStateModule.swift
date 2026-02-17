import ExpoModulesCore

// MARK: - ExpoBrownfieldStateModule

public class ExpoBrownfieldStateModule: Module {
  private var stores: [String: Any] = [:]

  public func definition() -> ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Function("getSharedState") { (key: String) -> Any? in
      return nil
    }

    Function("deleteSharedState") { (key: String) -> Void in
      self.stores.removeValue(forKey: key)
    }
  }
}
