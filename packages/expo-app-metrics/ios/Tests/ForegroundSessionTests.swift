import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("ForegroundSession")
struct ForegroundSessionTests {
  @Test
  func `initializes with foreground type`() {
    let session = ForegroundSession()
    #expect(session.type == .foreground)
  }

  @Test
  func `has a unique ID`() {
    let session1 = ForegroundSession()
    let session2 = ForegroundSession()
    #expect(session1.id != session2.id)
  }

  @Test
  func `is initially active`() {
    let session = ForegroundSession()
    #expect(session.isActive == true)
    #expect(session.endDate == nil)
  }

  @Test
  func `becomes inactive after stopping`() {
    let session = ForegroundSession()
    session.stop()
    #expect(session.isActive == false)
    #expect(session.endDate != nil)
  }

  @Test
  func `cannot be stopped twice`() {
    let session = ForegroundSession()
    session.stop()
    let firstEndDate = session.endDate

    // Try stopping again
    session.stop()
    #expect(session.endDate == firstEndDate)
  }

  @Test
  func `calculates duration while active`() async throws {
    let session = ForegroundSession()
    let initialDuration = session.duration

    // Wait a bit
    try await Task.sleep(for: .milliseconds(100))

    let laterDuration = session.duration
    #expect(laterDuration > initialDuration)
    #expect(laterDuration >= 0.1)
  }

  @Test
  func `calculates duration after stopping`() async throws {
    let session = ForegroundSession()

    // Wait a bit before stopping
    try await Task.sleep(for: .milliseconds(100))

    session.stop()
    let durationAfterStop = session.duration

    // Wait more and verify duration doesn't change
    try await Task.sleep(for: .milliseconds(50))

    #expect(session.duration == durationAfterStop)
    #expect(session.duration >= 0.1)
  }

  @Test
  func `starts and stops multiple sessions`() {
    let session1 = ForegroundSession()
    let session2 = ForegroundSession()

    session1.stop()

    #expect(session1.isActive == false)
    #expect(session2.isActive == true)
    #expect(session1.id != session2.id)

    session2.stop()

    #expect(session2.isActive == false)
  }
}
