import XCTest

@testable import EXDevMenu

class DevMenuVendoredModulesUtilsTests: XCTestCase {
  func test_if_vendored_modules_are_available() {
    let vendoredModules = DevMenuVendoredModulesUtils.vendoredModules(RCTBridge(delegate: nil))

    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNCSafeAreaProvider" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNCSafeAreaView" } != nil)
  }
}
