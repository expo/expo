// Copyright 2022-present 650 Industries. All rights reserved.

open class Exception: CodedError, ChainableException, CustomStringConvertible, CustomDebugStringConvertible {
  open var name: String {
    return String(describing: Self.self)
  }

  /**
   String describing the reason of the exception.
   */
  open var reason: String {
    "undefined reason"
  }

  /**
   The location in code where the exception was created.
   */
  open var location: ExceptionLocation

  /**
   The default initializer that captures the place in the code where the exception was created.
   - Warning: Call it only without arguments!
   */
  public init(file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.location = ExceptionLocation(file: file, line: line, function: function)
  }

  // MARK: ChainableException

  open var cause: Error?

  // MARK: CustomStringConvertible

  open var description: String {
    return concatDescription(reason, withCause: cause, debug: false)
  }

  // MARK: CustomDebugStringConvertible

  open var debugDescription: String {
    let debugDescription = "\(name): \(reason) (at \(location.file):\(location.line))"
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
