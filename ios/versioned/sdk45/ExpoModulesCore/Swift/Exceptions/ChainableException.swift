// Copyright 2022-present 650 Industries. All rights reserved.

/**
 An exception that may have been caused by another error.
 */
public protocol ChainableException: Error, AnyObject {
  /**
   The direct cause of the exception.
   */
  var cause: Error? { get set }

  /**
   The first error that started the chain of exceptions.
   */
  var rootCause: Error? { get }

  /**
   Sets the direct cause of the exception and returns itself.
   */
  func causedBy(_ error: Error) -> Self

  /**
   Tells whether any of the cause in chain is of given type.
   */
  func isCausedBy<ErrorType: Error>(_ errorType: ErrorType.Type) -> Bool
}

public extension ChainableException {
  var rootCause: Error? {
    if let cause = cause as? ChainableException {
      return cause.rootCause ?? cause
    }
    return cause
  }

  @discardableResult
  func causedBy(_ error: Error) -> Self {
    cause = error
    return self
  }

  func isCausedBy<ErrorType: Error>(_ errorType: ErrorType.Type) -> Bool {
    if cause is ErrorType {
      return true
    }
    if let cause = cause as? ChainableException {
      return cause.isCausedBy(errorType)
    }
    return false
  }
}
