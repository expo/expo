//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates
@testable import ExpoModulesCore

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
class EXUpdatesLogReaderTests: XCTestCase {
  override func setUp() {
    clearLogSync()
  }

  func test_ReadLogsAsDictionaries() {
    let logReader = UpdatesLogReader()

    // Mark the date
    let epoch = Date()

    // Write a log message
    logErrorSync(message: "Test message", code: .noUpdatesAvailable)

    // Write another log message
    logWarnSync(message: "Warning message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

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

    XCTAssertTrue(logEntry["timestamp"] as? UInt == UInt(epoch.timeIntervalSince1970) * 1_000)
    XCTAssertTrue(logEntry["message"] as? String == "Test message")
    XCTAssertTrue(logEntry["code"] as? String == "NoUpdatesAvailable")
    XCTAssertTrue(logEntry["level"] as? String == "error")
    XCTAssertNil(logEntry["updateId"])
    XCTAssertNil(logEntry["assetId"])
    XCTAssertFalse((logEntry["stacktrace"] as? [String] ?? []).isEmpty)

    let logEntry2: [String: Any] = logEntries[logEntries.count - 1]
    XCTAssertTrue(logEntry2["timestamp"] as? UInt == UInt(epoch.timeIntervalSince1970) * 1_000)
    XCTAssertTrue(logEntry2["message"] as? String == "Warning message")
    XCTAssertTrue(logEntry2["code"] as? String == "AssetsFailedToLoad")
    XCTAssertTrue(logEntry2["level"] as? String == "warn")
    XCTAssertTrue(logEntry2["updateId"] as? String == "myUpdateId")
    XCTAssertTrue(logEntry2["assetId"] as? String == "myAssetId")
    XCTAssertNil(logEntry2["stacktrace"])
  }

  func test_PurgeOldLogs() {
    let logReader = UpdatesLogReader()

    let date1 = Date()
    purgeEntriesSync(logReader: logReader, olderThan: date1)

    logErrorSync(message: "Test message", code: .noUpdatesAvailable)
    RunLoop.current.run(until: Date().addingTimeInterval(1))

    let date2 = Date()
    logWarnSync(message: "Test message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    let entries1: [String] = logReader.getLogEntries(newerThan: date1)
      .filter {entryString in
        entryString.contains("Test message")
      }
    XCTAssertEqual(2, entries1.count)

    let entries2: [String] = logReader.getLogEntries(newerThan: date2)
      .filter {entryString in
        entryString.contains("Test message")
      }
    XCTAssertEqual(1, entries2.count)

    purgeEntriesSync(logReader: logReader, olderThan: date2)

    let entries3: [String] = logReader.getLogEntries(newerThan: date1)
      .filter {entryString in
        entryString.contains("Test message")
      }

    XCTAssertEqual(1, entries3.count)
  }

  // MARK: - - Private methods

  func clearLogSync() {
    let expectation = self.expectation(description: "log cleared")
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    persistentLog.clearEntries { _ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }

  func logErrorSync(message: String, code: UpdatesErrorCode) {
    let expectation = self.expectation(description: "error logged")
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .error, updateId: nil, assetId: nil)
    persistentLog.appendEntry(entry: logEntryString) {_ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }

  func logWarnSync(message: String, code: UpdatesErrorCode, updateId: String?, assetId: String?) {
    let expectation = self.expectation(description: "error logged")
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .warn, updateId: updateId, assetId: assetId)
    persistentLog.appendEntry(entry: logEntryString) {_ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }

  func purgeEntriesSync(logReader: UpdatesLogReader, olderThan: Date) {
    let expectation = self.expectation(description: "logs purged")
    logReader.purgeLogEntries(olderThan: olderThan) { _ in
      expectation.fulfill()
    }
    wait(for: [expectation], timeout: 0.5)
  }
}
