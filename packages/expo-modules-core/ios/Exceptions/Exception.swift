// Copyright 2022-present 650 Industries. All rights reserved.

open class Exception: CodedError, ChainableException, CustomStringConvertible, CustomDebugStringConvertible {
  open lazy var name: String = String(describing: Self.self)

  /**
   String describing the reason of the exception.
   */
  open var reason: String {
    "undefined reason"
  }

  /**
   The origin in code where the exception was created.
   */
  open var origin: ExceptionOrigin

  /**
   A custom code of the exception. When unset, the `code` is calculated from the exception name or class name.
   */
  let customCode: String?

  /**
   The default initializer that captures the place in the code where the exception was created.
   - Warning: Call it only without arguments!
   */
  public init(file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.origin = ExceptionOrigin(file: file, line: line, function: function)
    self.customCode = nil
  }

  public init(name: String, description: String, code: String? = nil, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.origin = ExceptionOrigin(file: file, line: line, function: function)
    self.customCode = code
    self.name = name
    self.description = description
  }

  // MARK: - CodedError

  open var code: String {
    customCode ?? errorCodeFromString(name)
  }

  // MARK: - ChainableException

  open var cause: Error?

  // MARK: - CustomStringConvertible

  open lazy var description: String = concatDescription(reason, withCause: cause, debug: false)

  // MARK: - CustomDebugStringConvertible

  open var debugDescription: String {
    let debugDescription = "\(name): \(reason) (at \(origin.file):\(origin.line))"
    return concatDescription(debugDescription, withCause: cause, debug: true)
  }
}

/**
 Concatenates the exception description with its cause description.
 */
private func concatDescription(_ description: String, withCause cause: Error?, debug: Bool = false) -> String {
  let causeSeparator = "\n→ Caused by: "
  switch cause {
  case let cause as Exception:
    return description + causeSeparator + (debug ? cause.debugDescription : cause.description)
  case let cause as CodedError:
    // `CodedError` is deprecated but we need to provide backwards compatibility as some modules already used it.
    return description + causeSeparator + cause.description
  case let cause?:
    return description + causeSeparator + cause.localizedDescription
  default:
    return description
  }
}
