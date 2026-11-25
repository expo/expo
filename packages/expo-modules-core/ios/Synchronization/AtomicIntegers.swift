// Copyright 2026-present 650 Industries. All rights reserved.

// The arithmetic of `Atomic` for each integer type, as in the Synchronization framework.

extension Atomic where Value == Int {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: Int,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int, newValue: Int) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: Int,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int, newValue: Int) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == Int8 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: Int8,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int8, newValue: Int8) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: Int8,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int8, newValue: Int8) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == Int16 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: Int16,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int16, newValue: Int16) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: Int16,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int16, newValue: Int16) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == Int32 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: Int32,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int32, newValue: Int32) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: Int32,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int32, newValue: Int32) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == Int64 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: Int64,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int64, newValue: Int64) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: Int64,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: Int64, newValue: Int64) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == UInt {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: UInt,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt, newValue: UInt) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: UInt,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt, newValue: UInt) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == UInt8 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: UInt8,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt8, newValue: UInt8) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: UInt8,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt8, newValue: UInt8) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == UInt16 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: UInt16,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt16, newValue: UInt16) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: UInt16,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt16, newValue: UInt16) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == UInt32 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: UInt32,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt32, newValue: UInt32) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: UInt32,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt32, newValue: UInt32) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}

extension Atomic where Value == UInt64 {
  /// Atomically adds the operand to the current value and returns the old and new values. The operation wraps around
  /// on overflow, like the `&+` operator.
  @inlinable
  @discardableResult
  public func wrappingAdd(
    _ operand: UInt64,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt64, newValue: UInt64) {
    let oldValue = fetchAdd(operand, ordering: ordering)
    return (oldValue, oldValue &+ operand)
  }

  /// Atomically subtracts the operand from the current value and returns the old and new values. The operation wraps
  /// around on overflow, like the `&-` operator.
  @inlinable
  @discardableResult
  public func wrappingSubtract(
    _ operand: UInt64,
    ordering: AtomicUpdateOrdering
  ) -> (oldValue: UInt64, newValue: UInt64) {
    let oldValue = fetchSubtract(operand, ordering: ordering)
    return (oldValue, oldValue &- operand)
  }
}
