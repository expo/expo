@testable import ExpoModulesCore

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
  let body: MockedDefinitionFunc

  func definition() -> ModuleDefinition {
    return body(self)
  }

  init(appContext: AppContext, _ body: @escaping MockedDefinitionFunc) {
    self.body = body
    super.init(appContext: appContext)
  }

  required init(appContext: AppContext) {
    fatalError("`init(appContext:)` is unavailable in mocked module class.")
  }
}

typealias MockedDefinitionFunc = (CustomModule) -> ModuleDefinition

func mockModuleHolder(_ appContext: AppContext, @ModuleDefinitionBuilder _ definitionBody: @escaping () -> ModuleDefinition) -> ModuleHolder {
  return ModuleHolder(appContext: appContext, module: CustomModule(appContext: appContext, { module in definitionBody() }))
}

func mockModuleHolder(_ appContext: AppContext, @ModuleDefinitionBuilder _ definitionBody: @escaping (CustomModule) -> ModuleDefinition) -> ModuleHolder {
  return ModuleHolder(appContext: appContext, module: CustomModule(appContext: appContext, { module in definitionBody(module) }))
}
