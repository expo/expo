import ExpoModulesCore

public final class JestMockSchemaModule: Module {
  public func definition() -> ModuleDefinition {
    Name("JestMockSchemaModule")

    Function("getModulesSchema") { () -> String in
      guard let registry = appContext?.moduleRegistry else {
        return ""
      }
      let jsonEncoder = JSONEncoder()
      if let jsonData = try? jsonEncoder.encode(ModuleRegistryEncoder(registry)),
        let jsonString = String(data: jsonData, encoding: .utf8) {
        return jsonString
      }
      return ""
    }
  }
}
