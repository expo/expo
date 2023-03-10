// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

/**
 Schema for the fields in expo-updates log message JSON strings
 */
internal struct UpdatesLogEntry: Codable {
  var timestamp: UInt // milliseconds since 1/1/1970 UTC
  var message: String
  var code: String // One of the UpdatesErrorCode string values
  var level: String // One of the ExpoModulesCore.LogType string values
  var updateId: String? // EAS update ID, if any
  var assetId: String? // EAS asset ID, if any
  var stacktrace: [String]? // Stacktrace (for error and fatal logs)

  /**
   Returns a JSON string representation from this UpdatesLogEntry object
   */
  func asString() -> String? {
    do {
      let jsonEncoder = JSONEncoder()
      let jsonData = try jsonEncoder.encode(self)
      return String(data: jsonData, encoding: .utf8)
    } catch {
      return nil
    }
  }

  /**
   Returns a Dictionary representation from this UpdatesLogEntry object
   */
  func asDict() -> [String: Any] {
    var result = [String: Any]()
    result["timestamp"] = timestamp
    result["message"] = message
    result["code"] = code
    result["level"] = level
    if let updateId = updateId {
      result["updateId"] = updateId
    }
    if let assetId = assetId {
      result["assetId"] = assetId
    }
    if let stacktrace = stacktrace {
      result["stacktrace"] = stacktrace
    }
    return result
  }

  /**
   Returns a new UpdatesLogEntry from a JSON string, or nil if a decoding error occurs
   */
  static func create(from: String) -> UpdatesLogEntry? {
    do {
      let jsonDecoder = JSONDecoder()
      guard let jsonData = from.data(using: .utf8) else {
        return nil
      }
      return try jsonDecoder.decode(UpdatesLogEntry.self, from: jsonData)
    } catch {
      return nil
    }
  }

  private static let STACKTRACE_MAX_LENGTH = 20

  /**
   Utility method to construct stacktrace as a string array for log entries
   */
  static func currentStackTrace() -> [String] {
    return [String](Thread.callStackSymbols.dropFirst().dropFirst().prefix(STACKTRACE_MAX_LENGTH))
      .map { stackframe in
        stackframe.replacingOccurrences(of: #"^\d+\s+"#, with: "", options: .regularExpression)
      }
  }
}
