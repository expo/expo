//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates
@testable import ExpoModulesCore

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
class EXUpdatesLogReaderTests: XCTestCase {
  func test_ReadLogsAsDictionaries() {
    let logger = UpdatesLogger()
    let logReader = UpdatesLogReader()

    // Mark the date
    let epoch = Date()

    // Write a log message
    logger.error(message: "Test message", code: .NoUpdatesAvailable)

    // Write another log message
    logger.warn(message: "Warning message", code: .AssetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    // Use reader to retrieve messages
    var logEntries: [[String: Any]] = []
    do {
      logEntries = try logReader.getLogEntries(newerThan: epoch)
    } catch {
      XCTFail("logEntries call failed: \(error.localizedDescription)")
    }

    // Verify number of log entries and decoded values
    XCTAssertTrue(logEntries.count >= 2)

    // Check number of entries and values in each entry

    let logEntry: [String: Any] = logEntries[logEntries.count - 2]

    XCTAssertTrue(logEntry["timestamp"] as? UInt == UInt(epoch.timeIntervalSince1970) * 1000)
    XCTAssertTrue(logEntry["message"] as? String == "Test message")
    XCTAssertTrue(logEntry["code"] as? String == "NoUpdatesAvailable")
    XCTAssertTrue(logEntry["level"] as? String == "error")
    XCTAssertNil(logEntry["updateId"])
    XCTAssertNil(logEntry["assetId"])
    XCTAssertFalse((logEntry["stacktrace"] as? [String] ?? []).isEmpty)

    let logEntry2: [String: Any] = logEntries[logEntries.count - 1]
    XCTAssertTrue(logEntry2["timestamp"] as? UInt == UInt(epoch.timeIntervalSince1970) * 1000)
    XCTAssertTrue(logEntry2["message"] as? String == "Warning message")
    XCTAssertTrue(logEntry2["code"] as? String == "AssetsFailedToLoad")
    XCTAssertTrue(logEntry2["level"] as? String == "warn")
    XCTAssertTrue(logEntry2["updateId"] as? String == "myUpdateId")
    XCTAssertTrue(logEntry2["assetId"] as? String == "myAssetId")
    XCTAssertNil(logEntry2["stacktrace"])
}
}
