import Foundation
internal import jsi

/// A reference to a ``JavaScriptValue``: the counterpart of ``JavaScriptRef`` for the one wrapper that
/// travels through `Any`-based and generic APIs. `JavaScriptValue` becomes a non-copyable struct in
/// SDK 59; from then on this is `JavaScriptValue.Ref` and the type to use when a value has to:
/// - Switch from value semantics to reference semantics.
/// - Be sent to another isolation context or captured by an escaping closure.
/// - Be stored in a container, a tuple or a generic type that takes copyable types only.
/// - Be boxed in `Any`, for example as a DSL `Function` argument or a `Field` type.
///
/// It is a dedicated class rather than `JavaScriptRef<JavaScriptValue>` because forming an `Any` from
/// a generic type with a non-copyable type argument needs runtime support that is only available from
/// iOS 18, and the deployment target is lower. A non-generic class has no such restriction.
/// - TODO: Annotate `value` and friends with `@JavaScriptActor`.
public final class JavaScriptValueRef: JavaScriptType, Sendable, Copyable, Escapable {
  /// The referenced value. It is consumed by the ref until it is taken (see `take()`) by a new owner.
  nonisolated(unsafe) private var value: JavaScriptValue?

  /// Returns `true` if the reference does not reference any value, `false` otherwise.
  public var isEmpty: Bool {
    return value == nil
  }

  /// Initializes a ref without an initial value.
  public init() {}

  /// Makes a reference to the value. The value is consumed and cannot be used anymore in the calling scope.
  public init(_ value: consuming sending JavaScriptValue) {
    self.value = consume value
  }

  /// Makes a reference to the wrapped value, or `nil` when the optional is empty. Handy for passing an
  /// optional value where only copyable types are accepted, such as a parameter pack.
  public convenience init?(optional value: consuming sending JavaScriptValue?) {
    switch consume value {
    case .some(let value):
      self.init(value)
    case .none:
      return nil
    }
  }

  /// Replaces the referenced value with a new value.
  public func reset(_ value: consuming sending JavaScriptValue) {
    self.value = consume value
  }

  /// Releases the value. Any subsequent `take()` calls with throw or return `nil`.
  public func release() {
    self.value = nil
  }

  /// Takes the value out of the reference and transfers the ownership to the caller.
  /// Throws when the reference does not hold any value, i.e. it has already been taken or never set.
  public func take() throws(InvalidRefError) -> sending JavaScriptValue {
    guard let value = value.take() else {
      throw InvalidRefError()
    }
    return value
  }

  /// Takes the value out of the reference and transfers the ownership to the caller.
  /// Returns `nil` if the reference does not hold any value, i.e. it has already been taken or never set.
  public func take() -> sending JavaScriptValue? {
    return value.take()
  }

  /// Borrows the referenced value for the duration of `body` without consuming it, so the reference
  /// keeps holding the value and can be read again. `body` receives the value as a borrow, or `nil` when
  /// the reference is empty (already taken, released, or never set), and its result is returned as-is.
  ///
  /// `body` returns `R` directly (rather than this method wrapping it in `R?`) so the result can itself
  /// be a non-`Copyable` optional like `JavaScriptObject?`, which can't be nested inside another optional.
  public func withValue<R: ~Copyable>(_ body: (borrowing JavaScriptValue?) throws -> R?) rethrows -> R? {
    return try body(value)
  }

  /// Borrows the referenced value for the duration of `body` when the reference holds one, and
  /// returns `nil` without calling `body` when it is empty. Prefer this over `withValue(_:)` when
  /// `body` has nothing to do for an empty reference: a borrowed non-copyable optional cannot be
  /// unwrapped with `if let` or optional chaining, only with a `switch`.
  public func withUnwrappedValue<R: ~Copyable>(_ body: (borrowing JavaScriptValue) throws -> R) rethrows -> R? {
    switch value {
    case .some(let value):
      return try body(value)
    case .none:
      return nil
    }
  }

  /// Takes the value. Returns `undefined` value if the reference does not hold any value.
  public func asValue() -> JavaScriptValue {
    return take() ?? .undefined
  }

  /// An error thrown when attempting to `take()` a value from a ref that has already been taken, released, or was never set.
  public struct InvalidRefError: Error, CustomStringConvertible {
    public init() {}

    public var description: String {
      return "A reference to JavaScriptValue has been invalidated"
    }
  }
}

extension JavaScriptValueRef: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> JavaScriptValueRef {
    return JavaScriptValueRef(value.copy())
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return take() ?? .undefined
  }
}

extension JavaScriptValueRef: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime)
    -> JavaScriptValueRef
  {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return take()?.toJSIValue(in: runtime) ?? .undefined()
  }
}
