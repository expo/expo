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
      let appInfo = try #require(json["app"] as? [String: Any])
      let deviceInfo = try #require(json["device"] as? [String: String])
      #expect(appInfo["appName"] as? String == entry.app.appName)
      #expect(appInfo["appVersion"] as? String == entry.app.appVersion)
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
          "clientVersion": "55.0.10",
          "reactNativeVersion": "0.83.4",
          "expoSdkVersion": "55.0.11",
          "easBuildId": "xxxx-xxxxxxxxxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxx",
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

  @AppMetricsActor
  @Suite("Polymorphic session decoding")
  struct PolymorphicSessionDecodingTests {
    @Test
    func `restores a MainSession as a MainSession`() throws {
      let storage = MetricsStorage(fileName: "test_polymorphic_main")
      let session = MainSession()
      storage.currentEntry.add(session: session)
      session.receiveMetric(Metric(category: .appStartup, name: "test", value: 1.0))
      try storage.commit()

      let restoredStorage = MetricsStorage(fileName: "test_polymorphic_main")
      let restoredSession = try #require(restoredStorage.historicalEntries.first?.sessions.first)
      #expect(restoredSession is MainSession)
      #expect(restoredSession.type == .main)
    }

    @Test
    func `restores a ForegroundSession as a ForegroundSession`() throws {
      let storage = MetricsStorage(fileName: "test_polymorphic_foreground")
      let session = ForegroundSession()
      storage.currentEntry.add(session: session)
      session.receiveMetric(Metric(category: .session, name: "test", value: 1.0))
      try storage.commit()

      let restoredStorage = MetricsStorage(fileName: "test_polymorphic_foreground")
      let restoredSession = try #require(restoredStorage.historicalEntries.first?.sessions.first)
      #expect(restoredSession is ForegroundSession)
      #expect(restoredSession.type == .foreground)
    }

    @Test
    func `restores mixed session types in their original order`() throws {
      let storage = MetricsStorage(fileName: "test_polymorphic_mixed")
      let mainSession = MainSession()
      let foregroundSession = ForegroundSession()
      // `add(session:)` inserts at index 0, so the foreground session ends up first.
      storage.currentEntry.add(session: mainSession)
      storage.currentEntry.add(session: foregroundSession)
      mainSession.receiveMetric(Metric(category: .appStartup, name: "test", value: 1.0))
      foregroundSession.receiveMetric(Metric(category: .session, name: "test", value: 1.0))
      try storage.commit()

      let restoredStorage = MetricsStorage(fileName: "test_polymorphic_mixed")
      let restoredSessions = try #require(restoredStorage.historicalEntries.first?.sessions)
      #expect(restoredSessions.count == 2)
      #expect(restoredSessions[0] is ForegroundSession)
      #expect(restoredSessions[1] is MainSession)
    }

    @Test
    func `falls back to base Session for unknown type`() throws {
      let json: [String: Any] = [
        "id": "00000000-0000-0000-0000-000000000000",
        "startDate": "2025-11-16T20:37:00Z",
        "metrics": [],
      ]
      let data = try JSONSerialization.data(withJSONObject: json, options: [])
      let decoder = JSONDecoder()
      decoder.dateDecodingStrategy = .iso8601
      let coder = try decoder.decode(SessionCoder.self, from: data)
      #expect(coder.session is MainSession == false)
      #expect(coder.session is ForegroundSession == false)
      #expect(coder.session.type == .unknown)
    }

    @Test
    func `decodes legacy JSON written before polymorphic decoding`() throws {
      // Sessions encoded by versions up to and including 0.1.9 used synthesized Codable.
      // `SessionCoder` reads the same field names from the same shape, so existing
      // on-disk files written by those versions must keep decoding.
      let json: [String: Any] = [
        "id": 0,
        "app": [
          "appVersion": "16.0",
          "appId": "com.apple.dt.xctest.tool",
          "buildNumber": "24419",
          "appName": "xctest",
          "clientVersion": "0.1.9",
          "reactNativeVersion": "0.85.2",
          "expoSdkVersion": "55.0.11",
          "easBuildId": "xxxx-xxxxxxxxxxxxxxx-xxxx-xxxx-xxxxxxxxxxxxxx",
        ],
        "device": [
          "modelIdentifier": "iPhone 17 Pro Max",
          "modelName": "iPhone",
          "systemVersion": "26.1",
          "systemName": "iOS",
        ],
        "date": "2025-11-16T20:37:00Z",
        "sessions": [
          [
            "id": "11111111-1111-1111-1111-111111111111",
            "type": "main",
            "startDate": "2025-11-16T20:37:00Z",
            "endDate": "2025-11-16T20:38:00Z",
            "metrics": [
              ["category": "appStartup", "name": "test", "value": 1.5, "timestamp": "2025-11-16T20:37:30Z"],
            ],
          ],
          [
            "id": "22222222-2222-2222-2222-222222222222",
            "type": "foreground",
            "startDate": "2025-11-16T20:37:05Z",
            "endDate": "2025-11-16T20:37:50Z",
            "metrics": [],
          ],
        ],
      ]
      let data = try JSONSerialization.data(withJSONObject: json, options: [])
      let decoder = JSONDecoder()
      decoder.dateDecodingStrategy = .iso8601
      let entry = try decoder.decode(MetricsStorage.Entry.self, from: data)

      #expect(entry.sessions.count == 2)
      let mainSession = try #require(entry.sessions.first)
      #expect(mainSession is MainSession)
      #expect(mainSession.id == "11111111-1111-1111-1111-111111111111")
      #expect(mainSession.metrics.count == 1)
      #expect(mainSession.metrics.first?.value == 1.5)

      let foregroundSession = try #require(entry.sessions.last)
      #expect(foregroundSession is ForegroundSession)
      #expect(foregroundSession.id == "22222222-2222-2222-2222-222222222222")
      #expect(foregroundSession.metrics.isEmpty)
    }

    @Test
    func `getAllMainSessions returns only MainSession instances across entries`() throws {
      let storage = MetricsStorage(fileName: "test_polymorphic_accessor")
      // Clear any leftover state from previous test runs persisted in the documents directory.
      try storage.clear()
      // Current entry: one main + one foreground.
      let currentMain = MainSession()
      let currentForeground = ForegroundSession()
      storage.currentEntry.add(session: currentMain)
      storage.currentEntry.add(session: currentForeground)
      currentMain.receiveMetric(Metric(category: .appStartup, name: "test", value: 1.0))
      // Historical entry: one main + one foreground, persisted via commit + reload.
      let historicalMain = MainSession()
      let historicalForeground = ForegroundSession()
      storage.currentEntry.add(session: historicalMain)
      storage.currentEntry.add(session: historicalForeground)
      historicalMain.receiveMetric(Metric(category: .appStartup, name: "test", value: 2.0))
      try storage.commit()

      let restoredStorage = MetricsStorage(fileName: "test_polymorphic_accessor")
      // The new launch creates a fresh current entry with no sessions, so all main sessions
      // come from the restored historical entry.
      let mainSessions = restoredStorage.getAllMainSessions()
      #expect(mainSessions.count == 2)
      #expect(mainSessions.allSatisfy({ $0.type == .main }))
    }
  }
}
