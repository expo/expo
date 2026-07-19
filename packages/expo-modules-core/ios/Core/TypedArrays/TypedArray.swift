// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 The base class for any type of the typed array.
 */
public class TypedArray: AnyTypedArray {
  /**
   Creates a concrete TypedArray from the given JavaScriptTypedArray
   */
  @usableFromInline
  internal static func create(from jsTypedArray: consuming JavaScriptTypedArray) -> TypedArray {
    switch jsTypedArray.kind {
    case .Int8Array:
      return Int8Array(jsTypedArray)
    case .Int16Array:
      return Int16Array(jsTypedArray)
    case .Int32Array:
      return Int32Array(jsTypedArray)
    case .Uint8Array:
      return Uint8Array(jsTypedArray)
    case .Uint8ClampedArray:
      return Uint8ClampedArray(jsTypedArray)
    case .Uint16Array:
      return Uint16Array(jsTypedArray)
    case .Uint32Array:
      return Uint32Array(jsTypedArray)
    case .Float32Array:
      return Float32Array(jsTypedArray)
    case .Float64Array:
      return Float64Array(jsTypedArray)
    case .BigInt64Array:
      return BigInt64Array(jsTypedArray)
    case .BigUint64Array:
      return BigUint64Array(jsTypedArray)
    @unknown default:
      fatalError("Unknown kind of the TypedArray")
    }
  }

  /**
   A JavaScript object of the underlying typed array.
   */
  @usableFromInline
  internal let jsTypedArray: JavaScriptTypedArray

  /**
   The length in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public var byteLength: Int { jsTypedArray.byteLength }

  /**
   The offset in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public var byteOffset: Int { jsTypedArray.byteOffset }

  /**
   Returns the number of elements held in the typed array.
   Fixed at construction time and thus read only.
   */
  public lazy var length: Int = jsTypedArray.length

  /**
   The unsafe mutable raw pointer to the start of the typed array.
   It is the beginning of the underlying ArrayBuffer, with this array's `byteOffset` applied.

   For zero-length typed arrays the underlying ArrayBuffer may have no storage, in which
   case `baseAddress` is `nil`. We substitute a non-null sentinel (`bitPattern: 1`) so the
   property can stay non-optional — callers passing this to a C API alongside `count == 0`
   won't dereference it, and any attempt to read/write crashes loudly instead of silently
   corrupting memory.
   */
  public var rawPointer: UnsafeMutableRawPointer {
    return jsTypedArray.withUnsafeMutableBytes {
      return $0.baseAddress ?? UnsafeMutableRawPointer(bitPattern: 1)!
    }
  }

  /**
   Returns the kind of the typed array, such as `Int8Array` or `Float32Array`.
   */
  public var kind: JavaScriptTypedArray.Kind {
    return jsTypedArray.kind
  }

  /**
   Initializes the typed array with the given JS typed array.
   */
  // `@usableFromInline internal`, not `public`: the `@inlinable` decode bodies need to call it, but it
  // must not be public API. A concrete subclass binds the buffer to its `ContentType`, so wrapping a
  // mismatched-kind JS typed array (e.g. `Int32Array(someUint8Array)`) would reinterpret memory. The
  // `decode` paths only call it after checking the kind.
  @usableFromInline
  required init(_ jsTypedArray: consuming JavaScriptTypedArray) {
    self.jsTypedArray = jsTypedArray
  }

  /// `JavaScriptDecodable` witness. It's a `class func` in the class body, not in the conformance
  /// extension, so the concrete subclasses can override it (extension methods can't be overridden).
  /// The base accepts any kind and resolves the concrete subclass via `create(from:)`.
  @JavaScriptActor
  @inlinable
  public class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self {
    guard value.isTypedArray() else {
      throw NotATypedArrayException()
    }
    // `create(from:)` returns the concrete subclass for the JS kind. For the base `TypedArray` the cast
    // to `Self` always holds; it only fails when this inherited witness runs for a narrower `Self` (a
    // `GenericTypedArray<T>` specialization) whose element type doesn't match the JS kind. Guard rather
    // than force-cast so that surfaces as a thrown error instead of a trap.
    let typedArray = create(from: value.getTypedArray())
    guard let typed = typedArray as? Self else {
      throw KindMismatchException(expected: nil, received: typedArray.kind)
    }
    return typed
  }

  /// Shared body for the concrete subclasses' `decode` overrides: constructs `Self` directly for a
  /// matching `kind`, skipping `create(from:)`'s dispatch and a downcast.
  @JavaScriptActor
  @inlinable
  internal static func decode(
    _ value: borrowing JavaScriptValue,
    expectingKind kind: JavaScriptTypedArray.Kind
  ) throws -> Self {
    guard value.isTypedArray() else {
      throw NotATypedArrayException()
    }
    let jsTypedArray = value.getTypedArray()
    guard jsTypedArray.kind == kind else {
      throw KindMismatchException(expected: kind, received: jsTypedArray.kind)
    }
    return Self(jsTypedArray)
  }
}

// MARK: - Decoding exceptions

extension TypedArray {
  /// Thrown when decoding a typed array from a JavaScript value that is not a typed array.
  public struct NotATypedArrayException: JavaScriptThrowable {
    // An explicit initializer because a struct's synthesized init is internal and so can't be called
    // from the `@inlinable` decode bodies.
    public init() {}

    public var code: String {
      "ERR_NOT_TYPED_ARRAY"
    }
    public var message: String {
      "Expected a JavaScript typed array, but received a value of another type"
    }
  }

  /// Thrown when a typed array is the wrong kind for the concrete type being decoded, e.g. decoding a
  /// `Uint8Array` from a JavaScript `Int16Array`. `expected` is `nil` when the decoded type is a
  /// `GenericTypedArray<T>` specialization that has no single expected kind.
  public struct KindMismatchException: JavaScriptThrowable {
    public let expected: JavaScriptTypedArray.Kind?
    public let received: JavaScriptTypedArray.Kind

    // An explicit initializer because a struct's synthesized memberwise init is internal even with
    // public fields, so it can't be called from the `@inlinable` decode bodies.
    public init(expected: JavaScriptTypedArray.Kind?, received: JavaScriptTypedArray.Kind) {
      self.expected = expected
      self.received = received
    }

    public var code: String {
      "ERR_TYPED_ARRAY_KIND_MISMATCH"
    }
    public var message: String {
      if let expected {
        return "Expected a typed array of kind \(expected), but received \(received)"
      }
      return "A typed array of kind \(received) cannot be decoded as the expected typed array type"
    }
  }
}
