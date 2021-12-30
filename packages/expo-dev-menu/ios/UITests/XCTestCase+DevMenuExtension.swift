import XCTest

@testable import EXDevMenu

extension XCTest {
  func assertViewExists(tag: String) {
    XCTAssertNotNil(DevMenuUIMatchers.findView(tag: tag), "View with tag \(tag) does not exists.")
  }

  func assertViewExists(text: String) {
    let view = DevMenuUIMatchers.findView(text: text)
    XCTAssertNotNil(view, "View with text \(text) does not exists.")
  }

  func waitForView(tag: String) {
    XCTAssertNotNil(DevMenuUIMatchers.waitForView(tag: tag))
  }

  func waitForDevMenu() {
    waitForView(tag: DevMenuViews.mainScreen)
    waitForView(tag: DevMenuViews.footer)
    XCTAssertTrue(DevMenuManager.shared.isVisible)

    DevMenuLooper.runMainLoopUntilEmpty()
  }

  func runMainLoop(for sec: Double) {
    DevMenuLooper.runMainLoop(for: sec)
  }
}
