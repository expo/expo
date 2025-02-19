// Copyright 2022-present 650 Industries. All rights reserved.

import os.log

/**
 An enum with available log types.
 */
public enum LogType: Int {
  case trace = 0
  case timer = 1
  case stacktrace = 2
  case debug = 3
  case info = 4
  case warn = 5
  case error = 6
  case fatal = 7

  /**
   The string that is used to prefix the messages of this log type.
   Logs in Xcode and Console apps are always with the white text,
   so we use colored circle emojis to distinguish different types of logs.
   */
  var prefix: String {
    switch self {
    case .trace:
      return "⚪️"
    case .timer:
      return "🟤"
    case .stacktrace:
      return "🟣"
    case .debug:
      return "🔵"
    case .info:
      return "🟢"
    case .warn:
      return "🟡"
    case .error:
      return "🟠"
    case .fatal:
      return "🔴"
    }
  }

  /**
   Maps the log types to the log types used by the `os.log` logger.
   */
  @available(iOS 14.0, watchOS 7.0, tvOS 14.0, *)
  public func toOSLogType() -> OSLogType {
    switch self {
    case .trace, .timer, .stacktrace, .debug:
      return .debug
    case .info:
      return .info
    case .warn:
      return .default
    case .error:
      return .error
    case .fatal:
      return .fault
    }
  }
}
