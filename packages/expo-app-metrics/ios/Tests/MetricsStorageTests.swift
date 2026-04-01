import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("MetricsStorage")
struct MetricsStorageTests {
  @Test
  func `has a valid file URL`() {
    let storage = MetricsStorage(fileName: "test_file_url")
    #expect(storage.fileUrl.isFileURL)
    #expect(storage.fileUrl.pathExtension == "json")
  }

  @Test
  func `has current entry`() {
    let storage = MetricsStorage(fileName: "test_inserting")
    let allEntries = storage.getAllEntries()
    #expect(allEntries.count == 1)
    #expect(allEntries.first == storage.currentEntry)
  }

  @Test
  func `inserts new entries`() {
    let storage = MetricsStorage(fileName: "test_inserting")
    let entry = MetricsStorage.Entry(id: 0)
    #expect(storage.historicalEntries.count == 0)
    storage.historicalEntries.append(entry)
    #expect(storage.historicalEntries.count == 1)
    #expect(storage.historicalEntries.first == entry)
  }

  @Test
  func `writes to disk on commit`() throws {
    let storage = MetricsStorage(fileName: "test_commit")
    try storage.commit()
    #expect(FileManager.default.fileExists(atPath: storage.fileUrl.path))
  }

  @Test
  func `removes the file after clearing`() throws {
    let storage = MetricsStorage(fileName: "test_clearing")
    try storage.commit()
    try storage.clear()
    #expect(FileManager.default.fileExists(atPath: storage.fileUrl.path) == false)
  }

  @Test
  func `stores session metrics`() async throws {
    let storage = MetricsStorage(fileName: "test_session_metrics")
    let session = MainSession()
    storage.currentEntry.add(session: session)
    // Simulate receiving some metrics
    session.receiveMetric(Metric(category: .appStartup, name: "test", value: 3.0))
    // Stop the session to set the `endTime`
    session.stop()
    // Save the storage
    try storage.commit()
    // Restore the storage by creating a new one that reads from the same file
    let restoredStorage = MetricsStorage(fileName: "test_session_metrics")
    let restoredSession = try #require(restoredStorage.historicalEntries.first?.sessions.first)
    #expect(restoredSession.id == session.id)
    // Dates can be actually different because encoding/decoding them might lose some precision
    #expect(restoredSession.startDate.timeIntervalSince(session.startDate) < 1.0)
    #expect(restoredSession.endDate!.timeIntervalSince(session.endDate!) < 1.0)
    #expect(restoredSession.metrics.count == session.metrics.count)
    for (restoredMetric, metric) in zip(restoredSession.metrics, session.metrics) {
      #expect(restoredMetric.category == metric.category)
      #expect(restoredMetric.name == metric.name)
      #expect(restoredMetric.value == metric.value)
    }
  }

  @Test
  func `returns only non-empty and unexpired entries`() throws {
    let storage = MetricsStorage(fileName: "test_valid_entries", expiringAfterDays: 1)
    let validEntry = MetricsStorage.Entry(id: 0, date: Date.now)
    let expiredEntry = MetricsStorage.Entry(id: 1, date: Date.now.addingTimeInterval(-60 * 60 * 24))
    let emptyEntry = MetricsStorage.Entry(id: 2, date: Date.now)
    // Create a session with a fake metric and add to non-empty entries
    let session = Session()
    session.receiveMetric(Metric(category: .appStartup, name: "test", value: 1.0))
    validEntry.add(session: session)
    expiredEntry.add(session: session)
    // Add all entries to the storage
    storage.historicalEntries.append(validEntry)
    storage.historicalEntries.append(expiredEntry)
    storage.historicalEntries.append(emptyEntry)
    // Get valid entries (should be just one, others are empty/expired)
    let validEntries = storage.getValidEntries()
    #expect(validEntries.count == 1)
    #expect(validEntries.first == validEntry)
  }

