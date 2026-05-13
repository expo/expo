import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("Sessions module")
struct SessionsModuleTests {
  @AppMetricsActor
  @Suite("findSession(byId:)")
  struct FindSessionTests {
    @Test
    func `returns a session from the current entry`() async throws {
      let storage = MetricsStorage(fileName: "test_find_in_current")
      try storage.clear()
      let session = Session(id: "abc", type: .custom, startDate: .now, endDate: nil)
      storage.currentEntry.add(session: session)

      let found = storage.findSession(byId: "abc")
      #expect(found === session)
    }

    @Test
    func `returns a session from a historical entry`() async throws {
      let storage = MetricsStorage(fileName: "test_find_in_historical")
      try storage.clear()
      let historical = MetricsStorage.Entry(id: 0)
      let session = Session(id: "hist", type: .custom, startDate: .now, endDate: nil)
      historical.add(session: session)
      storage.historicalEntries.append(historical)

      let found = storage.findSession(byId: "hist")
      #expect(found === session)
    }

    @Test
    func `returns nil for an unknown id`() async throws {
      let storage = MetricsStorage(fileName: "test_find_unknown")
      try storage.clear()
      storage.currentEntry.add(session: Session(id: "abc", type: .custom, startDate: .now, endDate: nil))

      #expect(storage.findSession(byId: "missing") == nil)
    }
  }

  @AppMetricsActor
  @Suite("End-to-end on isolated storage")
  struct EndToEndTests {
    @Test
    func `findSession then receiveMetric appends to the addressed session`() async throws {
      let storage = MetricsStorage(fileName: "test_e2e_receive")
      try storage.clear()
      let session = Session(id: "s1", type: .custom, startDate: .now, endDate: nil)
      storage.currentEntry.add(session: session)

      var jsMetric = JsMetric()
      jsMetric.sessionId = "s1"
      jsMetric.category = "navigation"
      jsMetric.name = "ttr"
      jsMetric.value = 0.42

      storage.findSession(byId: "s1")?.receiveMetric(jsMetric.toMetric())

      #expect(session.metrics.count == 1)
      #expect(session.metrics.first?.name == "ttr")
      #expect(session.metrics.first?.value == 0.42)
    }
  }
}
