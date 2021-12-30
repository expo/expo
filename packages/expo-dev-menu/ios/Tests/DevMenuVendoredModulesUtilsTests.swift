import XCTest

@testable import EXDevMenu

class DevMenuVendoredModulesUtilsTests: XCTestCase {
  func test_if_vendored_modules_are_available() {
    let vendoredModules = DevMenuVendoredModulesUtils.vendoredModules()

    XCTAssertEqual(vendoredModules.count, 3)
    XCTAssert(vendoredModules.first { type(of: $0).moduleName() == "RNGestureHandlerModule" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "ReanimatedModule" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNGestureHandlerButton" } != nil)
  }
}
