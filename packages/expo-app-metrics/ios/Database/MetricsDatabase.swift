// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SQLite3

/**
 SQLite-backed storage for sessions, metrics, logs and crash reports.

 All read/write methods are isolated to `AppMetricsActor`. The connection itself is opened with
 `SQLITE_OPEN_FULLMUTEX`, but our higher-level data is not — the actor isolation is what guarantees
 consistent reads.
 */
public final class MetricsDatabase {
  /**
   Schema version stamped into the database on first open. Bumped only when migrations are added.
   */
  static let currentSchemaVersion = 1

  let database: SQLiteDatabase

  public let fileUrl: URL

  convenience init(fileName: String = "metrics") throws {
    let directoryUrl = try FileManager.default
      .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      .appendingPathComponent("ExpoAppMetrics")
    try self.init(directoryUrl: directoryUrl, fileName: fileName)
  }

  /**
   Designated initializer. Tests use this overload to point the database at a temporary directory
   instead of the user's documents directory.
   */
  init(directoryUrl: URL, fileName: String = "metrics") throws {
    self.fileUrl = directoryUrl.appendingPathComponent("\(fileName).db")
    self.database = try Self.openConnection(fileUrl: fileUrl)
    try createSchemaIfNeeded()
  }

  /**
   Opens a connection at `fileUrl`. If the existing database was written by a newer schema than this
   build understands, the file (plus WAL/shm sidecars) is deleted and a fresh empty connection is
   returned — losing local metrics is preferable to operating on an unknown shape.
   */
  private static func openConnection(fileUrl: URL) throws -> SQLiteDatabase {
    let database = try SQLiteDatabase(fileUrl: fileUrl)
    if try isFromFutureSchema(database: database) {
      logger.warn("""
        [AppMetrics] Metrics database at \(fileUrl.path) was created by a newer schema \
        (> v\(currentSchemaVersion)); recreating to keep this build functional.
        """)
      try resetDatabaseFile(at: fileUrl, currentConnection: database)
      return try SQLiteDatabase(fileUrl: fileUrl)
    }
    return database
  }

  /**
   Returns true when the connected database has a `schema_version` row whose value is greater than
   `currentSchemaVersion`. A missing or empty `schema_version` table means the file was created by
   this build (or an even older one without versioning) — neither counts as "from the future".
   */
  private static func isFromFutureSchema(database: SQLiteDatabase) throws -> Bool {
    let tableExists = try database.prepare("""
      SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version' LIMIT 1
      """)
    var hasTable = false
    try tableExists.forEachRow { _ in
      hasTable = true
    }
    if !hasTable {
      return false
    }
    guard let onDiskVersion = try readSchemaVersion(database: database) else {
      return false
    }
    return onDiskVersion > currentSchemaVersion
  }

