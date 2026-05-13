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
  func `receives metrics`() {
    let session = ForegroundSession()
    let metric = Metric(category: .session, name: "test_metric", value: 42.0)

    session.receiveMetric(metric)

    #expect(session.metrics.count == 1)
    #expect(session.metrics.first?.name == "test_metric")
    #expect(session.metrics.first?.value == 42.0)
  }

  @Test
  func `adds duration metric when stopped`() {
    let session = ForegroundSession()
    let initialMetricsCount = session.metrics.count

    session.stop()

    #expect(session.metrics.count == initialMetricsCount + 1)

    let durationMetric = session.metrics.first { $0.name == "duration" }
    #expect(durationMetric != nil)
    #expect(durationMetric?.category == .session)
    #expect(durationMetric?.value == session.duration)
  }

  @Test
  func `encodes to JSON`() throws {
    let session = ForegroundSession()
    session.receiveMetric(Metric(category: .session, name: "test", value: 1.0))
    session.stop()

    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    let data = try encoder.encode(session)

    let json = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
    #expect(json["id"] as? String == session.id)
    #expect(json["type"] as? String == "foreground")
    #expect(json["startDate"] != nil)
    #expect(json["endDate"] != nil)

    let metrics = try #require(json["metrics"] as? [[String: Any]])
    #expect(metrics.count >= 1)
  }

  @Test
  func `decodes from JSON`() throws {
    let sessionId = UUID().uuidString
    let json: [String: Any] = [
      "id": sessionId,
      "type": "foreground",
      "startDate": "2026-02-19T12:00:00Z",
      "endDate": "2026-02-19T12:05:00Z",
      "metrics": [
        [
          "category": "session",
          "name": "duration",
          "value": 300.0,
          "timestamp": "2026-02-19T12:05:00Z"
        ]
      ]
    ]

    let data = try JSONSerialization.data(withJSONObject: json)
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601

    let session = try decoder.decode(ForegroundSession.self, from: data)

    #expect(session.id == sessionId)
    #expect(session.type == .foreground)
    #expect(session.isActive == false)
    #expect(session.metrics.count == 1)
    #expect(session.metrics.first?.name == "duration")
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
