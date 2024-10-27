// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class LoggerSpec: ExpoSpec {
  class TestLogHandler : LogHandler {
    struct TestLogHandlerLogEntry : Equatable {
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

  override class func spec() {
    it("should log various levels") {
      let loggerHandler = TestLogHandler()
      let logger = Logger(logHandlers: [loggerHandler])

      logger.trace("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .trace, message: "hello")
      loggerHandler.clear()

      logger.debug("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .debug, message: "hello")
      loggerHandler.clear()

      logger.info("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .info, message: "hello")
      loggerHandler.clear()

      logger.warn("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .warn, message: "hello")
      loggerHandler.clear()

      logger.error("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .error, message: "hello")
      loggerHandler.clear()

      logger.fatal("hello")
      expect(loggerHandler.logEntries.first) == TestLogHandler.TestLogHandlerLogEntry(type: .fatal, message: "hello")
      loggerHandler.clear()
    }

    it("should run a timer") {
      let loggerHandler = TestLogHandler()
      let logger = Logger(logHandlers: [loggerHandler])

      let timer = logger.startTimer { duration in
        return "\(duration)"
      }
      RunLoop.current.run(until: Date().addingTimeInterval(0.3))
      timer.stop()

      let entry = loggerHandler.logEntries.first!
      expect(entry.type) == .timer

      // remove emoji prefix
      let index = entry.message.index(entry.message.startIndex, offsetBy: 2)
      expect(Double(entry.message[index...])) > 300

      loggerHandler.clear()
    }
  }
}
