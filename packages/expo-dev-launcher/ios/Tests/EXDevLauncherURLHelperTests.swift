// Copyright 2021-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherURLHelperTests: XCTestCase {
  func testIsDevLauncherURL() {
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "scheme://expo-development-client")))
    XCTAssertTrue(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")))
    XCTAssertFalse(EXDevLauncherURLHelper.isDevLauncherURL(URL(string: "scheme://not-expo-development-client")))
  }

  func testReplaceEXPScheme() {
    let actual = EXDevLauncherURLHelper.replaceEXPScheme(URL(string: "exp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")!, to: "scheme")
    XCTAssertEqual(URL(string: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"), actual)

    let actual = EXDevLauncherURLHelper.replaceEXPScheme(URL(string: "http://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081")!, to: "scheme")
    XCTAssertEqual(URL(string: "http://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"), actual)
  }

  func testGetAppURLFromDevLauncherURL() {
    let appURLNotNil = EXDevLauncherURLHelper.getAppURLFromDevLauncherURL(URL(string: "scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%2Findex.bundle%3Fplatform%3Dios%26dev%3Dtrue")!)
    XCTAssertEqual(URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true"), appURLNotNil)

    let appURLNil = EXDevLauncherURLHelper.getAppURLFromDevLauncherURL(URL(string: "scheme://expo-development-client")!)
    XCTAssertNil(appURLNil)

    // parsing should happen regardless of the value of the hostname, scheme, or parsed URL
    let appURLWeird = EXDevLauncherURLHelper.getAppURLFromDevLauncherURL(URL(string: "http://localhost/?url=exp%3A%2F%2Fapp")!)
    XCTAssertEqual(URL(string: "exp://app"), appURLWeird)
  }
}
