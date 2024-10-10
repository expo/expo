// Copyright 2021-present 650 Industries. All rights reserved.

import Dispatch

public let log = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

public typealias LoggerTimerFormatterBlock = (_ duration: Double) -> String

/**
 Native iOS logging class for Expo, with options to direct logs
 to different destinations.
 */
public class Logger {
  public static let EXPO_MODULES_LOG_SUBSYSTEM = "dev.expo.modules"
  public static let EXPO_LOG_CATEGORY = "expo"

  #if DEBUG || EXPO_CONFIGURATION_DEBUG
  private var minLevel: LogType = .trace
  #else
  private var minLevel: LogType = .info
  #endif

  private let logHandlers: [LogHandler]

  public required init(logHandlers: [LogHandler]) {
    self.logHandlers = logHandlers
  }

  // MARK: - Public logging functions

  /**
   The most verbose log level that captures all the details about the behavior of the implementation.
   It is mostly diagnostic and is more granular and finer than `debug` log level.
   These logs should not be committed to the repository and are ignored in the release builds.
   */
  public func trace(_ items: Any...) {
    log(type: .trace, items)
  }

  /**
   Used to log diagnostically helpful information. As opposed to `trace`,
   it is acceptable to commit these logs to the repository. Ignored in the release builds.
   */
  public func debug(_ items: Any...) {
    log(type: .debug, items)
  }

  /**
   For information that should be logged under normal conditions such as successful initialization
   and notable events that are not considered an error but might be useful for debugging purposes in the release builds.
   */
  public func info(_ items: Any...) {
    log(type: .info, items)
  }

  /**
   Used to log an unwanted state that has not much impact on the process so it can be continued, but could potentially become an error.
   */
  public func warn(_ items: Any...) {
    log(type: .warn, items)
  }

  /**
   Logs unwanted state that has an impact on the currently running process, but the entire app can continue to run.
   */
  public func error(_ items: Any...) {
    log(type: .error, items)
  }

  /**
   Logs critical error due to which the entire app cannot continue to run.
   */
  public func fatal(_ items: Any...) {
    log(type: .fatal, items)
  }

  /**
   Logs the stack of symbols on the current thread.
   */
  public func stacktrace(type: LogType = .stacktrace, file: String = #fileID, line: UInt = #line) {
    guard type.rawValue >= minLevel.rawValue else {
      return
    }
    let queueName = OperationQueue.current?.underlyingQueue?.label ?? "<unknown>"

    // Get the call stack symbols without the first symbol as it points right here.
    let symbols = Thread.callStackSymbols.dropFirst()

    log(type: type, "The stacktrace from '\(file):\(line)' on queue '\(queueName)':")

    symbols.forEach { symbol in
      let formattedSymbol = reformatStackSymbol(symbol)
      log(type: type, "≫ \(formattedSymbol)")
    }
  }

  /**
   Allows the logger instance to be called as a function. The same as `logger.debug(...)`.
   */
  public func callAsFunction(_ items: Any...) {
    log(type: .debug, items)
  }

  // MARK: - Timers

  /**
   Starts a timer that can be used to compute the duration of an operation. Upon calling
   `stop` on the returned object, a timer entry will be logged.
   */
  public func startTimer(_ formatterBlock: @escaping LoggerTimerFormatterBlock) -> LoggerTimer {
    let startTime = DispatchTime.now()
    return LoggerTimer {
      let endTime = DispatchTime.now()
      let diffMs = Double(endTime.uptimeNanoseconds - startTime.uptimeNanoseconds) / 1_000_000
      self.log(type: .timer, formatterBlock(diffMs))
      return diffMs
    }
  }

  // MARK: - Private logging functions

  private func log(type: LogType = .trace, _ items: [Any]) {
    guard type.rawValue >= minLevel.rawValue else {
      return
    }
    let messages = items
      .map { describe(value: $0) }
      .joined(separator: " ")
      .split(whereSeparator: \.isNewline)
      .map { "\(type.prefix) \($0)" }

    logHandlers.forEach { handler in
      messages.forEach { message in
        handler.log(type: type, message)
      }
    }
  }

  private func log(type: LogType = .trace, _ items: Any...) {
    log(type: type, items)
  }
}

private func reformatStackSymbol(_ symbol: String) -> String {
  return symbol.replacingOccurrences(of: #"^\d+\s+"#, with: "", options: .regularExpression)
}

private func describe(value: Any) -> String {
  if let value = value as? String {
    return value
  }
  if let value = value as? CustomDebugStringConvertible {
    return value.debugDescription
  }
  if let value = value as? CustomStringConvertible {
    return value.description
  }
  return String(describing: value)
}
