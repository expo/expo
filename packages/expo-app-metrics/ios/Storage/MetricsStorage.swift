// Copyright 2025-present 650 Industries. All rights reserved.

public final class MetricsStorage: Sendable {
  // Number of days after which the entries will not be written back to the storage.
  // When the entries are being read from the storage, the expiration date is not taken into account,
  // meaning that all of them are returned, so it's still possible to consume them from JS or by other libraries.
  private let daysToExpiration: Int

  public let fileUrl: URL

  /**
   Entries from the historical app launches, read from the storage.
   */
  @AppMetricsActor
  var historicalEntries: [Entry]

  /**
   Entry of the current app launch.
   */
  public let currentEntry: Entry

  init(fileName: String = "metrics", expiringAfterDays: Int = 7) {
    let directoryUrl = try! FileManager.default
      .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
      .appendingPathComponent("ExpoAppMetrics")

    self.daysToExpiration = expiringAfterDays
    self.fileUrl = directoryUrl.appendingPathComponent("\(fileName).json")
    self.historicalEntries = (try? readEntries(from: fileUrl)) ?? []

    let nextEntryId = (historicalEntries.first?.id ?? -1) + 1
    self.currentEntry = Entry(id: nextEntryId)
  }

  /**
   Commits the in-memory array of entries and saves them to the file.
   Although some entries are present in memory, invalid entries are not written back to the storage.
   */
  @AppMetricsActor
  public func commit() throws {
    let validEntries = getValidEntries()
    try write(entries: validEntries, to: fileUrl)
  }

  /**
   Deletes all entries held in the memory and from the file.
   */
  @AppMetricsActor
  func clear() throws {
    if FileManager.default.fileExists(atPath: fileUrl.path) {
      try FileManager.default.removeItem(at: fileUrl)
    }
    historicalEntries.removeAll()
  }

  /**
   Returns an array containing the current and historical entries (including expired ones).
   */
  @AppMetricsActor
  public func getAllEntries() -> [Entry] {
    return [currentEntry] + historicalEntries
  }

  /**
   Returns all sessions across the current and historical entries, ordered with the
   current launch first.
   */
  @AppMetricsActor
  public func getAllSessions() -> [Session] {
    return getAllEntries().flatMap({ $0.sessions })
  }

  /**
   Returns all main sessions across the current and historical entries, ordered with the
   current launch first.
   */
  @AppMetricsActor
  public func getAllMainSessions() -> [MainSession] {
    return getAllSessions().compactMap({ $0 as? MainSession })
  }

  /**
   Returns the session with the given id from any entry, or `nil` if no such session exists.
   */
  @AppMetricsActor
  public func findSession(byId id: String) -> Session? {
    return getAllSessions().first { $0.id == id }
  }

  /**
   Returns unexpired and non-empty entries.
   */
  @AppMetricsActor
  func getValidEntries() -> [Entry] {
    let expirationDate = Calendar.current.date(byAdding: .day, value: -daysToExpiration, to: Date.now) ?? Date.distantPast

    return getAllEntries().filter { entry in
      return (entry.metricsCount > 0 || entry.logsCount > 0) && entry.date >= expirationDate
    }
  }

  public final class Entry: Codable, Equatable, Sendable {
    public let id: Int
    public nonisolated(unsafe) var app: AppInfo
    public let device: DeviceInfo
    public let date: Date
    public nonisolated(unsafe) var environment: String?
    public nonisolated(unsafe) var sessions: [Session] = []

    public init(id: Int, date: Date = Date()) {
      self.id = id
      self.app = AppInfo.current
      self.device = DeviceInfo.current
      self.date = date
      self.environment = AppMetricsUserDefaults.environment ?? AppMetricsUserDefaults.getDefaultEnvironment()
      self.sessions = []
    }

    public func add(session: Session) {
      sessions.insert(session, at: 0)
    }

    public var metricsCount: Int {
      return sessions.reduce(0) { $0 + $1.metrics.count }
    }

    public var logsCount: Int {
      return sessions.reduce(0) { $0 + $1.logs.count }
    }

    // MARK: - Codable

    private enum CodingKeys: String, CodingKey {
      case id, app, device, date, environment, sessions
    }

    public init(from decoder: any Decoder) throws {
      let values = try decoder.container(keyedBy: CodingKeys.self)
      id = try values.decode(Int.self, forKey: .id)
      app = try values.decode(AppInfo.self, forKey: .app)
      device = try values.decode(DeviceInfo.self, forKey: .device)
      date = try values.decode(Date.self, forKey: .date)
      environment = try values.decodeIfPresent(String.self, forKey: .environment)
      sessions = try values.decodeIfPresent([SessionCoder].self, forKey: .sessions)?.map { $0.session } ?? []
    }

    public func encode(to encoder: any Encoder) throws {
      var container = encoder.container(keyedBy: CodingKeys.self)
      try container.encode(id, forKey: .id)
      try container.encode(app, forKey: .app)
      try container.encode(device, forKey: .device)
      try container.encode(date, forKey: .date)
      try container.encodeIfPresent(environment, forKey: .environment)
      try container.encode(sessions.map(SessionCoder.init), forKey: .sessions)
    }

    // MARK: - Equatable

    public static func == (lhs: Entry, rhs: Entry) -> Bool {
      return lhs.app == rhs.app && lhs.device == rhs.device && lhs.sessions.elementsEqual(rhs.sessions, by: { $0 === $1 })
    }
  }
}

private func readEntries(from fileUrl: URL) throws -> [MetricsStorage.Entry] {
  if !FileManager.default.fileExists(atPath: fileUrl.path) {
    return []
  }
  let fileContents = try Data(contentsOf: fileUrl)
  let decoder = JSONDecoder()
  decoder.dateDecodingStrategy = .iso8601

  return try decoder.decode([MetricsStorage.Entry].self, from: fileContents)
}

private func write(entries: [MetricsStorage.Entry], to fileUrl: URL) throws {
  try FileManager.default.createDirectory(at: fileUrl.deletingLastPathComponent(), withIntermediateDirectories: true)
  let encoder = JSONEncoder()
  encoder.dateEncodingStrategy = .iso8601

  let data = try encoder.encode(entries)
  try data.write(to: fileUrl)
}
