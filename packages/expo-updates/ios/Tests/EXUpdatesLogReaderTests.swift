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
    logErrorSync(message: "Test message", code: .NoUpdatesAvailable)

    // Write another log message
    logWarnSync(message: "Warning message", code: .AssetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

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
    logErrorSync(message: "Test message", code: .NoUpdatesAvailable)
    RunLoop.current.run(until: Date().addingTimeInterval(1))

    let date2 = Date()
    logWarnSync(message: "Warning message", code: .AssetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    let entries1: [String] = logReader.getLogEntries(newerThan: date1)
    XCTAssertEqual(2, entries1.count)

    let entries2: [String] = logReader.getLogEntries(newerThan: date2)
    XCTAssertEqual(1, entries2.count)

    let sem = DispatchSemaphore(value: 0)
    serialQueue.sync {
      logReader.purgeLogEntries(olderThan: date2) { _ in
        sem.signal()
      }
      sem.wait()
    }

    let entries3: [String] = logReader.getLogEntries(newerThan: date1)
    XCTAssertEqual(1, entries3.count)
  }

  // MARK: - - Private methods
  let serialQueue = DispatchQueue(label: "dev.expo.updates.logger.test")

  func clearLogSync() {
    let sem = DispatchSemaphore(value: 0)
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    serialQueue.sync {
      persistentLog.clearEntries { _ in
        sem.signal()
      }
      sem.wait()
    }
  }

  func logErrorSync(message: String, code: UpdatesErrorCode) {
    let sem = DispatchSemaphore(value: 0)
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    serialQueue.sync {
      let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .error, updateId: nil, assetId: nil)

      persistentLog.appendEntry(entry: logEntryString, {_ in
        sem.signal()
      })
      sem.wait()
    }
  }

  func logWarnSync(message: String, code: UpdatesErrorCode, updateId: String?, assetId: String?) {
    let sem = DispatchSemaphore(value: 0)
    let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
    serialQueue.sync {
      let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .warn, updateId: updateId, assetId: assetId)
      persistentLog.appendEntry(entry: logEntryString) { _ in
        sem.signal()
      }
      sem.wait()
    }
  }
}
