import XCTest

@testable import ExpoModulesCore

class ModuleRegistryTests: XCTestCase {
  var appContext: AppContext!

  override func setUp() {
    appContext = AppContext()
  }

  func testRegisterWithUnnamedModule() {
    testRegister(module: UnnamedModule(appContext: appContext), name: String(describing: UnnamedModule.self))
  }

  func testRegisterWithNamedModule() {
    testRegister(module: NamedModule(appContext: appContext), name: NamedModule.namedModuleName)
  }

  private func testRegister(module: Module, name: String) {
    let moduleRegistry = appContext.moduleRegistry

    moduleRegistry.register(module: module)

    XCTAssertTrue(
      moduleRegistry.has(moduleWithName: name),
      "Module with name \(name) exists in the registry"
    )
    XCTAssert(
      moduleRegistry.get(moduleWithName: name) === module,
      "Module registry returns correct module when asking by name \(name)"
    )
    XCTAssertTrue(
      moduleRegistry.contains { holder in holder.module === module },
      "Module registry contains the holder with newly created module"
    )
    XCTAssert(
      moduleRegistry.get(moduleHolderForName: name)?.module === module,
      "Module registry returns the holder with newly created module"
    )
  }
}
