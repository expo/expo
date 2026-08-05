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

  /// Regression test for a SIGABRT during log purge.
  ///
  /// `logStringToFilteredLogEntry` used to guard on `lengthOfBytes(using: .utf8) < 2` and then
  /// advance the index by two *Characters*. Every persisted line begins with `LogType.prefix` —
  /// a colored-circle emoji that is 4–6 UTF-8 bytes but a single Character — so a line consisting
  /// of only that prefix passed the byte guard and trapped in `index(_:offsetBy:)` with
  /// "String index is out of bounds". Such a line is what a torn append leaves behind, since
  /// `PersistentFileLog.appendTextToFile` writes non-atomically. The trap fired before the purge
  /// could rewrite the file, so the bad line survived and the app aborted on every launch.
  ///
  /// Note: on the unfixed reader this aborts the test process (a Swift runtime trap is not a
  /// recoverable `#expect` failure).
  @Test
  @MainActor
  func `PurgeSurvivesTruncatedSingleCharacterEntry`() async throws {
    let date1 = Date()

    // U+1F7E2 LARGE GREEN CIRCLE — the value of `LogType.info.prefix`, written as an escape
    // because `prefix` is internal to ExpoModulesCore. 4 UTF-8 bytes, 1 Character.
    let truncatedEntry = "\u{1F7E2}"
    await appendRawEntryAsync(entry: truncatedEntry)
    await logErrorAsync(message: "Test message", code: .noUpdatesAvailable)

    // Reading must skip the malformed entry rather than trapping.
    let entries: [String] = logReader.getLogEntries(newerThan: date1)
    #expect(entries.count == 1)

    // The purge must run to completion and drop the malformed entry, so the next launch is clean.
    await purgeEntriesAsync(olderThan: date1)

    let remaining = PersistentFileLog(category: category).readEntries()
    #expect(remaining.count == 1)
    #expect(!remaining.contains(truncatedEntry))
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

  /// Appends a raw string as a log line, bypassing `UpdatesLogger`'s formatting. Used to simulate
  /// a torn write.
  func appendRawEntryAsync(entry: String) async {
    await withCheckedContinuation { continuation in
      let persistentLog = PersistentFileLog(category: category)
      persistentLog.appendEntry(entry: entry) { _ in
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
