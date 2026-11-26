// Copyright 2026-present 650 Industries. All rights reserved.

/// A backport of `AtomicRepresentable` from the Synchronization framework (iOS 18+).
/// A type whose values an `Atomic` can store. The type encodes a value to an unsigned integer of the same size, which
/// the atomic operations work on, and decodes it back. Integers up to 64 bits and `Bool` conform.
@available(iOS, deprecated: 18.0, message: "Use AtomicRepresentable from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use AtomicRepresentable from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use AtomicRepresentable from the Synchronization framework")
public protocol AtomicRepresentable {
  // An unsigned integer, not any `BitwiseCopyable` type as in the Synchronization framework. Where that framework is
  // visible too, a stdlib type has two `AtomicRepresentation` typealiases, and only this constraint lets the compiler
  // pick the one of this conformance.
  /// The unsigned integer that stores an encoded value. `Atomic` supports integers of 1, 2, 4 and 8 bytes.
  associatedtype AtomicRepresentation: FixedWidthInteger, UnsignedInteger

  static func encodeAtomicRepresentation(_ value: consuming Self) -> AtomicRepresentation

  static func decodeAtomicRepresentation(_ storage: consuming AtomicRepresentation) -> Self
}

extension Int8: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt8

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Int8) -> UInt8 {
    return UInt8(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt8) -> Int8 {
    return Int8(truncatingIfNeeded: storage)
  }
}

extension Int16: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt16

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Int16) -> UInt16 {
    return UInt16(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt16) -> Int16 {
    return Int16(truncatingIfNeeded: storage)
  }
}

extension Int32: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt32

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Int32) -> UInt32 {
    return UInt32(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt32) -> Int32 {
    return Int32(truncatingIfNeeded: storage)
  }
}

extension Int64: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt64

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Int64) -> UInt64 {
    return UInt64(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt64) -> Int64 {
    return Int64(truncatingIfNeeded: storage)
  }
}

extension Int: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt64

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Int) -> UInt64 {
    return UInt64(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt64) -> Int {
    return Int(truncatingIfNeeded: storage)
  }
}

extension UInt8: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt8

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming UInt8) -> UInt8 {
    return value
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt8) -> UInt8 {
    return storage
  }
}

extension UInt16: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt16

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming UInt16) -> UInt16 {
    return value
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt16) -> UInt16 {
    return storage
  }
}

extension UInt32: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt32

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming UInt32) -> UInt32 {
    return value
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt32) -> UInt32 {
    return storage
  }
}

extension UInt64: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt64

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming UInt64) -> UInt64 {
    return value
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt64) -> UInt64 {
    return storage
  }
}

extension UInt: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt64

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming UInt) -> UInt64 {
    return UInt64(truncatingIfNeeded: value)
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt64) -> UInt {
    return UInt(truncatingIfNeeded: storage)
  }
}

extension Bool: AtomicRepresentable {
  public typealias AtomicRepresentation = UInt8

  @inlinable
  public static func encodeAtomicRepresentation(_ value: consuming Bool) -> UInt8 {
    return value ? 1 : 0
  }

  @inlinable
  public static func decodeAtomicRepresentation(_ storage: consuming UInt8) -> Bool {
    return storage != 0
  }
}
