// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class PartnerLoginTests: XCTestCase {
  // MARK: - Reading the code

  func testReadsCodeFromDevServerURL() {
    let url = URL(string: "exp://192.168.1.5:8081/?partner-login-code=abc123")!
    XCTAssertEqual(PartnerLogin.loginCode(from: url), "abc123")
  }

  func testReadsCodeFromTunnelURLAlongsideOtherParams() {
    let url = URL(string: "https://abc.exp.direct/?platform=ios&partner-login-code=abc123")!
    XCTAssertEqual(PartnerLogin.loginCode(from: url), "abc123")
  }

  func testReadsBase64URLCodeVerbatim() {
    let url = URL(string: "exp://192.168.1.5:8081/?partner-login-code=d4mj1NCZWbs-1WB0EEy-7tq8DUJcvcNwAVuDYEn_ojM")!
    XCTAssertEqual(PartnerLogin.loginCode(from: url), "d4mj1NCZWbs-1WB0EEy-7tq8DUJcvcNwAVuDYEn_ojM")
  }

  func testReturnsNilWhenParamIsAbsent() {
    let url = URL(string: "exp://192.168.1.5:8081/?platform=ios")!
    XCTAssertNil(PartnerLogin.loginCode(from: url))
  }

  func testReturnsNilWhenParamValueIsEmpty() {
    let url = URL(string: "exp://192.168.1.5:8081/?partner-login-code=")!
    XCTAssertNil(PartnerLogin.loginCode(from: url))
  }

  func testReturnsNilWhenThereIsNoQueryString() {
    let url = URL(string: "exp://192.168.1.5:8081/")!
    XCTAssertNil(PartnerLogin.loginCode(from: url))
  }

  // MARK: - Removing the code

  func testRemovesOnlyTheLoginCodeParamAndPreservesEncoding() {
    let url = URL(string: "exp://192.168.1.5:8081/?snack=%40user%2Fdemo&partner-login-code=abc123&snack-channel=ch1")!
    let stripped = PartnerLogin.urlByRemovingLoginCode(from: url)
    XCTAssertEqual(stripped.absoluteString, "exp://192.168.1.5:8081/?snack=%40user%2Fdemo&snack-channel=ch1")
  }

  func testRemovesTheQueryStringEntirelyWhenTheCodeWasTheOnlyParam() {
    let url = URL(string: "exp://192.168.1.5:8081/?partner-login-code=abc123")!
    let stripped = PartnerLogin.urlByRemovingLoginCode(from: url)
    XCTAssertEqual(stripped.absoluteString, "exp://192.168.1.5:8081/")
  }

  func testPreservesTheDeepLinkSeparatorInThePath() {
    let url = URL(string: "exps://u.expo.dev/--/redirect?partner-login-code=abc123")!
    let stripped = PartnerLogin.urlByRemovingLoginCode(from: url)
    XCTAssertEqual(stripped.absoluteString, "exps://u.expo.dev/--/redirect")
  }

  func testReturnsTheURLUnchangedWhenTheParamIsAbsent() {
    let url = URL(string: "exp://192.168.1.5:8081/?platform=ios")!
    let stripped = PartnerLogin.urlByRemovingLoginCode(from: url)
    XCTAssertEqual(stripped.absoluteString, url.absoluteString)
  }

  func testReturnsTheURLUnchangedWhenThereIsNoQueryString() {
    let url = URL(string: "exp://192.168.1.5:8081/")!
    let stripped = PartnerLogin.urlByRemovingLoginCode(from: url)
    XCTAssertEqual(stripped.absoluteString, url.absoluteString)
  }

  // MARK: - Parsing the expiry

  func testParsesExpiryWithFractionalSeconds() {
    XCTAssertEqual(PartnerLogin.parseExpiry("2026-08-02T00:00:00.000Z"), Self.august2nd2026UTC)
  }

  func testParsesExpiryWithoutFractionalSeconds() {
    XCTAssertEqual(PartnerLogin.parseExpiry("2026-08-02T00:00:00Z"), Self.august2nd2026UTC)
  }

  func testReturnsNilForMalformedExpiry() {
    XCTAssertNil(PartnerLogin.parseExpiry("not a date"))
    XCTAssertNil(PartnerLogin.parseExpiry(""))
  }

  private static var august2nd2026UTC: Date {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: "UTC")!
    var components = DateComponents()
    components.year = 2026
    components.month = 8
    components.day = 2
    components.hour = 0
    components.minute = 0
    components.second = 0
    return calendar.date(from: components)!
  }
}
