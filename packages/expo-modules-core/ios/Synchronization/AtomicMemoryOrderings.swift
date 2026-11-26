// Copyright 2026-present 650 Industries. All rights reserved.

/// A backport of `AtomicLoadOrdering` from the Synchronization framework (iOS 18+).
/// The memory ordering of an atomic load.
@available(iOS, deprecated: 18.0, message: "Use AtomicLoadOrdering from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use AtomicLoadOrdering from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use AtomicLoadOrdering from the Synchronization framework")
@frozen
public struct AtomicLoadOrdering {
  /// One of Clang's `__ATOMIC_*` values, which the functions of `EXAtomic.h` take.
  @usableFromInline
  let rawValue: Int32

  @inlinable
  init(rawValue: Int32) {
    self.rawValue = rawValue
  }

  /// Guarantees only that the load itself is atomic. It orders no other memory access.
  @inlinable
  public static var relaxed: AtomicLoadOrdering {
    return AtomicLoadOrdering(rawValue: 0)
  }

  /// Makes the writes that a releasing operation published visible to the memory accesses after the load.
  @inlinable
  public static var acquiring: AtomicLoadOrdering {
    return AtomicLoadOrdering(rawValue: 2)
  }

  /// Acquiring, and also puts the load in the single total order of all sequentially consistent operations.
  @inlinable
  public static var sequentiallyConsistent: AtomicLoadOrdering {
    return AtomicLoadOrdering(rawValue: 5)
  }

  /// The ordering of the load that a failed compare-exchange operation does, which can't release.
  @inlinable
  static func failureOrdering(for ordering: AtomicUpdateOrdering) -> AtomicLoadOrdering {
    switch ordering.rawValue {
    case AtomicUpdateOrdering.releasing.rawValue:
      return .relaxed
    case AtomicUpdateOrdering.acquiringAndReleasing.rawValue:
      return .acquiring
    default:
      return AtomicLoadOrdering(rawValue: ordering.rawValue)
    }
  }
}

/// A backport of `AtomicStoreOrdering` from the Synchronization framework (iOS 18+).
/// The memory ordering of an atomic store.
@available(iOS, deprecated: 18.0, message: "Use AtomicStoreOrdering from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use AtomicStoreOrdering from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use AtomicStoreOrdering from the Synchronization framework")
@frozen
public struct AtomicStoreOrdering {
  /// One of Clang's `__ATOMIC_*` values, which the functions of `EXAtomic.h` take.
  @usableFromInline
  let rawValue: Int32

  @inlinable
  init(rawValue: Int32) {
    self.rawValue = rawValue
  }

  /// Guarantees only that the store itself is atomic. It orders no other memory access.
  @inlinable
  public static var relaxed: AtomicStoreOrdering {
    return AtomicStoreOrdering(rawValue: 0)
  }

  /// Publishes the memory accesses before the store to the threads that load the value with an acquiring ordering.
  @inlinable
  public static var releasing: AtomicStoreOrdering {
    return AtomicStoreOrdering(rawValue: 3)
  }

  /// Releasing, and also puts the store in the single total order of all sequentially consistent operations.
  @inlinable
  public static var sequentiallyConsistent: AtomicStoreOrdering {
    return AtomicStoreOrdering(rawValue: 5)
  }
}

/// A backport of `AtomicUpdateOrdering` from the Synchronization framework (iOS 18+).
/// The memory ordering of an atomic operation that loads and stores the value.
@available(iOS, deprecated: 18.0, message: "Use AtomicUpdateOrdering from the Synchronization framework")
@available(macOS, deprecated: 15.0, message: "Use AtomicUpdateOrdering from the Synchronization framework")
@available(tvOS, deprecated: 18.0, message: "Use AtomicUpdateOrdering from the Synchronization framework")
@frozen
public struct AtomicUpdateOrdering {
  /// One of Clang's `__ATOMIC_*` values, which the functions of `EXAtomic.h` take.
  @usableFromInline
  let rawValue: Int32

  @inlinable
  init(rawValue: Int32) {
    self.rawValue = rawValue
  }

  /// Guarantees only that the operation itself is atomic. It orders no other memory access.
  @inlinable
  public static var relaxed: AtomicUpdateOrdering {
    return AtomicUpdateOrdering(rawValue: 0)
  }

  /// Makes the writes that a releasing operation published visible to the memory accesses after the operation.
  @inlinable
  public static var acquiring: AtomicUpdateOrdering {
    return AtomicUpdateOrdering(rawValue: 2)
  }

  /// Publishes the memory accesses before the operation to the threads that load the value with an acquiring
  /// ordering.
  @inlinable
  public static var releasing: AtomicUpdateOrdering {
    return AtomicUpdateOrdering(rawValue: 3)
  }

  /// Both acquiring and releasing.
  @inlinable
  public static var acquiringAndReleasing: AtomicUpdateOrdering {
    return AtomicUpdateOrdering(rawValue: 4)
  }

  /// Acquiring and releasing, and also puts the operation in the single total order of all sequentially consistent
  /// operations.
  @inlinable
  public static var sequentiallyConsistent: AtomicUpdateOrdering {
    return AtomicUpdateOrdering(rawValue: 5)
  }
}
