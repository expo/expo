// Copyright 2015-present 650 Industries. All rights reserved.

internal final class AtomicInteger {
  private let lock = DispatchSemaphore(value: 1)
  private var value: Int

  init(_ value: Int = 0) {
    self.value = value
  }

  func increment() -> Int {
    lock.wait()
    defer {
      lock.signal()
    }
    value += 1
    return value
  }

  func decrement() -> Int {
    lock.wait()
    defer {
      lock.signal()
    }
    value -= 1
    return value
  }

  func get() -> Int {
    lock.wait()
    defer {
      lock.signal()
    }
    return value
  }

  func set(_ newValue: Int) {
    lock.wait()
    defer {
      lock.signal()
    }
    value = newValue
  }
}
