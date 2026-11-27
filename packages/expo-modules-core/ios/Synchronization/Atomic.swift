// Copyright 2026-present 650 Industries. All rights reserved.

/// A backport of `Atomic` from the Synchronization framework (iOS 18+).
/// A value that many threads can load and change without a lock, with the same API as the one in the standard
/// library. Each operation is one atomic instruction, so a counter or a flag costs less than with `Mutex`.
@available(iOS, deprecated: 18.0, message: "Use Atomic from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use Atomic from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use Atomic from the Synchronization framework")
@frozen
public struct Atomic<Value: AtomicRepresentable>: ~Copyable {
  // Atomic operations need memory that doesn't move and that Swift's exclusivity checks don't track, so the value
  // lives in its own allocation.
  @usableFromInline
  let storage: UnsafeMutablePointer<Value.AtomicRepresentation>

  @inlinable
  public init(_ initialValue: consuming Value) {
    storage = .allocate(capacity: 1)
    storage.initialize(to: Value.encodeAtomicRepresentation(initialValue))
  }

  @inlinable
  deinit {
    storage.deinitialize(count: 1)
    storage.deallocate()
  }

  /// Atomically loads and returns the current value.
  @inlinable
  public func load(ordering: AtomicLoadOrdering) -> Value {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      return decode(__EXAtomicLoadUInt8(storage(as: UInt8.self), ordering.rawValue))
    case 2:
      return decode(__EXAtomicLoadUInt16(storage(as: UInt16.self), ordering.rawValue))
    case 4:
      return decode(__EXAtomicLoadUInt32(storage(as: UInt32.self), ordering.rawValue))
    case 8:
      return decode(__EXAtomicLoadUInt64(storage(as: UInt64.self), ordering.rawValue))
    default:
      unsupportedRepresentation()
    }
  }

  /// Atomically replaces the current value with the desired value.
  @inlinable
  public func store(_ desired: consuming Value, ordering: AtomicStoreOrdering) {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      __EXAtomicStoreUInt8(storage(as: UInt8.self), encode(desired, as: UInt8.self), ordering.rawValue)
    case 2:
      __EXAtomicStoreUInt16(storage(as: UInt16.self), encode(desired, as: UInt16.self), ordering.rawValue)
    case 4:
      __EXAtomicStoreUInt32(storage(as: UInt32.self), encode(desired, as: UInt32.self), ordering.rawValue)
    case 8:
      __EXAtomicStoreUInt64(storage(as: UInt64.self), encode(desired, as: UInt64.self), ordering.rawValue)
    default:
      unsupportedRepresentation()
    }
  }

  /// Atomically replaces the current value with the desired value and returns the original value.
  @inlinable
  public func exchange(_ desired: consuming Value, ordering: AtomicUpdateOrdering) -> Value {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      return decode(
        __EXAtomicExchangeUInt8(storage(as: UInt8.self), encode(desired, as: UInt8.self), ordering.rawValue)
      )
    case 2:
      return decode(
        __EXAtomicExchangeUInt16(storage(as: UInt16.self), encode(desired, as: UInt16.self), ordering.rawValue)
      )
    case 4:
      return decode(
        __EXAtomicExchangeUInt32(storage(as: UInt32.self), encode(desired, as: UInt32.self), ordering.rawValue)
      )
    case 8:
      return decode(
        __EXAtomicExchangeUInt64(storage(as: UInt64.self), encode(desired, as: UInt64.self), ordering.rawValue)
      )
    default:
      unsupportedRepresentation()
    }
  }

  /// Atomically replaces the current value with the desired value when the current value equals the expected value.
  /// Returns whether it replaced the value, and the original value. When the values aren't equal, the operation is
  /// a load with the strongest ordering that the given ordering allows for a load.
  @inlinable
  public func compareExchange(
    expected: consuming Value,
    desired: consuming Value,
    ordering: AtomicUpdateOrdering
  ) -> (exchanged: Bool, original: Value) {
    return compareExchange(
      expected: expected,
      desired: desired,
      successOrdering: ordering,
      failureOrdering: .failureOrdering(for: ordering)
    )
  }

  /// Atomically replaces the current value with the desired value when the current value equals the expected value.
  /// Returns whether it replaced the value, and the original value. When the values aren't equal, the operation is
  /// a load with the failure ordering.
  @inlinable
  public func compareExchange(
    expected: consuming Value,
    desired: consuming Value,
    successOrdering: AtomicUpdateOrdering,
    failureOrdering: AtomicLoadOrdering
  ) -> (exchanged: Bool, original: Value) {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      return compareExchangeUInt8(expected, desired, successOrdering, failureOrdering)
    case 2:
      return compareExchangeUInt16(expected, desired, successOrdering, failureOrdering)
    case 4:
      return compareExchangeUInt32(expected, desired, successOrdering, failureOrdering)
    case 8:
      return compareExchangeUInt64(expected, desired, successOrdering, failureOrdering)
    default:
      unsupportedRepresentation()
    }
  }

  // The C functions take the unsigned integer of the representation's size, so the operations switch on that size. The
  // switch folds away when the compiler specializes an operation for a value type. The operations can't be in
  // extensions constrained to one representation type instead, as in the Synchronization framework: where that
  // framework is visible too, the stdlib integer types have two `AtomicRepresentation` typealiases, and the compiler
  // can't resolve such a constraint.

  @inlinable
  func storage<Storage>(as type: Storage.Type) -> UnsafeMutablePointer<Storage> {
    return UnsafeMutableRawPointer(storage).assumingMemoryBound(to: Storage.self)
  }

  @inlinable
  func encode<Storage>(_ value: consuming Value, as type: Storage.Type) -> Storage {
    return unsafeBitCast(Value.encodeAtomicRepresentation(value), to: Storage.self)
  }

  @inlinable
  func decode<Storage>(_ representation: Storage) -> Value {
    return Value.decodeAtomicRepresentation(unsafeBitCast(representation, to: Value.AtomicRepresentation.self))
  }

  @inlinable
  func unsupportedRepresentation() -> Never {
    fatalError("Atomic supports representations of 1, 2, 4 or 8 bytes")
  }

  @inlinable
  func compareExchangeUInt8(
    _ expected: consuming Value,
    _ desired: consuming Value,
    _ successOrdering: AtomicUpdateOrdering,
    _ failureOrdering: AtomicLoadOrdering
  ) -> (exchanged: Bool, original: Value) {
    let expected = encode(expected, as: UInt8.self)
    let original = __EXAtomicCompareExchangeUInt8(
      storage(as: UInt8.self),
      expected,
      encode(desired, as: UInt8.self),
      successOrdering.rawValue,
      failureOrdering.rawValue
    )
    return (original == expected, decode(original))
  }

  @inlinable
  func compareExchangeUInt16(
    _ expected: consuming Value,
    _ desired: consuming Value,
    _ successOrdering: AtomicUpdateOrdering,
    _ failureOrdering: AtomicLoadOrdering
  ) -> (exchanged: Bool, original: Value) {
    let expected = encode(expected, as: UInt16.self)
    let original = __EXAtomicCompareExchangeUInt16(
      storage(as: UInt16.self),
      expected,
      encode(desired, as: UInt16.self),
      successOrdering.rawValue,
      failureOrdering.rawValue
    )
    return (original == expected, decode(original))
  }

  @inlinable
  func compareExchangeUInt32(
    _ expected: consuming Value,
    _ desired: consuming Value,
    _ successOrdering: AtomicUpdateOrdering,
    _ failureOrdering: AtomicLoadOrdering
  ) -> (exchanged: Bool, original: Value) {
    let expected = encode(expected, as: UInt32.self)
    let original = __EXAtomicCompareExchangeUInt32(
      storage(as: UInt32.self),
      expected,
      encode(desired, as: UInt32.self),
      successOrdering.rawValue,
      failureOrdering.rawValue
    )
    return (original == expected, decode(original))
  }

  @inlinable
  func compareExchangeUInt64(
    _ expected: consuming Value,
    _ desired: consuming Value,
    _ successOrdering: AtomicUpdateOrdering,
    _ failureOrdering: AtomicLoadOrdering
  ) -> (exchanged: Bool, original: Value) {
    let expected = encode(expected, as: UInt64.self)
    let original = __EXAtomicCompareExchangeUInt64(
      storage(as: UInt64.self),
      expected,
      encode(desired, as: UInt64.self),
      successOrdering.rawValue,
      failureOrdering.rawValue
    )
    return (original == expected, decode(original))
  }

  /// Returns the original value.
  @inlinable
  func fetchAdd(_ operand: consuming Value, ordering: AtomicUpdateOrdering) -> Value {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      return decode(
        __EXAtomicFetchAddUInt8(storage(as: UInt8.self), encode(operand, as: UInt8.self), ordering.rawValue)
      )
    case 2:
      return decode(
        __EXAtomicFetchAddUInt16(storage(as: UInt16.self), encode(operand, as: UInt16.self), ordering.rawValue)
      )
    case 4:
      return decode(
        __EXAtomicFetchAddUInt32(storage(as: UInt32.self), encode(operand, as: UInt32.self), ordering.rawValue)
      )
    case 8:
      return decode(
        __EXAtomicFetchAddUInt64(storage(as: UInt64.self), encode(operand, as: UInt64.self), ordering.rawValue)
      )
    default:
      unsupportedRepresentation()
    }
  }

  /// Returns the original value.
  @inlinable
  func fetchSubtract(_ operand: consuming Value, ordering: AtomicUpdateOrdering) -> Value {
    switch MemoryLayout<Value.AtomicRepresentation>.size {
    case 1:
      return decode(
        __EXAtomicFetchSubtractUInt8(storage(as: UInt8.self), encode(operand, as: UInt8.self), ordering.rawValue)
      )
    case 2:
      return decode(
        __EXAtomicFetchSubtractUInt16(storage(as: UInt16.self), encode(operand, as: UInt16.self), ordering.rawValue)
      )
    case 4:
      return decode(
        __EXAtomicFetchSubtractUInt32(storage(as: UInt32.self), encode(operand, as: UInt32.self), ordering.rawValue)
      )
    case 8:
      return decode(
        __EXAtomicFetchSubtractUInt64(storage(as: UInt64.self), encode(operand, as: UInt64.self), ordering.rawValue)
      )
    default:
      unsupportedRepresentation()
    }
  }
}

extension Atomic: @unchecked Sendable where Value: Sendable {}
