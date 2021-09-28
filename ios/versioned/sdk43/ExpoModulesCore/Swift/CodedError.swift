import Foundation

/**
 A protocol for errors specyfing its `code` and providing the `description`.
 */
public protocol CodedError: Error {
  var code: String { get }
  var description: String { get }
}

/**
 Extends the `CodedError` to make a fallback for `code` and `description`.
 */
public extension CodedError {
  /**
   The code is inferred from the class name — e.g. the code of `ModuleNotFoundError` becomes `ERR_MODULE_NOT_FOUND`.
   To obtain the code, the class name is cut off from generics and `Error` suffix, then it's converted to snake case and uppercased.
   */
  var code: String {
    let className = String(describing: type(of: self))
      .replacingOccurrences(of: #"(Error)?(<.*>)?$"#, with: "", options: .regularExpression)
    let regex = try! NSRegularExpression(pattern: "(.)([A-Z])", options: [])
    let range = NSRange(location: 0, length: className.count)

    return "ERR_" + regex
      .stringByReplacingMatches(in: className, options: [], range: range, withTemplate: "$1_$2")
      .uppercased()
  }

  /**
   The description falls back to object's localized description.
   */
  var description: String {
    return localizedDescription
  }
}

/**
 Basic implementation of `CodedError` protocol,
 where the code and the description are provided in the initializer.
 */
public struct SimpleCodedError: CodedError {
  public var code: String
  public var description: String

  init(_ code: String, _ description: String) {
    self.code = code
    self.description = description
  }
}

/**
 Coded wrapper for uncoded errors. Intended to be used to handle unexpected native errors.
 */
public struct UnexpectedError: CodedError {
  public let description: String

  init(_ error: Error) {
    self.description = error.localizedDescription
  }
}
