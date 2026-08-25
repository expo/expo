// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class DeviceLoginStateMachineTests: XCTestCase {
  private let start = Date(timeIntervalSince1970: 1_786_000_000)

  private func machine(interval: Int = 5, expiresIn: Int = 600) -> DeviceLoginStateMachine {
    DeviceLoginStateMachine(interval: interval, expiresIn: expiresIn, now: start)
  }

  func testFirstStepWaitsOutTheInterval() {
    XCTAssertEqual(machine().firstStep, .poll(after: 5, matchValue: nil))
  }

  func testPendingKeepsTheInterval() {
    var subject = machine()
    XCTAssertEqual(subject.advance(with: .pending, now: start), .poll(after: 5, matchValue: nil))
    XCTAssertEqual(subject.advance(with: .pending, now: start), .poll(after: 5, matchValue: nil))
  }

  func testSlowDownAddsFiveSecondsEachTime() {
    var subject = machine()
    XCTAssertEqual(subject.advance(with: .slowDown, now: start), .poll(after: 10, matchValue: nil))
    XCTAssertEqual(subject.advance(with: .slowDown, now: start), .poll(after: 15, matchValue: nil))
    XCTAssertEqual(subject.advance(with: .pending, now: start), .poll(after: 15, matchValue: nil))
  }

  func testDeadlineExpiresLocally() {
    var subject = machine(expiresIn: 600)
    let past = start.addingTimeInterval(601)
    XCTAssertEqual(subject.advance(with: .pending, now: past), .failed(.expired))
  }

  func testMatchRequiredMovesToMatching() {
    var subject = machine()
    XCTAssertEqual(
      subject.advance(with: .matchRequired(["42", "17", "93"]), now: start),
      .awaitMatch(["42", "17", "93"])
    )
  }

  func testPickPollsImmediatelyWithTheValue() {
    var subject = machine()
    _ = subject.advance(with: .matchRequired(["42", "17", "93"]), now: start)
    XCTAssertEqual(subject.pick("42"), .poll(after: 0, matchValue: "42"))
  }

  func testPendingAfterAPickKeepsSendingTheValue() {
    var subject = machine()
    _ = subject.advance(with: .matchRequired(["42", "17", "93"]), now: start)
    _ = subject.pick("42")
    XCTAssertEqual(subject.advance(with: .pending, now: start), .poll(after: 5, matchValue: "42"))
  }

  func testDeniedBeforeAPickIsADenial() {
    var subject = machine()
    XCTAssertEqual(subject.advance(with: .denied, now: start), .failed(.denied))
  }

  func testDeniedAfterAPickIsAWrongNumber() {
    var subject = machine()
    _ = subject.advance(with: .matchRequired(["42", "17", "93"]), now: start)
    _ = subject.pick("17")
    XCTAssertEqual(subject.advance(with: .denied, now: start), .failed(.wrongNumber))
  }

  func testSecondMatchRequiredAfterAPickIsInvalid() {
    var subject = machine()
    _ = subject.advance(with: .matchRequired(["42", "17", "93"]), now: start)
    _ = subject.pick("42")
    XCTAssertEqual(subject.advance(with: .matchRequired(["42", "17", "93"]), now: start), .failed(.invalid))
  }

  func testSessionSignsIn() {
    var subject = machine()
    let expiry = start.addingTimeInterval(3600)
    XCTAssertEqual(
      subject.advance(with: .session(secret: "secret", expiresAt: expiry), now: start),
      .signedIn(secret: "secret", expiresAt: expiry)
    )
  }

  func testExpiredTokenFails() {
    var subject = machine()
    XCTAssertEqual(subject.advance(with: .expired, now: start), .failed(.expired))
  }

  func testInvalidGrantFails() {
    var subject = machine()
    XCTAssertEqual(subject.advance(with: .invalid, now: start), .failed(.invalid))
  }
}
