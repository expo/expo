import XCTest

@testable import EXDevMenu

class MockedNOOPBridge: RCTBridge {
  override func invalidate() {
    // NOOP
  }

  override func setUp() {
    bundleURL = URL(string: "http://localhost:1234")
  }
}

class DevMenuSessionTests: XCTestCase {
  func test_if_session_uses_provided_data() {
    let appInfo = [
      "appName": "Test App",
      "appVersion": "123",
      "appIcon": "Icon",
      "hostUrl": "http://localhost:1234"
    ]

    let session = DevMenuSession(bridge: MockedNOOPBridge(delegate: nil, launchOptions: nil), appInfo: appInfo)

    XCTAssertEqual(session.appInfo as! [String: String], appInfo)
  }

  func test_if_session_gets_url_from_bridge() {
    let session = DevMenuSession(bridge: MockedNOOPBridge(delegate: nil, launchOptions: nil), appInfo: nil)

    let url = session.appInfo["hostUrl"] as! String
    XCTAssertEqual(url, "http://localhost:1234")
  }
}
