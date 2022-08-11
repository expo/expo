// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation
import OSLog

import ExpoModulesCore
import SafariServices

/**
 Class to read expo-updates logs using OSLogReader
 */
@objc(EXUpdatesLogReader)
public class UpdatesLogReader: NSObject {
  private let serialQueue = DispatchQueue(label: "dev.expo.updates.logging.reader")
  private let logPersistence = PersistentFileLog(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY)

  /**
   Get expo-updates logs newer than the given date
   Returns the log entries unpacked as dictionaries
   Maximum of one day lookback is allowed
   */
  @objc(getLogEntriesNewerThan:error:)
  public func getLogEntries(newerThan: Date) throws -> [[String: Any]] {
    let epoch = epochFromDateOrOneDayAgo(date: newerThan)
    return logPersistence.readEntries()
      .compactMap { entryString in
        logStringToFilteredLogEntry(entryString: entryString, epoch: epoch)?.asDict()
      }
  }

  /**
   Get expo-updates logs newer than the given date
   Returned strings are all in the JSON format of UpdatesLogEntry
   Maximum of one day lookback is allowed
   */
  @objc(getLogEntryStringsNewerThan:)
  public func getLogEntries(newerThan: Date) -> [String] {
    let epoch = epochFromDateOrOneDayAgo(date: newerThan)
    return logPersistence.readEntries()
      .compactMap { entryString in
        logStringToFilteredLogEntry(entryString: entryString, epoch: epoch)?.asString()
      }
  }

  /**
   Purge all log entries written more than one day ago
   */
  @objc(purgeLogEntries:)
  public func purgeLogEntries(completion: @escaping (Error?) -> Void) {
    purgeLogEntries(
      olderThan: Date().addingTimeInterval(-UpdatesLogReader.MAXIMUM_LOOKBACK_INTERVAL),
      completion: completion
    )
  }

  /**
   Purge all log entries written prior to the given date
   */
  @objc(purgeLogEntriesOlderThan:completion:)
  public func purgeLogEntries(olderThan: Date, completion: @escaping (Error?) -> Void) {
    let epoch = epochFromDateOrOneDayAgo(date: olderThan)
    logPersistence.purgeEntriesNotMatchingFilter(filter: { entryString in
      self.logStringToFilteredLogEntry(entryString: entryString, epoch: epoch) != nil
    }, {error in
      completion(error)
    })
  }

  private func logStringToFilteredLogEntry(entryString: String, epoch: UInt) -> UpdatesLogEntry? {
    if entryString.lengthOfBytes(using: .utf8) < 2 {
      return nil
    }
    let suffixFrom = entryString.index(entryString.startIndex, offsetBy: 2)
    let entryStringSuffix = String(entryString.suffix(from: suffixFrom))
    let entry = UpdatesLogEntry.create(from: entryStringSuffix)
    return entry?.timestamp ?? 0 >= epoch ? entry : nil
  }

  private static let MAXIMUM_LOOKBACK_INTERVAL: TimeInterval = 86_400 // 1 day

  private func epochFromDateOrOneDayAgo(date: Date) -> UInt {
    // Returns the epoch (milliseconds since 1/1/1970)
    // If date is earlier than one day ago, then the epoch for one day ago is returned
    // instead
    let earliestDate = Date().addingTimeInterval(-UpdatesLogReader.MAXIMUM_LOOKBACK_INTERVAL)
    let dateToUse = date.timeIntervalSince1970 < earliestDate.timeIntervalSince1970 ?
      earliestDate :
      date
    return UInt(dateToUse.timeIntervalSince1970) * 1_000
  }
}
