import ExpoModulesCore

class UnnamedModule: Module {
  func definition() -> ModuleDefinition {}
}

class NamedModule: Module {
  static let namedModuleName = "MyModule"

  func definition() -> ModuleDefinition {
    name(Self.namedModuleName)
  }
}

class CustomModule: Module {
  var customDefinition: ((CustomModule) -> ModuleDefinition)!

  convenience init(appContext: AppContext, @ModuleDefinitionBuilder _ customDefinition: @escaping (CustomModule) -> ModuleDefinition) {
    self.init(appContext: appContext)
    self.customDefinition = customDefinition
  }

  func definition() -> ModuleDefinition {
    return customDefinition(self)
  }
}
