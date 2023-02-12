//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates
@testable import ExpoModulesCore

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
class EXUpdatesLoggerTests: XCTestCase {
  func test_BasicLoggingWorks() {
    let logger = UpdatesLogger()
    let logReader = UpdatesLogReader()

    // Mark the date
    let epoch = Date()

    // Write a log message
    logger.error(message: "Test message", code: .noUpdatesAvailable)

    // Write another log message
    logger.warn(message: "Warning message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    RunLoop.current.run(until: Date().addingTimeInterval(1))

    // Use reader to retrieve messages
    let logEntries: [String] = logReader.getLogEntries(newerThan: epoch)

    // Verify number of log entries and decoded values
    XCTAssertTrue(logEntries.count >= 2)

    // Check number of entries and values in each entry

    let logEntryText: String = logEntries[logEntries.count - 2]

    let logEntry = UpdatesLogEntry.create(from: logEntryText)
    XCTAssertTrue(UInt((logEntry?.timestamp)!/1_000) == UInt(epoch.timeIntervalSince1970))
    XCTAssertTrue(logEntry?.message == "Test message")
    XCTAssertTrue(logEntry?.code == "NoUpdatesAvailable")
    XCTAssertTrue(logEntry?.level == "error")
    XCTAssertNil(logEntry?.updateId)
    XCTAssertNil(logEntry?.assetId)
    XCTAssertNotNil(logEntry?.stacktrace)

    let logEntryText2: String = logEntries[logEntries.count - 1] as String
    let logEntry2 = UpdatesLogEntry.create(from: logEntryText2)
    XCTAssertTrue(UInt((logEntry2?.timestamp)!/1_000) == UInt(epoch.timeIntervalSince1970))
    XCTAssertTrue(logEntry2?.message == "Warning message")
    XCTAssertTrue(logEntry2?.code == "AssetsFailedToLoad")
    XCTAssertTrue(logEntry2?.level == "warn")
    XCTAssertTrue(logEntry2?.updateId == "myUpdateId")
    XCTAssertTrue(logEntry2?.assetId == "myAssetId")
    XCTAssertNil(logEntry2?.stacktrace)
  }
}
