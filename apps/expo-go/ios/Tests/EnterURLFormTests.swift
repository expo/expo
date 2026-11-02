// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class EnterURLFormTests: XCTestCase {
  func testEmptyTextCannotConnect() {
    XCTAssertFalse(EnterURLForm.canConnect(""))
    XCTAssertFalse(EnterURLForm.canConnect("   "))
    XCTAssertNil(EnterURLForm.connectURL(""))
    XCTAssertNil(EnterURLForm.connectURL(" \n "))
  }

  func testValidURLConnects() {
    XCTAssertTrue(EnterURLForm.canConnect("exp://192.168.1.1:8081"))
    XCTAssertEqual(EnterURLForm.connectURL("exp://192.168.1.1:8081"), "exp://192.168.1.1:8081")
  }

  func testURLIsTrimmed() {
    XCTAssertEqual(EnterURLForm.connectURL("  exp://192.168.1.1:8081  "), "exp://192.168.1.1:8081")
  }

  func testHostWithoutSchemeIsNormalized() {
    XCTAssertEqual(EnterURLForm.connectURL("192.168.1.1:8081"), sanitizeUrlString("192.168.1.1:8081"))
  }
}
