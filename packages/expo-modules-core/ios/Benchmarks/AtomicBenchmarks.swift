// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for a counter that one thread increments, with `Mutex` and with `Atomic`.
extension Benchmarks {
  @Test
  func `counter: Mutex increment`() async throws {
    try await benchmarkCase {
      let counter = Mutex<UInt64>(0)
      benchmark("counter: Mutex increment", runtime: nil) { iterations in
        for _ in 0..<iterations {
          counter.withLock { $0 &+= 1 }
        }
      }
    }
  }

  @Test
  func `counter: Atomic increment`() async throws {
    try await benchmarkCase {
      let counter = Atomic<UInt64>(0)
      benchmark("counter: Atomic increment", runtime: nil) { iterations in
        for _ in 0..<iterations {
          counter.wrappingAdd(1, ordering: .relaxed)
        }
      }
    }
  }
}
