//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
class UpdatesLoggerSpec : ExpoSpec {
  override class func spec() {
    beforeEach {
      clearLogSync()
    }
    it("basic logging works") {
      let logger = UpdatesLogger()

      // Mark the date
      let epoch = Date()

      RunLoop.current.run(until: Date(timeIntervalSinceNow: 1.1))

      // Write a log message
      logger.error(cause: UpdatesError.appLoaderFailedToLoadAllAssets, code: .noUpdatesAvailable)

      // Write another log message
      logger.warn(message: "Warning message", code: .assetsFailedToLoad, updateId: "myUpdateId", assetId: "myAssetId")

      RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.1))

      // Use reader to retrieve messages
      let logReader = UpdatesLogReader()

      let logEntries: [String] = logReader.getLogEntries(newerThan: epoch)

      // Verify number of log entries and decoded values
      expect(logEntries.count >= 2).to(beTrue())

      // Check number of entries and values in each entry

      let logEntryText: String = logEntries[logEntries.count - 2]

      let logEntry = UpdatesLogEntry.create(from: logEntryText)
      let timestamp = Double(logEntry!.timestamp / 1_000)
      expect(abs(timestamp - epoch.timeIntervalSince1970)) < 10
      expect(logEntry?.message) == "Failed to load all assets"
      expect(logEntry?.code) == "NoUpdatesAvailable"
      expect(logEntry?.level) == "error"
      expect(logEntry?.updateId) == nil
      expect(logEntry?.assetId) == nil
      expect(logEntry?.stacktrace) != nil

      let logEntryText2: String = logEntries[logEntries.count - 1] as String
      let logEntry2 = UpdatesLogEntry.create(from: logEntryText2)
      let timestamp2 = Double(logEntry2!.timestamp / 1_000)
      expect(abs(timestamp2 - epoch.timeIntervalSince1970)) < 10
      expect(logEntry2?.message) == "Warning message"
      expect(logEntry2?.code) == "AssetsFailedToLoad"
      expect(logEntry2?.level) == "warn"
      expect(logEntry2?.updateId) == "myUpdateId"
      expect(logEntry2?.assetId) == "myAssetId"
      expect(logEntry2?.stacktrace) == nil
    }

    it("timer works") {
      let logger = UpdatesLogger()
      let logReader = UpdatesLogReader()

      // Mark the date
      let epoch = Date()

      let timer = logger.startTimer(label: "testlabel")
      RunLoop.current.run(until: Date(timeIntervalSinceNow: 1.0))
      let result = timer.stop()
      expect(result).to(beGreaterThan(0))

      RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.1))

      // Use reader to retrieve messages
      let logEntries: [String] = logReader.getLogEntries(newerThan: epoch)

      // Verify number of log entries and decoded values
      expect(logEntries.count == 1).to(beTrue())

      let logEntryText: String = logEntries[0]
      let logEntry = UpdatesLogEntry.create(from: logEntryText)
      expect(logEntry?.message) == "testlabel"
      expect(logEntry?.code) == UpdatesErrorCode.none.asString
      expect(logEntry?.level) == "\(LogType.timer)"
      expect(logEntry?.updateId) == nil
      expect(logEntry?.assetId) == nil
      expect(logEntry?.stacktrace) == nil
      expect(logEntry!.duration!) >= Double(300)
    }
  }

  class func clearLogSync() {
    waitUntil(timeout: .milliseconds(500)) { done in
      let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
      persistentLog.clearEntries { _ in
        done()
      }
    }
  }
}
