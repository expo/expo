// Copyright 2022-present 650 Industries. All rights reserved.
import Testing
import Foundation

internal func expectEventually(
  _ condition: @escaping () async throws -> Bool,
  timeout: TimeInterval = 2.0,
  pollInterval: TimeInterval = 0.05
) async throws {
  let start = Date()
  while Date().timeIntervalSince(start) < timeout {
    if try await condition() {
      return
    }
    try await Task.sleep(nanoseconds: UInt64(pollInterval * 1_000_000_000))
  }
  let result = try await condition()
  #expect(result, "Condition was not met within \(timeout) seconds")
}
