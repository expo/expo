// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ErrorScreenLogMessageTests: XCTestCase {
  func testDetailOnlyIsSent() {
    XCTAssertEqual(
      ErrorScreenLogMessage.make(header: nil, detail: "The accounts need to match.", fixInstructions: nil),
      "The accounts need to match."
    )
  }

  func testHeaderComesFirst() {
    XCTAssertEqual(
      ErrorScreenLogMessage.make(header: "Project is incompatible", detail: "Update Expo Go.", fixInstructions: nil),
      "Project is incompatible\n\nUpdate Expo Go."
    )
  }

  func testFixInstructionsAreAppended() {
    XCTAssertEqual(
      ErrorScreenLogMessage.make(header: "Header", detail: "Detail", fixInstructions: "Run npx expo login."),
      "Header\n\nDetail\n\nHow to fix this error:\n\nRun npx expo login."
    )
  }

  func testBoldMarkersAreRemovedFromTheDetail() {
    XCTAssertEqual(
      ErrorScreenLogMessage.make(header: nil, detail: "Sign in as **alan**.", fixInstructions: nil),
      "Sign in as alan."
    )
  }

  func testNoDetailSendsNothing() {
    XCTAssertNil(ErrorScreenLogMessage.make(header: "Header", detail: nil, fixInstructions: nil))
    XCTAssertNil(ErrorScreenLogMessage.make(header: "Header", detail: "", fixInstructions: nil))
  }

  func testPayloadTagsTheLogAsIOS() {
    let payload = EXPackagerLogHelper.payload(message: "Detail", level: .error)

    XCTAssertEqual(payload["type"] as? String, "log")
    XCTAssertEqual(payload["level"] as? String, "error")
    XCTAssertEqual(payload["data"] as? [String], ["Detail"])
    XCTAssertEqual(payload["mode"] as? String, "ios")
  }
}
