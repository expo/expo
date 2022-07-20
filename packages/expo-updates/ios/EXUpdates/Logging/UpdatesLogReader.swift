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

  @objc(getLogEntriesNewerThan:)
  public func getLogEntries(newerThan: Date) -> [[String: Any]] {
    let strings: [String] = getLogEntries(newerThan: newerThan)
    var result: [[String: Any]] = []
    strings.forEach { s in
      let entry = UpdatesLogEntry.create(from: s)
      if (entry != nil) {
        let dict = entry?.asDict()
        if (dict != nil) {
          result.append(dict!)
        }
      }
    }
    return result
  }

  /**
   Get expo-updates logs newer than the given date
   Returns an Objective-C NSArray of either strings or NSDictionary objects
   Returned strings are all in the JSON format of UpdatesLogEntry
   Maximum of one day lookback is allowed
   */
  @objc(getLogEntryStringsNewerThan:)
  public func getLogEntries(newerThan: Date) -> [String] {
    var result: [String] = []
    do {
      let earliestDate = Date().addingTimeInterval(-86400)
      let dateToUse = newerThan.timeIntervalSince1970 < earliestDate.timeIntervalSince1970 ?
      earliestDate :
      newerThan

      let logStore = try OSLogStore(scope: .currentProcessIdentifier)
      // Get all the logs since the given date.
      let position = logStore.position(date: dateToUse)

      // Fetch log objects, selecting our subsystem and category
      let predicate = NSPredicate(format: "category == %@ AND subsystem = %@",
                                  argumentArray: [UpdatesLogger.LOG_CATEGORY, Logger.LOG_SUBSYSTEM])
      let allEntries = try logStore.getEntries(at: position, matching: predicate)

      // Extract just the log message strings
      let allEntriesMessages = allEntries
          .compactMap { $0 as? OSLogEntryLog }
          .compactMap { $0.composedMessage }
      for entry in allEntriesMessages.enumerated() {
        let json = entry.element as String
        result.append(json)
      }
    } catch {
      result.append("Error occurred in UpdatesLogReader: \(error.localizedDescription)")
    }
    return result
  }
  
  /**
   Convenience method for returning expo-updates logs from last hour
   */
  @objc public func logEntriesInLastHour() -> [String] {
    return getLogEntries(newerThan: Date().addingTimeInterval(-3600))
  }

  /**
   Convenience method for returning expo-updates logs from last day
   */
  @objc public func logEntriesInLastDay() -> [String] {
    return getLogEntries(newerThan: Date().addingTimeInterval(-86400))
  }
}
