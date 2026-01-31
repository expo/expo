/**
 Protocol conformed by the types that represent any JavaScript values.
 */
public protocol JavaScriptType: Sendable, ~Copyable {
  associatedtype Ref

  /**
   Returns a value that this instance represents as a `JavaScriptValue`.
   */
  func asValue() -> JavaScriptValue

  /**
   Creates a reference to this non-copyable JS value. Ownership on the value is transferred (is consumed) to the reference.
   The original type and value are preserved; Referencing `JavaScriptFunction` and then dereferencing returns exactly the same struct.
   */
  consuming func ref() -> JavaScriptRef<Self>

  /**
   Creates a reference to a copy of this JS value. Ownership is **not transferred** (is borrowed) as the ref owns its copy.
   The original type and value are **not preserved**, meaning that dereferencing will return a `JavaScriptValue`.
   */
  borrowing func refToValue() -> JavaScriptValue.Ref
}

public extension JavaScriptType where Self: ~Copyable {
  typealias Ref = JavaScriptRef<Self>

  consuming func ref() -> JavaScriptRef<Self> {
    return JavaScriptRef(self)
  }

  borrowing func refToValue() -> JavaScriptValue.Ref {
    return JavaScriptRef(self.asValue())
  }
}
