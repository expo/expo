// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ErrorScreenContentTests: XCTestCase {
  private func error(_ message: String, code: Int = 1, userInfo: [String: Any] = [:]) -> NSError {
    var info = userInfo
    info[NSLocalizedDescriptionKey] = message
    return NSError(domain: "EXAppLoader", code: code, userInfo: info)
  }

  private func make(
    _ error: NSError?,
    type: FatalErrorType = .loading,
    name: String? = nil,
    url: String? = nil,
    header: String? = nil
  ) -> ErrorScreenContent {
    ErrorScreenContent.make(error: error, type: type, manifestName: name, manifestUrl: url, header: header)
  }

  func testLoadingTitleUsesTheProjectName() {
    XCTAssertEqual(make(nil, name: "My App").title, "There was a problem loading \"My App\".")
  }

  func testExceptionTitleWithoutAName() {
    XCTAssertEqual(make(nil, type: .exception).title, "There was a problem running the requested project.")
  }

  func testHeaderReplacesTheTitle() {
    let content = make(error("Update Expo Go."), name: "My App", header: "Project is incompatible with this version of Expo Go")

    XCTAssertEqual(content.title, "Project is incompatible with this version of Expo Go")
    XCTAssertEqual(content.header, "Project is incompatible with this version of Expo Go")
  }

  func testUnknownErrorPrefixIsRemoved() {
    XCTAssertEqual(make(error("Unknown error: Could not connect to the server."), type: .exception).detail,
                   "Could not connect to the server.")
  }

  func testManifestURLIsAppendedToLoadingErrors() {
    XCTAssertEqual(make(error("Something failed."), url: "https://u.expo.dev/abc").detail,
                   "Something failed.\n\nhttps://u.expo.dev/abc")
  }

  func testLANHintForLocalAddresses() {
    for url in ["exp://my-mac.local:8081", "exp://192.168.1.2:8081", "exp://10.0.0.2:8081", "exp://172.16.0.2:8081"] {
      XCTAssertEqual(
        make(error("Could not connect."), url: url).detail,
        "Could not connect.\n\nIt looks like you may be using a LAN URL. Make sure your device is on the same network as the server, and that you have granted Expo Go the Local Network permission in the Settings app, or try using the tunnel connection type.\n\n\(url)"
      )
    }
  }

  func testNotConnectedHintReplacesTheLANHint() {
    XCTAssertEqual(
      make(error("The Internet connection appears to be offline.", code: NSURLErrorNotConnectedToInternet), url: "exp://192.168.1.2:8081").detail,
      "The Internet connection appears to be offline. Make sure you're connected to the internet.\n\nexp://192.168.1.2:8081"
    )
  }

  func testExceptionErrorsGetNoHintsOrURL() {
    XCTAssertEqual(make(error("TypeError: x is undefined"), type: .exception, url: "exp://192.168.1.2:8081").detail,
                   "TypeError: x is undefined")
  }

  func testFixInstructionsAndRetryFlag() {
    let content = make(error("Nope.", userInfo: [EXFixInstructionsKey: "Run npx expo login.", EXShowTryAgainButtonKey: false]))

    XCTAssertEqual(content.fixInstructions, "Run npx expo login.")
    XCTAssertFalse(content.showsRetry)
  }

  func testRetryShowsByDefault() {
    XCTAssertTrue(make(error("Nope.")).showsRetry)
  }
}
