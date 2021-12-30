import XCTest

@testable import EXDevMenu

class DevMenuUtilsTest: XCTestCase {
  func test_stripRCT() {
    XCTAssertEqual(DevMenuUtils.stripRCT("RCTTest"), "Test")
    XCTAssertEqual(DevMenuUtils.stripRCT("Test"), "Test")
  }

  func test_if_bundle_is_present() {
    let bundle = DevMenuUtils.resourcesBundle()

    XCTAssertNotNil(bundle)
    XCTAssertNotNil(bundle!.url(forResource: "EXDevMenuApp.ios", withExtension: "js"))
  }
}
