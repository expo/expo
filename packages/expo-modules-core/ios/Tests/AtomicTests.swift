// Copyright 2026-present 650 Industries. All rights reserved.

import Dispatch
import Testing

@testable import ExpoModulesCore

@Suite("Atomic")
struct AtomicTests {
  @Test
  func `operations on signed integers`() {
    expectOperations(Int8.min, Int8.max)
    expectOperations(Int16.min, Int16.max)
    expectOperations(Int32.min, Int32.max)
    expectOperations(Int64.min, Int64.max)
    expectOperations(Int.min, Int.max)
  }

  @Test
  func `operations on unsigned integers`() {
    expectOperations(UInt8.min, UInt8.max)
    expectOperations(UInt16.min, UInt16.max)
    expectOperations(UInt32.min, UInt32.max)
    expectOperations(UInt64.min, UInt64.max)
    expectOperations(UInt.min, UInt.max)
  }

  @Test
  func `operations on booleans`() {
    expectOperations(false, true)
  }

  @Test
  func `wrapping arithmetic on signed integers`() {
    let int8 = Atomic<Int8>(.max - 1)
    #expect(int8.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(int8.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(int8.load(ordering: .relaxed) == Int8.max - 2)

    let int16 = Atomic<Int16>(.max - 1)
    #expect(int16.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(int16.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(int16.load(ordering: .relaxed) == Int16.max - 2)

    let int32 = Atomic<Int32>(.max - 1)
    #expect(int32.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(int32.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(int32.load(ordering: .relaxed) == Int32.max - 2)

    let int64 = Atomic<Int64>(.max - 1)
    #expect(int64.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(int64.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(int64.load(ordering: .relaxed) == Int64.max - 2)

    let int = Atomic<Int>(.max - 1)
    #expect(int.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(int.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(int.load(ordering: .relaxed) == Int.max - 2)
  }

  @Test
  func `wrapping arithmetic on unsigned integers`() {
    let uint8 = Atomic<UInt8>(.max - 1)
    #expect(uint8.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(uint8.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(uint8.load(ordering: .relaxed) == UInt8.max - 2)

    let uint16 = Atomic<UInt16>(.max - 1)
    #expect(uint16.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(uint16.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(uint16.load(ordering: .relaxed) == UInt16.max - 2)

    let uint32 = Atomic<UInt32>(.max - 1)
    #expect(uint32.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(uint32.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(uint32.load(ordering: .relaxed) == UInt32.max - 2)

    let uint64 = Atomic<UInt64>(.max - 1)
    #expect(uint64.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(uint64.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(uint64.load(ordering: .relaxed) == UInt64.max - 2)

    let uint = Atomic<UInt>(.max - 1)
    #expect(uint.wrappingAdd(2, ordering: .relaxed) == (.max - 1, .min))
    #expect(uint.wrappingSubtract(3, ordering: .relaxed) == (.min, .max - 2))
    #expect(uint.load(ordering: .relaxed) == UInt.max - 2)
  }

  @Test
  func `operations with every ordering`() {
    let atomic = Atomic<Int>(0)
    let loadOrderings: [AtomicLoadOrdering] = [.relaxed, .acquiring, .sequentiallyConsistent]
    let storeOrderings: [AtomicStoreOrdering] = [.relaxed, .releasing, .sequentiallyConsistent]
    let updateOrderings: [AtomicUpdateOrdering] = [
      .relaxed, .acquiring, .releasing, .acquiringAndReleasing, .sequentiallyConsistent,
    ]

    for (index, ordering) in storeOrderings.enumerated() {
      atomic.store(index, ordering: ordering)
      for loadOrdering in loadOrderings {
        #expect(atomic.load(ordering: loadOrdering) == index)
      }
    }
    for ordering in updateOrderings {
      atomic.store(0, ordering: .relaxed)
      #expect(atomic.exchange(1, ordering: ordering) == 0)
      #expect(atomic.compareExchange(expected: 0, desired: 2, ordering: ordering) == (false, 1))
      #expect(atomic.compareExchange(expected: 1, desired: 2, ordering: ordering) == (true, 1))
      #expect(atomic.wrappingAdd(3, ordering: ordering) == (2, 5))
      #expect(atomic.wrappingSubtract(4, ordering: ordering) == (5, 1))

      for failureOrdering in loadOrderings {
        let failed = atomic.compareExchange(
          expected: 0,
          desired: 2,
          successOrdering: ordering,
          failureOrdering: failureOrdering
        )
        #expect(failed == (false, 1))
        let exchanged = atomic.compareExchange(
          expected: 1,
          desired: 1,
          successOrdering: ordering,
          failureOrdering: failureOrdering
        )
        #expect(exchanged == (true, 1))
      }
    }
  }

  @Test
  func `increments from many threads add up`() {
    let threadCount = 16
    let incrementsPerThread = 100_000
    let counter = Atomic<Int>(0)

    DispatchQueue.concurrentPerform(iterations: threadCount) { _ in
      for _ in 0..<incrementsPerThread {
        counter.wrappingAdd(1, ordering: .relaxed)
      }
    }
    #expect(counter.load(ordering: .relaxed) == threadCount * incrementsPerThread)
  }
}

/// Runs each operation of `Atomic` on two different values of one type.
private func expectOperations<Value: AtomicRepresentable & Equatable>(_ first: Value, _ second: Value) {
  let atomic = Atomic(first)
  #expect(atomic.load(ordering: .relaxed) == first)

  atomic.store(second, ordering: .relaxed)
  #expect(atomic.load(ordering: .relaxed) == second)

  #expect(atomic.exchange(first, ordering: .relaxed) == second)
  #expect(atomic.compareExchange(expected: second, desired: second, ordering: .relaxed) == (false, first))
  #expect(atomic.compareExchange(expected: first, desired: second, ordering: .relaxed) == (true, first))

  let failed = atomic.compareExchange(
    expected: first,
    desired: first,
    successOrdering: .relaxed,
    failureOrdering: .relaxed
  )
  #expect(failed == (false, second))
  let exchanged = atomic.compareExchange(
    expected: second,
    desired: first,
    successOrdering: .relaxed,
    failureOrdering: .relaxed
  )
  #expect(exchanged == (true, second))
  #expect(atomic.load(ordering: .relaxed) == first)
}
