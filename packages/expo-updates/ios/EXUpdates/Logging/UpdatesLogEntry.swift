// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

/**
 Schema for the fields in expo-updates log message JSON strings
 */
public struct UpdatesLogEntry: Codable {
  var timestamp: UInt // seconds since 1/1/1970 UTC
  var message: String
  var code: String // One of the UpdatesErrorCode string values
  var level: String // One of the ExpoModulesCore.LogType string values
  var updateId: String? // EAS update ID, if any
  var assetId: String? // EAS asset ID, if any
  var stacktrace: [String]? // Stacktrace (for error and fatal logs)

  /**
   Returns a JSON string representation from this UpdatesLogEntry object
   */
  public func asString() -> String? {
    do {
      let jsonEncoder = JSONEncoder()
      let jsonData = try jsonEncoder.encode(self)
      return String(data: jsonData, encoding: .utf8) ?? nil
    } catch {
      return nil
    }
  }

  /**
   Returns a Dictionary representation from this UpdatesLogEntry object
   */
  public func asDict() -> [String: Any] {
    var result = Dictionary<String, Any>()
    result["timestamp"] = timestamp
    result["message"] = message
    result["code"] = code
    result["level"] = level
    result["updateId"] = updateId != nil ? updateId : NSNull()
    result["assetId"] = assetId != nil ? assetId : NSNull()
    if stacktrace != nil {
      let nsstack = NSMutableArray()
      for s in stacktrace! {
        nsstack.add(s)
      }
      result["stacktrace"] = nsstack
    }
    return result
  }

  /**
   Returns a new UpdatesLogEntry from a JSON string, or nil if a decoding error occurs
   */
  public static func create(from: String) -> UpdatesLogEntry? {
    do {
      let jsonDecoder = JSONDecoder()
      guard let jsonData = from.data(using: .utf8) else { return nil }
      let logEntry: UpdatesLogEntry = try jsonDecoder.decode(UpdatesLogEntry.self, from: jsonData)
      return logEntry
    } catch {
      return nil
    }
  }
}