  @Test
  func `does not write empty entries`() throws {
    let storage = MetricsStorage(fileName: "test_writing_empty")
    let emptyEntry = MetricsStorage.Entry(id: 0)
    let session = Session()
    emptyEntry.add(session: session)
    storage.historicalEntries.append(emptyEntry)
    // The entry is still in memory, but is not valid
    #expect(storage.getAllEntries().contains(emptyEntry))
    #expect(storage.getValidEntries().contains(emptyEntry) == false)
    // Only valid entries are saved to the file
    try storage.commit()
    let restoredStorage = MetricsStorage(fileName: "test_writing_empty")
    #expect(restoredStorage.getAllEntries().count == 1)
    #expect(restoredStorage.getAllEntries().first == restoredStorage.currentEntry)
  }

  @Test
  func `does not write expired entries`() throws {
    let storage = MetricsStorage(fileName: "test_writing_expired", expiringAfterDays: 1)
    let expiredEntry = MetricsStorage.Entry(id: 0, date: Date.now.addingTimeInterval(-60 * 60 * 24))
    let session = Session()
    expiredEntry.add(session: session)
    storage.historicalEntries.append(expiredEntry)
    // Make the entry non-empty
    session.receiveMetric(Metric(category: .appStartup, name: "test", value: 2.1))
    try storage.commit()
    let restoredStorage = MetricsStorage(fileName: "test_writing_expired", expiringAfterDays: 1)
    #expect(restoredStorage.getAllEntries().count == 1)
    #expect(restoredStorage.getAllEntries().first == restoredStorage.currentEntry)
  }

  @AppMetricsActor
  @Suite("Entry")
  struct EntryTests {
    @Test
    func `has current app and device info`() {
      let entry = MetricsStorage.Entry(id: 0)
      #expect(entry.app == AppInfo.current)
      #expect(entry.device == DeviceInfo.current)
    }

    @Test
    func `adds a session`() {
      let entry = MetricsStorage.Entry(id: 0)
      let session = Session()
      entry.add(session: session)
      #expect(entry.sessions.count == 1)
      #expect(entry.sessions.first === session)
    }

    @Test
    func `equals`() {
      let entry1 = MetricsStorage.Entry(id: 0)
      let entry2 = MetricsStorage.Entry(id: 1)
      let session = Session()
      #expect(entry1 == entry2)
      entry1.add(session: session)
      entry2.add(session: session)
      #expect(entry1 == entry2)
    }

    @Test
    func `does not equal`() {
      let entry1 = MetricsStorage.Entry(id: 0)
      let entry2 = MetricsStorage.Entry(id: 1)
      entry1.add(session: Session())
      #expect(entry1 != entry2)
    }

    @Test
    func `encodes to JSON`() throws {
      let entry = MetricsStorage.Entry(id: 0)
      let data = try JSONEncoder().encode(entry)
      let json = try #require(JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any])
      let appInfo = try #require(json["app"] as? [String: String])
      let deviceInfo = try #require(json["device"] as? [String: String])
      #expect(appInfo["appName"] == entry.app.appName)
      #expect(appInfo["appVersion"] == entry.app.appVersion)
      #expect(deviceInfo["modelName"] == entry.device.modelName)
      #expect(deviceInfo["systemVersion"] == entry.device.systemVersion)
      #expect(try #require(json["sessions"] as? [Any]).count == 0)
    }

    @Test
    func `decodes from JSON`() throws {
      let json: [String: Any] = [
        "id": 0,
        "app": [
          "appVersion": "16.0",
          "appId": "com.apple.dt.xctest.tool",
          "buildNumber": "24419",
          "appName": "xctest",
        ],
        "device": [
          "modelIdentifier": "iPhone 17 Pro Max",
          "modelName": "iPhone",
          "systemVersion": "26.1",
          "systemName": "iOS",
        ],
        "date": "2025-11-16T20:37:00Z",
        "sessions": [],
      ]
      let data = try JSONSerialization.data(withJSONObject: json, options: [])
      let decoder = JSONDecoder()
      decoder.dateDecodingStrategy = .iso8601
      let entry = try decoder.decode(MetricsStorage.Entry.self, from: data)
      let appInfo = try #require(json["app"] as? [String: String])
      let deviceInfo = try #require(json["device"] as? [String: String])
      #expect(entry.app.appId == appInfo["appId"])
      #expect(entry.app.buildNumber == appInfo["buildNumber"])
      #expect(entry.device.modelIdentifier == deviceInfo["modelIdentifier"])
      #expect(entry.device.systemName == deviceInfo["systemName"])
      #expect(entry.sessions.count == 0)
    }
  }
}
