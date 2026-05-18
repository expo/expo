private let onNewError = "\(JSLoggerModule.name).onNewError"
private let onNewWarning = "\(JSLoggerModule.name).onNewWarning"
private let onNewDebug = "\(JSLoggerModule.name).onNewDebug"
private let onNewInfo = "\(JSLoggerModule.name).onNewInfo"
private let onNewTrace = "\(JSLoggerModule.name).onNewTrace"

public final class JSLoggerModule: Module {
  public static let name = "ExpoModulesCoreJSLogger"

  // We could have made the JSLoggerModule implement the LogHandler interface, but the Logger
  // holds a strong reference to the LogHandlers, which would lead to a reference cycle.
  private class JSLogHandler: LogHandler {
    weak var module: JSLoggerModule?

    init(module: JSLoggerModule) {
      self.module = module
    }

    func log(type: LogType, _ message: String) {
      module?.reportToLogBox(type: type, message)
    }
  }

  public var logger: Logger?

  public func definition() -> ModuleDefinition {
    Name(Self.name)

    Events(onNewError, onNewWarning, onNewDebug, onNewInfo, onNewTrace)

    OnCreate {
      let logHandler = JSLogHandler(module: self)
      self.logger = Logger(logHandlers: [logHandler])
    }
  }

  private func reportToLogBox(type: LogType, _ message: String) {
    self.sendEvent(type.eventName, [
      "message": message
    ])
  }
}

private extension LogType {
  var eventName: String {
    switch self {
    case .trace:
      onNewTrace
    case .timer:
      onNewDebug
    case .stacktrace:
      onNewTrace
    case .debug:
      onNewDebug
    case .info:
      onNewInfo
    case .warn:
      onNewWarning
    case .error:
      onNewError
    case .fatal:
      onNewError
    }
  }
}
