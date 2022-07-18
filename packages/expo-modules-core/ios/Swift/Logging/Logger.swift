// Copyright 2021-present 650 Industries. All rights reserved.

import Dispatch

public let log = Logger(category: "expo")

public class Logger {
  #if DEBUG || EXPO_CONFIGURATION_DEBUG
  private var minLevel: LogType = .trace
  #else
  private var minLevel: LogType = .info
  #endif

  private let category: String

  private var handlers: [LogHandler] = []

  init(category: String = "main") {
    self.category = category

    if #available(macOS 11.0, iOS 14.0, watchOS 7.0, tvOS 14.0, *) {
      addHandler(withType: OSLogHandler.self)
    } else {
      addHandler(withType: PrintLogHandler.self)
    }
  }

  internal func addHandler<LogHandlerType: LogHandler>(_ handler: LogHandlerType) {
    handlers.append(handler)
  }

  internal func addHandler<LogHandlerType: LogHandler>(withType: LogHandlerType.Type) {
    addHandler(LogHandlerType(category: category))
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
   Stores the timers created by `timeStart` function.
   */
  private var timers: [String: DispatchTime] = [:]

  /**
   Starts the timer to measure how much time the following operations take.
   */
  public func timeStart(_ id: String) {
    guard LogType.timer.rawValue >= minLevel.rawValue else {
      return
    }
    log(type: .timer, "Starting timer '\(id)'")
    timers[id] = DispatchTime.now()
  }

  /**
   Stops the timer and logs how much time elapsed since it started.
   */
  public func timeEnd(_ id: String) {
    guard LogType.timer.rawValue >= minLevel.rawValue else {
      return
    }
    guard let startTime = timers[id] else {
      log(type: .timer, "Timer '\(id)' has not been started!")
      return
    }
    let endTime = DispatchTime.now()
    let diff = Double(endTime.uptimeNanoseconds - startTime.uptimeNanoseconds) / 1_000_000
    log(type: .timer, "Timer '\(id)' has finished in: \(diff) ms")
    timers.removeValue(forKey: id)
  }

  /**
   Measures how much time it takes to run given closure. Returns the same value as the closure returned.
   */
  public func time<ReturnType>(_ id: String, _ closure: () -> ReturnType) -> ReturnType {
    timeStart(id)
    let result = closure()
    timeEnd(id)
    return result
  }

  // MARK: - Changing the category

  public func category(_ category: String) -> Logger {
    return Logger(category: category)
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

    handlers.forEach { handler in
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