  /**
   Closes `currentConnection` and removes the database file along with its WAL/shm sidecars so the
   caller can open a fresh, empty database in its place.
   */
  private static func resetDatabaseFile(at fileUrl: URL, currentConnection: SQLiteDatabase) throws {
    currentConnection.close()
    let fileManager = FileManager.default
    for url in [fileUrl, fileUrl.appendingPathExtension("wal"), fileUrl.appendingPathExtension("shm")] {
      if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
      }
    }
  }

  // MARK: - Sessions

  /**
   Inserts a session row, ignoring conflicts on the primary key.
   */
  @AppMetricsActor
  func insert(session: SessionRow) throws {
    let statement = try database.prepare("""
      INSERT OR IGNORE INTO sessions (
        id, type, startTimestamp, endTimestamp, isActive, environment,
        appName, appIdentifier, appVersion, appBuildNumber,
        appUpdateId, appUpdateRuntimeVersion, appUpdateRequestHeaders, appEasBuildId,
        deviceOs, deviceOsVersion, deviceModel, deviceName,
        expoSdkVersion, reactNativeVersion, clientVersion, languageTag
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6,
        ?7, ?8, ?9, ?10,
        ?11, ?12, ?13, ?14,
        ?15, ?16, ?17, ?18,
        ?19, ?20, ?21, ?22
      )
      """)
    try statement.bindAll([
      session.id, session.type, session.startTimestamp, session.endTimestamp, session.isActive, session.environment,
      session.appName, session.appIdentifier, session.appVersion, session.appBuildNumber,
      session.appUpdateId, session.appUpdateRuntimeVersion, session.appUpdateRequestHeaders, session.appEasBuildId,
      session.deviceOs, session.deviceOsVersion, session.deviceModel, session.deviceName,
      session.expoSdkVersion, session.reactNativeVersion, session.clientVersion, session.languageTag
    ])
    try statement.run()
  }

  @AppMetricsActor
  func getSession(id: String) throws -> SessionRow? {
    let statement = try database.prepare("SELECT \(sessionColumns) FROM sessions WHERE id = ?1")
    try statement.bindAll([id])
    var result: SessionRow?
    try statement.forEachRow { row in
      result = SessionRow(row: row)
    }
    return result
  }

  @AppMetricsActor
  func updateSessionActiveStatus(id: String, isActive: Bool, endTimestamp: String?) throws {
    let statement = try database.prepare("""
      UPDATE sessions SET isActive = ?1, endTimestamp = ?2 WHERE id = ?3
      """)
    try statement.bindAll([isActive, endTimestamp, id])
    try statement.run()
  }

  @AppMetricsActor
  func deactivateAllSessionsBefore(timestamp: String) throws {
    let statement = try database.prepare("""
      UPDATE sessions SET isActive = 0 WHERE isActive = 1 AND startTimestamp < ?1
      """)
    try statement.bindAll([timestamp])
    try statement.run()
  }

  @AppMetricsActor
  func updateEnvironment(id: String, environment: String) throws {
    let statement = try database.prepare("UPDATE sessions SET environment = ?1 WHERE id = ?2")
    try statement.bindAll([environment, id])
    try statement.run()
  }

  @AppMetricsActor
  func updateEnvironmentForActiveSessions(environment: String) throws {
    let statement = try database.prepare("UPDATE sessions SET environment = ?1 WHERE isActive = 1")
    try statement.bindAll([environment])
    try statement.run()
  }

  /**
   Deletes a session and any crash report keyed by its id. Metrics and logs cascade via FK; crash
   reports do not (they're allowed to outlive their session, since a crash can be attributed to a
   session we never managed to record).
   */
  @AppMetricsActor
  func deleteSession(id: String) throws {
    try database.transaction {
      try deleteCrashReportRow(sessionId: id)
      let statement = try database.prepare("DELETE FROM sessions WHERE id = ?1")
      try statement.bindAll([id])
      try statement.run()
    }
  }

  @AppMetricsActor
  func deleteAllSessions() throws {
    try database.transaction {
      try database.execute("DELETE FROM crash_reports")
      try database.execute("DELETE FROM sessions")
    }
  }

  @AppMetricsActor
  func getAllSessions() throws -> [SessionRow] {
    return try collectSessions(sql: "SELECT \(sessionColumns) FROM sessions ORDER BY startTimestamp DESC")
  }

  @AppMetricsActor
  func getAllActiveSessions() throws -> [SessionRow] {
    return try collectSessions(sql: """
      SELECT \(sessionColumns) FROM sessions WHERE isActive = 1 ORDER BY startTimestamp DESC
      """)
  }

  /**
   Deletes sessions whose start timestamp is older than `cutoff`, regardless of their `isActive`
   flag — that flag is unreliable for sessions belonging to a process that crashed before it could
   stamp an end timestamp. Metrics and logs cascade via FK; matching crash reports are removed in
   the same transaction.
   */
  @AppMetricsActor
  func cleanupSessions(olderThan cutoff: String) throws {
    try database.transaction {
      let dropCrashReports = try database.prepare("""
        DELETE FROM crash_reports
        WHERE sessionId IN (SELECT id FROM sessions WHERE startTimestamp < ?1)
        """)
      try dropCrashReports.bindAll([cutoff])
      try dropCrashReports.run()

      let dropSessions = try database.prepare("DELETE FROM sessions WHERE startTimestamp < ?1")
      try dropSessions.bindAll([cutoff])
      try dropSessions.run()
    }
  }

  // MARK: - Metrics

  /**
   Inserts a single metric and returns its rowid (the auto-incremented `id`).
   */
  @AppMetricsActor
  @discardableResult
  func insert(metric: MetricRow) throws -> Int64 {
    let statement = try database.prepare("""
      INSERT INTO metrics (sessionId, timestamp, category, name, value, routeName, updateId, params)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      """)
    try statement.bindAll([
      metric.sessionId, metric.timestamp, metric.category, metric.name,
      metric.value, metric.routeName, metric.updateId, metric.params
    ])
    try statement.run()
    return sqlite3_last_insert_rowid(database.rawHandle)
  }

  @AppMetricsActor
  func insertAll(metrics: [MetricRow]) throws {
    if metrics.isEmpty {
      return
    }
    try database.transaction {
      for metric in metrics {
        try insert(metric: metric)
      }
    }
  }

  @AppMetricsActor
  func getMetrics(sessionId: String) throws -> [MetricRow] {
    let statement = try database.prepare("""
      SELECT id, sessionId, timestamp, category, name, value, routeName, updateId, params
      FROM metrics WHERE sessionId = ?1 ORDER BY id ASC
      """)
    try statement.bindAll([sessionId])
    var rows: [MetricRow] = []
    try statement.forEachRow { row in
      rows.append(MetricRow(row: row))
    }
    return rows
  }

  // MARK: - Logs

  @AppMetricsActor
  @discardableResult
  func insert(log: LogRow) throws -> Int64 {
    let statement = try database.prepare("""
      INSERT INTO logs (sessionId, timestamp, severity, name, body, attributes, droppedAttributesCount)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      """)
    try statement.bindAll([
      log.sessionId, log.timestamp, log.severity, log.name,
      log.body, log.attributes, log.droppedAttributesCount
    ])
    try statement.run()
    return sqlite3_last_insert_rowid(database.rawHandle)
  }

  @AppMetricsActor
  func insertAll(logs: [LogRow]) throws {
    if logs.isEmpty {
      return
    }
    try database.transaction {
      for log in logs {
        try insert(log: log)
      }
    }
  }

  @AppMetricsActor
  func getLogs(sessionId: String) throws -> [LogRow] {
    let statement = try database.prepare("""
      SELECT id, sessionId, timestamp, severity, name, body, attributes, droppedAttributesCount
      FROM logs WHERE sessionId = ?1 ORDER BY id ASC
      """)
    try statement.bindAll([sessionId])
    var rows: [LogRow] = []
    try statement.forEachRow { row in
      rows.append(LogRow(row: row))
    }
    return rows
  }

  // MARK: - Crash reports

  /**
   Stores a crash report payload (caller serializes to JSON), replacing any existing entry for the
   given `sessionId`. The session row is *not* required to exist — crashes are sometimes attributed
   to a session that was never written (e.g. the app crashed before the session row reached disk).
   Such orphan crash reports are removed when the matching session id is later seen and deleted, or
   when the database is wiped.
   */
  @AppMetricsActor
  func setCrashReport(sessionId: String, payload: String) throws {
    let statement = try database.prepare("""
      INSERT OR REPLACE INTO crash_reports (sessionId, payload) VALUES (?1, ?2)
      """)
    try statement.bindAll([sessionId, payload])
    try statement.run()
  }

  @AppMetricsActor
  func getCrashReport(sessionId: String) throws -> String? {
    let statement = try database.prepare("SELECT payload FROM crash_reports WHERE sessionId = ?1")
    try statement.bindAll([sessionId])
    var result: String?
    try statement.forEachRow { row in
      result = row.string(at: 0)
    }
    return result
  }

  private func deleteCrashReportRow(sessionId: String) throws {
    let statement = try database.prepare("DELETE FROM crash_reports WHERE sessionId = ?1")
    try statement.bindAll([sessionId])
    try statement.run()
  }

  // MARK: - Schema

  /**
   Creates the schema (tables, indexes, version row) atomically. Wrapping the whole bootstrap in a
   transaction ensures a process crash mid-init can never leave the database with tables but no
   `schema_version` row — which would later be misread as "fresh" and skip migrations.
   */
  private func createSchemaIfNeeded() throws {
    try database.transaction {
      try createSchemaTables()
      if try Self.readSchemaVersion(database: database) == nil {
        let insertVersion = try database.prepare("INSERT INTO schema_version (version) VALUES (?1)")
        try insertVersion.bindAll([Self.currentSchemaVersion])
        try insertVersion.run()
      }
    }
  }

  private func createSchemaTables() throws {
    try database.execute("""
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        startTimestamp TEXT NOT NULL,
        endTimestamp TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        environment TEXT,
        appName TEXT,
        appIdentifier TEXT,
        appVersion TEXT,
        appBuildNumber TEXT,
        appUpdateId TEXT,
        appUpdateRuntimeVersion TEXT,
        appUpdateRequestHeaders TEXT,
        appEasBuildId TEXT,
        deviceOs TEXT,
        deviceOsVersion TEXT,
        deviceModel TEXT,
        deviceName TEXT,
        expoSdkVersion TEXT,
        reactNativeVersion TEXT,
        clientVersion TEXT,
        languageTag TEXT
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        timestamp TEXT NOT NULL,
        category TEXT,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        routeName TEXT,
        updateId TEXT,
        params TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_sessionId ON metrics(sessionId);

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL,
        name TEXT NOT NULL,
        body TEXT,
        attributes TEXT,
        droppedAttributesCount INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_logs_sessionId ON logs(sessionId);

      CREATE TABLE IF NOT EXISTS crash_reports (
        sessionId TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL
      );
      """)
  }

  private static func readSchemaVersion(database: SQLiteDatabase) throws -> Int? {
    let statement = try database.prepare("SELECT version FROM schema_version LIMIT 1")
    var version: Int?
    try statement.forEachRow { row in
      version = row.int(at: 0)
    }
    return version
  }

  @AppMetricsActor
  private func collectSessions(sql: String) throws -> [SessionRow] {
    let statement = try database.prepare(sql)
    var rows: [SessionRow] = []
    try statement.forEachRow { row in
      rows.append(SessionRow(row: row))
    }
    return rows
  }

  private let sessionColumns = """
    id, type, startTimestamp, endTimestamp, isActive, environment,
    appName, appIdentifier, appVersion, appBuildNumber,
    appUpdateId, appUpdateRuntimeVersion, appUpdateRequestHeaders, appEasBuildId,
    deviceOs, deviceOsVersion, deviceModel, deviceName,
    expoSdkVersion, reactNativeVersion, clientVersion, languageTag
    """
}
