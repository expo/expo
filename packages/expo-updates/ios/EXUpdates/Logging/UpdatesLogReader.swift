// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation
import OSLog

import ExpoModulesCore
import SafariServices

/**
 Class to read expo-updates logs using OSLogReader
 */
@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
@objc(EXUpdatesLogReader)
public class UpdatesLogReader: NSObject {
  /**
   Get expo-updates logs newer than the given date
   Returns the log entries unpacked as dictionaries
   Maximum of one day lookback is allowed
   */
  @objc(getLogEntriesNewerThan:)
  public func getLogEntries(newerThan: Date) -> [[String: Any]] {
    return getLogEntries(newerThan: newerThan)
      .compactMap { logEntryString in
        UpdatesLogEntry.create(from: logEntryString)?.asDict()
      }
  }

  /**
   Get expo-updates logs newer than the given date
   Returned strings are all in the JSON format of UpdatesLogEntry
   Maximum of one day lookback is allowed
   */
  @objc(getLogEntryStringsNewerThan:)
  public func getLogEntries(newerThan: Date) -> [String] {
    var result: [String] = []
    do {
      let earliestDate = Date().addingTimeInterval(-86_400)
      let dateToUse = newerThan.timeIntervalSince1970 < earliestDate.timeIntervalSince1970 ?
        earliestDate :
        newerThan

      let logStore = try OSLogStore(scope: .currentProcessIdentifier)
      // Get all the logs since the given date.
      let position = logStore.position(date: dateToUse)

      // Fetch log objects, selecting our subsystem and category
      let predicate = NSPredicate(format: "category == %@ AND subsystem = %@",
                                  argumentArray: [UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY, Logger.EXPO_MODULES_LOG_SUBSYSTEM])
      let allEntries = try logStore.getEntries(at: position, matching: predicate)

      // Extract just the log message strings, removing the first two characters added
      // by ExpoModulesCore.Logger
      result = allEntries
          .compactMap { $0 as? OSLogEntryLog }
          .compactMap { String($0.composedMessage.suffix(from: $0.composedMessage.index($0.composedMessage.startIndex, offsetBy: 2)))
          }
    } catch {
      result.append("Error occurred in UpdatesLogReader: \(error.localizedDescription)")
    }
    return result
  }
}
