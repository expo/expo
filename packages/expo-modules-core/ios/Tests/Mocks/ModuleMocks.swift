@testable import ExpoModulesCore

class UnnamedModule: Module {
  static func definition() -> ModuleDefinition {}
}

class NamedModule: Module {
  static let namedModuleName = "MyModule"

  static func definition() -> ModuleDefinition {
    name(namedModuleName)
  }
}

class CustomModule: Module {
  static func definition() -> ModuleDefinition {}
}

typealias MockedDefinitionFunc = (CustomModule.Type) -> ModuleDefinition

func mockDefinition(@ModuleDefinitionBuilder _ definition: @escaping () -> ModuleDefinition) -> ModuleDefinition {
  return definition().withType(CustomModule.self)
}

func mockDefinition(@ModuleDefinitionBuilder _ definition: @escaping MockedDefinitionFunc) -> ModuleDefinition {
  return definition(CustomModule.self).withType(CustomModule.self)
}

func mockModuleHolder(_ appContext: AppContext, @ModuleDefinitionBuilder _ definition: @escaping MockedDefinitionFunc) -> ModuleHolder {
  return ModuleHolder(appContext: appContext, definition: mockDefinition(definition))
}
