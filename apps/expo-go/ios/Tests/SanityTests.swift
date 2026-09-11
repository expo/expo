// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SanityTests: XCTestCase {
  func testHarnessRunsAgainstHostApp() {
    // Constructs an app-module symbol to prove @testable linkage against Expo Go.app
    XCTAssertNotNil(SnackFile(path: "sanity.js", contents: "", isAsset: false))
  }
}
