import ExpoModulesCore

// MARK: - ExpoBrownfieldStateModule

public class ExpoBrownfieldStateModule: Module {
  private var stores: [String: Any] = [:]

  public func definition() -> ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Function("get") { (key: String) in
      return self.stores[key]
    }

    Function("set") { (key: String, value: Map<String, Any?>) in
      self.stores[key] = value
      return value
    }
  }
}
