//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import ExpoModulesCore
import Testing

@testable import EXUpdates

@Suite("UpdatesLogReader", .serialized)
struct UpdatesLogReaderTests {
  /// Unique log category per test invocation. Swift Testing instantiates the suite struct fresh
  /// for each `@Test`, so this UUID is regenerated every test — guaranteeing the underlying
  /// `<AppSupport>/dev.expo.modules.core.logging.<category>.txt` file is unique. Without this,
  /// other test suites that construct `UpdatesLogger()` (e.g. `ErrorRecoveryTests`,
  /// `UpdatesBuildDataTests`, `DatabaseIntegrityCheckSpec`) write to the production
  /// `"expo-updates"` file and intermittently break this suite's entry counts in CI.
  private let category: String
  private let logger: UpdatesLogger
  private let logReader: UpdatesLogReader

  init() async {
    let category = "expo-updates-tests-\(UUID().uuidString)"
    self.category = category
    self.logger = UpdatesLogger(category: category)
    self.logReader = UpdatesLogReader(category: category)
    await clearLogAsync()
  }

  @Test
  @MainActor
  func `PurgeOldLogs`() async throws {
    let date1 = Date()
    await purgeEntriesAsync(olderThan: date1)

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

    await purgeEntriesAsync(olderThan: date2)

    let entries3: [String] = logReader.getLogEntries(newerThan: date1)
      .filter { entryString in
        entryString.contains("Test message")
      }

    #expect(entries3.count == 1)
  }

  @Test
  @MainActor
  func `BasicLoggingWorks`() async throws {
    // Mark the date
    let epoch = Date()

    try await Task.sleep(nanoseconds: 1_100_000_000)

    // Write a log message
    logger.error(cause: UpdatesError.appLoaderFailedToLoadAllAssets, code: .noUpdatesAvailable)

    // Write another log message
    logger.warn(message: "Warning message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

    try await Task.sleep(nanoseconds: 100_000_000)

    let logEntries: [String] = logReader.getLogEntries(newerThan: epoch)

    // Verify number of log entries and decoded values
    #expect(logEntries.count >= 2)

    // Check number of entries and values in each entry

    let logEntryText: String = logEntries[logEntries.count - 2]

    let logEntry = UpdatesLogEntry.create(from: logEntryText)
    let timestamp = Double(logEntry!.timestamp / 1_000)
    #expect(abs(timestamp - epoch.timeIntervalSince1970) < 10)
    #expect(logEntry?.message == "Failed to load all assets")
    #expect(logEntry?.code == "NoUpdatesAvailable")
    #expect(logEntry?.level == "error")
    #expect(logEntry?.updateId == nil)
    #expect(logEntry?.assetId == nil)
    #expect(logEntry?.stacktrace != nil)

    let logEntryText2: String = logEntries[logEntries.count - 1] as String
    let logEntry2 = UpdatesLogEntry.create(from: logEntryText2)
    let timestamp2 = Double(logEntry2!.timestamp / 1_000)
    #expect(abs(timestamp2 - epoch.timeIntervalSince1970) < 10)
    #expect(logEntry2?.message == "Warning message")
    #expect(logEntry2?.code == "AssetsFailedToLoad")
    #expect(logEntry2?.level == "warn")
    #expect(logEntry2?.updateId == "myUpdateId")
    #expect(logEntry2?.assetId == "myAssetId")
    #expect(logEntry2?.stacktrace == nil)
  }

  @Test
  @MainActor
  func `TimerWorks`() async throws {
    // Mark the date
    let epoch = Date()

    let timer = logger.startTimer(label: "testlabel")
    try await Task.sleep(nanoseconds: 1_000_000_000)
    let result = timer.stop()
    #expect(result > 0)

    try await Task.sleep(nanoseconds: 100_000_000)

    let logEntries: [String] = logReader.getLogEntries(newerThan: epoch)

    // Verify number of log entries and decoded values
    #expect(logEntries.count == 1)

    let logEntryText: String = logEntries[0]
    let logEntry = UpdatesLogEntry.create(from: logEntryText)
    #expect(logEntry?.message == "testlabel")
    #expect(logEntry?.code == UpdatesErrorCode.none.asString)
    #expect(logEntry?.level == "\(LogType.timer)")
    #expect(logEntry?.updateId == nil)
    #expect(logEntry?.assetId == nil)
    #expect(logEntry?.stacktrace == nil)
    #expect((logEntry?.duration)! >= 300)
  }

  // MARK: - Private methods

  func clearLogAsync() async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: category)
      persistentLog.clearEntries { _ in
        continuation.resume()
      }
    }
  }

  func logErrorAsync(message: String, code: UpdatesErrorCode) async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: category)
      let logEntryString =
        "xx"
        + logger.logEntryString(
          message: message, code: code, level: .error,
          duration: nil, updateId: nil, assetId: nil
        )
      persistentLog.appendEntry(entry: logEntryString) { _ in
        continuation.resume()
      }
    }
  }

  func logWarnAsync(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: category)
      let logEntryString =
        "xx"
        + logger.logEntryString(
          message: message, code: code, level: .warn,
          duration: nil, updateId: updateId, assetId: assetId
        )
      persistentLog.appendEntry(entry: logEntryString) { _ in
        continuation.resume()
      }
    }
  }

  func purgeEntriesAsync(olderThan: Date) async {
    await withCheckedContinuation { continuation in
      logReader.purgeLogEntries(olderThan: olderThan) { _ in
        continuation.resume()
      }
    }
  }
}
