// Copyright 2021-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherURLHelperTests: XCTestCase {

  let encodedUrlString = "http%3A%2F%2Flocalhost%3A8081"

  func testIsDevLauncherURL() {
    let defaultUrl = "scheme://expo-development-client"
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: defaultUrl)))
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: defaultUrl + "?url=123")))
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")))
    XCTAssertFalse(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "scheme://not-expo-development-client")))
  }

  func testReplaceEXPScheme() {
    let actual1 = EXDevLauncherURLHelper.replaceEXPScheme(URL(string: "exp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")!, to: "scheme")
    XCTAssertEqual(URL(string: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"), actual1)

    let actual2 = EXDevLauncherURLHelper.replaceEXPScheme(URL(string: "http://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")!, to: "scheme")
    XCTAssertEqual(URL(string: "http://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"), actual2)
  }

  func testDevLauncherUrls() {
    // dev-client scheme with valid url param -> loadApp with specified url param
    expectDevLauncherUrlToEqual(input:"scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%2Findex.bundle%3Fplatform%3Dios%26dev%3Dtrue",
                         expected:"http://localhost:8081/index.bundle?platform=ios&dev=true")

    // non-dev-client scheme with valid url param -> defer loading to loaded app
    expectDevLauncherUrlToEqual(input: "scheme://not-dev-client/?url=\(encodedUrlString)",
                                expected: "scheme://not-dev-client/?url=\(encodedUrlString)")

  }

  func testDevLauncherUrlQueryParams() {
    let url = "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081&updateMessage=123"
    let devLauncherUrl = EXDevLauncherUrl(URL(string:url)!)
    let queryParams = devLauncherUrl.queryParams

    XCTAssertEqual(queryParams["updateMessage"], "123")
    XCTAssertEqual(queryParams["url"], "http://localhost:8081")
  }

  //  HELPER
  func expectDevLauncherUrlToEqual(input: String, expected: String) {
    let devLauncherUrl = EXDevLauncherUrl(URL(string:input)!)
    XCTAssertEqual(devLauncherUrl.url.absoluteString, expected)
  }
}
