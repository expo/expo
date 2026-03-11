// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Logger")
struct LoggerTests {
  @Test
  func `should log various levels`() {
    let loggerHandler = TestLogHandler()
    let logger = Logger(logHandlers: [loggerHandler])

    logger.trace("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .trace, message: "hello"))
    loggerHandler.clear()

    logger.debug("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .debug, message: "hello"))
    loggerHandler.clear()

    logger.info("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .info, message: "hello"))
    loggerHandler.clear()

    logger.warn("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .warn, message: "hello"))
    loggerHandler.clear()

    logger.error("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .error, message: "hello"))
    loggerHandler.clear()

    logger.fatal("hello")
    #expect(loggerHandler.logEntries.first == TestLogHandler.TestLogHandlerLogEntry(type: .fatal, message: "hello"))
    loggerHandler.clear()
  }

  @Test
  func `should run a timer`() async throws {
    let loggerHandler = TestLogHandler()
    let logger = Logger(logHandlers: [loggerHandler])

    let timer = logger.startTimer { duration in
      return "\(duration)"
    }
    try await Task.sleep(nanoseconds: 300_000_000)
    timer.stop()

    let entry = loggerHandler.logEntries.first!
    #expect(entry.type == .timer)

    // remove emoji prefix
    let index = entry.message.index(entry.message.startIndex, offsetBy: 2)
    #expect(Double(entry.message[index...])! > 300)

    loggerHandler.clear()
  }
}

// MARK: - Test Helpers

private class TestLogHandler: LogHandler {
  struct TestLogHandlerLogEntry: Equatable {
    let type: LogType
    let message: String

    static func == (lhs: TestLogHandlerLogEntry, rhs: TestLogHandlerLogEntry) -> Bool {
      // slightly-fuzzy matching for testing only due to prepending emoji to message
      return lhs.type == rhs.type && (lhs.message.contains(rhs.message) || rhs.message.contains(lhs.message))
    }
  }

  var logEntries: [TestLogHandlerLogEntry] = []

  func clear() {
    logEntries = []
  }

  func log(type: ExpoModulesCore.LogType, _ message: String) {
    logEntries.append(TestLogHandlerLogEntry(type: type, message: message))
  }
}
