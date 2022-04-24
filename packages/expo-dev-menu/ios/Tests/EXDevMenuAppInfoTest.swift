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

// class EXDevMenuAppInfoTest: XCTestCase {
//   func test_if_app_info_uses_provided_data() {
//     let manifest = [
//       "name": "Test App",
//       "version": "123"
//     ]

//     let appInfo = EXDevMenuAppInfo.getAppInfo()

//     XCTAssertEqual(appInfo["appName"] as! String, "Test App")
//     XCTAssertEqual(appInfo["appVersion"] as! String, "13")
//     XCTAssertEqual(appInfo["hostUrl"] as! String, "localhost")
//   }

//   func test_if_app_info_gets_host_from_bridge() {
//     let appInfo = EXDevMenuAppInfo.getAppInfo()
    
//     let host = appInfo["hostUrl"] as! String
//     XCTAssertEqual(host, "localhost")
//   }
// }
