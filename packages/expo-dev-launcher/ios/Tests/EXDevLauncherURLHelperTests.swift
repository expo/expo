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
    expectDevLauncherUrlToEqual(input: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%2Findex.bundle%3Fplatform%3Dios%26dev%3Dtrue",
                         expected: "http://localhost:8081/index.bundle?platform=ios&dev=true")

    // non-dev-client scheme with valid url param -> defer loading to loaded app
    expectDevLauncherUrlToEqual(input: "scheme://not-dev-client/?url=\(encodedUrlString)",
                                expected: "scheme://not-dev-client/?url=\(encodedUrlString)")

  }

  func testDevLauncherUrlQueryParams() {
    let url = "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081&updateMessage=123"
    let devLauncherUrl = EXDevLauncherUrl(URL(string: url)!)
    let queryParams = devLauncherUrl.queryParams

    XCTAssertEqual(queryParams["updateMessage"], "123")
    XCTAssertEqual(queryParams["url"], "http://localhost:8081")
  }

  func testIsDevLauncherURLAcceptsReservedParamsOnAnyHost() {
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "myapp://login?__expo_launch_token=abc")))
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "myapp://?__expo_url=\(encodedUrlString)")))
    XCTAssertFalse(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "myapp://login")))
  }

  func testHasUrlQueryParam() {
    XCTAssertTrue(EXDevLauncherURLHelper.hasUrlQueryParam(URL(string: "scheme://expo-development-client/?url=\(encodedUrlString)")!))
    XCTAssertTrue(EXDevLauncherURLHelper.hasUrlQueryParam(URL(string: "myapp://?__expo_url=\(encodedUrlString)")!))
    XCTAssertFalse(EXDevLauncherURLHelper.hasUrlQueryParam(URL(string: "scheme://expo-development-client")!))
    XCTAssertFalse(EXDevLauncherURLHelper.hasUrlQueryParam(URL(string: "myapp://login?__expo_launch_token=abc")!))
  }

  func testDevLauncherUrlResolvesTargetAndDropsReservedParams() {
    let legacy = EXDevLauncherUrl(URL(string: "scheme://expo-development-client/?url=exp%3A%2F%2Flocalhost%3A8081&updateMessage=hi&__expo_launch_token=abc")!)
    XCTAssertEqual(legacy.url.absoluteString, "http://localhost:8081")
    XCTAssertEqual(legacy.queryParams["updateMessage"], "hi")
    XCTAssertNil(legacy.queryParams["__expo_launch_token"])

    let reserved = EXDevLauncherUrl(URL(string: "scheme://?__expo_url=exp%3A%2F%2Flocalhost%3A8081&__expo_tools_button=0")!)
    XCTAssertEqual(reserved.url.absoluteString, "http://localhost:8081")
    XCTAssertTrue(reserved.queryParams.isEmpty)

    let plain = EXDevLauncherUrl(URL(string: "exp://localhost:8081?x=1")!)
    XCTAssertEqual(plain.url.absoluteString, "http://localhost:8081?x=1")
    XCTAssertEqual(plain.queryParams["x"], "1")
  }

  //  HELPER
  func expectDevLauncherUrlToEqual(input: String, expected: String) {
    let devLauncherUrl = EXDevLauncherUrl(URL(string: input)!)
    XCTAssertEqual(devLauncherUrl.url.absoluteString, expected)
  }
}
