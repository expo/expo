import XCTest

@testable import EXDevMenu

class DevMenuUtilsTest: XCTestCase {
  func test_stripRCT() {
    XCTAssertEqual(DevMenuUtils.stripRCT("RCTTest"), "Test")
    XCTAssertEqual(DevMenuUtils.stripRCT("Test"), "Test")
  }

  func test_if_bundle_is_present() {
    let bundle = DevMenuUtils.resourcesBundle()

    #if os(tvOS)
    let jsBundleResourceName = "EXDevMenuAppTV.ios"
    #else
    let jsBundleResourceName = "EXDevMenuApp.ios"
    #endif
    XCTAssertNotNil(bundle)
    XCTAssertNotNil(bundle!.url(forResource: jsBundleResourceName, withExtension: "js"))
  }
}
