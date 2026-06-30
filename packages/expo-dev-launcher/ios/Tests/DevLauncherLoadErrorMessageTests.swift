// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class DevLauncherLoadErrorMessageTests: XCTestCase {
  private func urlError(_ code: Int) -> NSError {
    return NSError(domain: NSURLErrorDomain, code: code)
  }

  func testCannotFindHost() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorCannotFindHost), url: "http://myserver.example:8081")
    XCTAssertTrue(message.contains("http://myserver.example:8081"))
    XCTAssertTrue(message.lowercased().contains("could not be resolved"))
  }

  func testDNSLookupFailed() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorDNSLookupFailed), url: "http://myserver.example:8081")
    XCTAssertTrue(message.lowercased().contains("could not be resolved"))
  }

  func testConnectionRefused() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorCannotConnectToHost), url: "http://192.168.1.5:8081")
    XCTAssertTrue(message.contains("npx expo start"))
  }

  func testTimeoutOnPrivateAddressMentionsWifi() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorTimedOut), url: "http://192.168.1.5:8081")
    XCTAssertTrue(message.lowercased().contains("same wi-fi network"))
  }

  func testTimeoutOnTenDotAddressMentionsWifi() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorTimedOut), url: "http://10.0.1.2:8081")
    XCTAssertTrue(message.lowercased().contains("same wi-fi network"))
  }

  func testTimeoutOnPublicAddressDoesNotMentionWifi() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorTimedOut), url: "https://u.expo.dev/abc")
    XCTAssertFalse(message.lowercased().contains("same wi-fi network"))
    XCTAssertTrue(message.lowercased().contains("timed out"))
  }

  func testLocalhostOnTimeoutSuggestsLanIP() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorTimedOut), url: "http://localhost:8081")
    XCTAssertTrue(message.lowercased().contains("lan ip"))
  }

  func testLocalhostOnConnectionRefusedSuggestsLanIP() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorCannotConnectToHost), url: "http://127.0.0.1:8081")
    XCTAssertTrue(message.lowercased().contains("lan ip"))
  }

  func testOffline() {
    let message = DevLauncherLoadErrorMessage.message(for: urlError(NSURLErrorNotConnectedToInternet), url: "http://192.168.1.5:8081")
    XCTAssertTrue(message.lowercased().contains("offline"))
  }

  func testDevelopmentClientErrorsPassThrough() {
    let original = "Couldn't parse the manifest. The data isn't in the correct format."
    let error = NSError(domain: "DevelopmentClient", code: 1, userInfo: [NSLocalizedDescriptionKey: original])
    XCTAssertEqual(DevLauncherLoadErrorMessage.message(for: error, url: "http://192.168.1.5:8081"), original)
  }

  func testUnknownErrorFallsBackToDescription() {
    let error = NSError(domain: "SomeDomain", code: 42, userInfo: [NSLocalizedDescriptionKey: "Something odd happened"])
    let message = DevLauncherLoadErrorMessage.message(for: error, url: "http://192.168.1.5:8081")
    XCTAssertTrue(message.contains("http://192.168.1.5:8081"))
    XCTAssertTrue(message.contains("Something odd happened"))
  }
}
