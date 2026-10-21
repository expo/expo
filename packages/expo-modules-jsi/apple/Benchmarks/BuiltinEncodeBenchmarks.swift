// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Encoding the Foundation types that map to JavaScript built-in classes. Each encode creates an
/// instance with the runtime's global constructor.
extension JSIBenchmarks {
  @Test
  func `encode a date`() async throws {
    try await benchmarkCase { runtime in
      let date = Date(timeIntervalSince1970: 1_700_000_000)
      try benchmark("Date.encode", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Date.encode(date, in: runtime)
        }
      }
    }
  }

  @Test
  func `encode data`() async throws {
    try await benchmarkCase { runtime in
      let data = Data(repeating: 7, count: 16)
      try benchmark("Data.encode: 16 bytes", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try Data.encode(data, in: runtime)
        }
      }
    }
  }
}
