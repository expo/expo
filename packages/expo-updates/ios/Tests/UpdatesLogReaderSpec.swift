//  Copyright (c) 2022 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
class UpdatesLogReaderSpec : ExpoSpec {
  override class func spec() {
    beforeEach {
      clearLogSync()
    }
    
    it("PurgeOldLogs") {
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
      waitUntil(timeout: .milliseconds(500)) { done in
        let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
        persistentLog.clearEntries { _ in
          done()
        }
      }
    }
    
    func logErrorSync(message: String, code: UpdatesErrorCode) {
      waitUntil(timeout: .milliseconds(500)) { done in
        let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
        let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .error, duration: nil, updateId: nil, assetId: nil)
        persistentLog.appendEntry(entry: logEntryString) {_ in
          done()
        }
      }
    }
    
    func logWarnSync(message: String, code: UpdatesErrorCode, updateId: String?, assetId: String?) {
      waitUntil(timeout: .milliseconds(500)) { done in
        let persistentLog = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)
        let logEntryString = "xx" + UpdatesLogger().logEntryString(message: message, code: code, level: .warn, duration: nil, updateId: updateId, assetId: assetId)
        persistentLog.appendEntry(entry: logEntryString) {_ in
          done()
        }
      }
    }
    
    func purgeEntriesSync(logReader: UpdatesLogReader, olderThan: Date) {
      waitUntil(timeout: .milliseconds(500)) { done in
        logReader.purgeLogEntries(olderThan: olderThan) { _ in
          done()
        }
      }
    }
  }
}
