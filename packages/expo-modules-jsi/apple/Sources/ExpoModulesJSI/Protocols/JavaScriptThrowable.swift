/**
 A protocol that native error types can conform to in order to control
 how they are represented when thrown into the JavaScript world.

 When a native function throws an error that conforms to this protocol,
 a JavaScript `Error` object is created with the specified `message`
 and `code`.

 Types that don't conform to this protocol are still throwable, but
 will use a generic error representation.

 ```swift
 struct MyError: JavaScriptThrowable {
   var message: String { "Something went wrong" }
   var code: String { "ERR_MY_ERROR" }
 }
 ```
 */
public protocol JavaScriptThrowable: Error, Sendable {
  /**
   The error message describing what went wrong. Defaults to the debug description of the
   conforming type, which typically includes richer context (class name, origin, cause chain)
   than a plain description. Override to provide a custom user-facing message.
   */
  var message: String { get }

  /**
   An error code for programmatic error handling in JavaScript.
   Return an empty string to omit the `code` property from the JS error.
   */
  var code: String { get }
}

extension JavaScriptThrowable {
  public var message: String {
    return String(reflecting: self)
  }

  public var code: String {
    return ""
  }
}
