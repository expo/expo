// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class UpdateDateFormattingTests: XCTestCase {
  private let now = Date(timeIntervalSince1970: 1_758_542_400) // 2025-09-22T12:00:00Z

  func testFormatsRecentUpdateRelatively() {
    let twoHoursAgo = "2025-09-22T10:00:00.000Z"

    let formatted = formattedUpdateDate(twoHoursAgo, relativeTo: now)

    XCTAssertEqual(formatted, relativeDescription(secondsAgo: 2 * 60 * 60))
    XCTAssertNotEqual(formatted, twoHoursAgo)
  }

  func testFormatsUpdateJustUnderAWeekRelatively() {
    let sixDaysAgo = "2025-09-16T12:00:00.000Z"

    let formatted = formattedUpdateDate(sixDaysAgo, relativeTo: now)

    XCTAssertEqual(formatted, relativeDescription(secondsAgo: 6 * 24 * 60 * 60))
  }

  func testFormatsOlderUpdateAsAbsoluteDate() {
    let eightDaysAgo = "2025-09-14T12:00:00.000Z"
    let expected = absoluteDescription(for: Date(timeIntervalSince1970: 1_757_851_200))

    let formatted = formattedUpdateDate(eightDaysAgo, relativeTo: now)

    XCTAssertEqual(formatted, expected)
    XCTAssertNotEqual(formatted, relativeDescription(secondsAgo: 8 * 24 * 60 * 60))
  }

  func testFormatsTimestampWithoutFractionalSeconds() {
    let withoutFraction = "2025-09-22T10:00:00Z"

    let formatted = formattedUpdateDate(withoutFraction, relativeTo: now)

    XCTAssertEqual(formatted, relativeDescription(secondsAgo: 2 * 60 * 60))
  }

  func testReturnsOriginalStringWhenTimestampIsUnparseable() {
    XCTAssertEqual(formattedUpdateDate("not a date", relativeTo: now), "not a date")
    XCTAssertEqual(formattedUpdateDate("", relativeTo: now), "")
  }

  // MARK: - Helpers

  private func relativeDescription(secondsAgo: TimeInterval) -> String {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter.localizedString(for: now.addingTimeInterval(-secondsAgo), relativeTo: now)
  }

  private func absoluteDescription(for date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .none
    return formatter.string(from: date)
  }
}
