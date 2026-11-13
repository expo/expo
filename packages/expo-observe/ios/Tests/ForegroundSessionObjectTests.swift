import Testing

@testable import ExpoObserve

@Suite("Foreground session object", .serialized)
struct ForegroundSessionObjectTests {
  @Test
  func `repeated lookups return the identical object`() async throws {
    let session = try await startForegroundSession()
    let first = try #require(try await SessionObject.currentForeground())
    let second = try await SessionObject.currentForeground()
    #expect(first.session === session)
    #expect(first === second)
  }

  @Test
  func `a rotated session gets a new object`() async throws {
    try await startForegroundSession()
    let first = try #require(try await SessionObject.currentForeground())
    let session = try await startForegroundSession()
    let second = try #require(try await SessionObject.currentForeground())
    #expect(second.session === session)
    #expect(first !== second)
  }
}

/// Starts a new foreground session and waits until it is the current one.
@discardableResult
private func startForegroundSession() async throws -> Session {
  let previous = try await AppMetricsActor.isolated { AppMetrics.foregroundSession }.value
  AppMetrics.startNewForegroundSession()
  for _ in 0..<1000 {
    let current = try await AppMetricsActor.isolated { AppMetrics.foregroundSession }.value
    if let current, current !== previous {
      return current
    }
    await Task.yield()
  }
  throw CancellationError()
}
