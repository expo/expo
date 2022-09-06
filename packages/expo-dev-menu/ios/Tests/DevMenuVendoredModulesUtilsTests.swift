import XCTest

@testable import EXDevMenu

class DevMenuVendoredModulesUtilsTests: XCTestCase {
  func test_if_vendored_modules_are_available() {
    let vendoredModules = DevMenuVendoredModulesUtils.vendoredModules(RCTBridge(delegate: nil), addReanimated2: true)

    XCTAssertEqual(vendoredModules.count, 6)
    XCTAssert(vendoredModules.first { type(of: $0).moduleName() == "RNGestureHandlerModule" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RCTEventDispatcher" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "ReanimatedModule" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNGestureHandlerButton" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNCSafeAreaProvider" } != nil)
    XCTAssert(vendoredModules.first { type(of: $0).self.moduleName() == "RNCSafeAreaView" } != nil)
  }
}
