//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import Testing
import ExpoModulesCore
@testable import EXUpdates

@Suite("UpdatesLogReader", .serialized)
struct UpdatesLogReaderTests {
  init() async {
    await clearLogAsync()
  }

  @Test
  @MainActor
  func `PurgeOldLogs`() async throws {
    let logReader = UpdatesLogReader()

    let date1 = Date()
    await purgeEntriesAsync(logReader: logReader, olderThan: date1)

    await logErrorAsync(message: "Test message", code: .noUpdatesAvailable)
    try await Task.sleep(nanoseconds: 1_000_000_000)

    let date2 = Date()
    await logWarnAsync(message: "Test message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    let entries1: [String] = logReader.getLogEntries(newerThan: date1)
      .filter { entryString in
        entryString.contains("Test message")
      }
    #expect(entries1.count == 2)

    let entries2: [String] = logReader.getLogEntries(newerThan: date2)
      .filter { entryString in
        entryString.contains("Test message")
      }
    #expect(entries2.count == 1)

    await purgeEntriesAsync(logReader: logReader, olderThan: date2)

    let entries3: [String] = logReader.getLogEntries(newerThan: date1)
      .filter { entryString in
        entryString.contains("Test message")
      }

    #expect(entries3.count == 1)
  }

  // MARK: - Private methods

  func clearLogAsync() async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
      persistentLog.clearEntries { _ in
        continuation.resume()
      }
    }
  }

  func logErrorAsync(message: String, code: UpdatesErrorCode) async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
      let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .error, duration: nil, updateId: nil, assetId: nil)
      persistentLog.appendEntry(entry: logEntryString) { _ in
        continuation.resume()
      }
    }
  }

  func logWarnAsync(message: String, code: UpdatesErrorCode, updateId: String?, assetId: String?) async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
      let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .warn, duration: nil, updateId: updateId, assetId: assetId)
      persistentLog.appendEntry(entry: logEntryString) { _ in
        continuation.resume()
      }
    }
  }

  func purgeEntriesAsync(logReader: UpdatesLogReader, olderThan: Date) async {
    await withCheckedContinuation { continuation in
      logReader.purgeLogEntries(olderThan: olderThan) { _ in
        continuation.resume()
      }
    }
  }
}
