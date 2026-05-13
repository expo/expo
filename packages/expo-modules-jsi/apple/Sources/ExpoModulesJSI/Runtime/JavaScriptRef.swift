import Foundation
internal import jsi

/**
 Reference to a non-copyable JavaScript value. Use it only when you have to:
 - Switch from value semantics to reference semantics.
 - Send a value through different isolation contexts.
 - Capture by escaping closures.
 - Store in containers that do not support non-copyable types.
 Swift (v6.2 at the time of writing) still has very limited support for non-copyable types.
 Many built-in types (including collections, containers, tuples) and protocols are not supporting them.
 There is a new ``InlineArray`` that supports them, but it requires iOS 26.
 - TODO: Annotate `value` and friends with `@JavaScriptActor`.
 */
public final class JavaScriptRef<T: JavaScriptType & ~Copyable>: JavaScriptType, Sendable, Copyable, Escapable {
  /**
   The referenced non-copyable value. It is consumed by the ref until it is taken (see `take()`) by a new owner.
   */
  nonisolated(unsafe) private var value: T?

  /**
   Returns `true` if the reference does not reference any value, `false` otherwise.
   */
  public var isEmpty: Bool {
    return value == nil
  }

  /**
   Initializes a ref without an initial value.
   */
  public init() {}

  /**
   Makes a reference to the value. The value is consumed and cannot be used anymore in the calling scope.
   */
  public init(_ value: consuming sending T) {
    self.value = consume value
  }

  /**
   Replaces the referenced value with a new value.
   */
  public func reset(_ value: consuming sending T) {
    self.value = consume value
  }

  /**
   Releases the value. Any subsequent `take()` calls with throw or return `nil`.
   */
  public func release() {
    self.value = nil
  }

  /**
   Takes the value out of the reference and transfers the ownership to the caller.
   Throws when the reference does not hold any value, i.e. it has already been taken or never set.
   */
  public func take() throws(InvalidRefError) -> sending T {
    guard let value = value.take() else {
      throw InvalidRefError()
    }
    return value
  }

  /**
   Takes the value out of the reference and transfers the ownership to the caller.
   Returns `nil` if the reference does not hold any value, i.e. it has already been taken or never set.
   */
  public func take() -> sending T? {
    return value.take()
  }

  /**
   Takes the value as a `JavaScriptValue`. Returns `undefined` value if the reference does not hold any value.
   */
  public func asValue() -> JavaScriptValue {
    return take()?.asValue() ?? .undefined
  }

  /**
   An error thrown when attempting to `take()` a value from a ref that has already been taken, released, or was never set.
   */
  public struct InvalidRefError: Error, CustomStringConvertible {
    public init() {}

    public var description: String {
      return "A reference to \(String(describing: T.self)) has been invalidated"
    }
  }
}

extension JavaScriptRef: JavaScriptRepresentable where T: JavaScriptRepresentable & ~Copyable {}
extension JavaScriptRef: JSIRepresentable where T: JSIRepresentable & ~Copyable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> JavaScriptRef {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return take()?.toJSIValue(in: runtime) ?? .undefined()
  }
}
