// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 SQLite-backed storage for sessions, metrics, logs and crash reports.

 All read/write methods are isolated to `AppMetricsActor`. The connection is opened with
 `SQLITE_OPEN_NOMUTEX`, so SQLite assumes a single caller — actor isolation is what guarantees that.
 */
final class MetricsDatabase: Sendable {
  /**
   Schema version stamped into the database on first open. Bump this whenever the schema or its
   semantics change in a way that an older or newer build can't operate on; on a mismatch the
   database is wiped and recreated (see `openConnection`). We don't ship migrations yet — the data
   is local-only and short-lived, so wiping is preferable to maintaining migration code.
   */
  static let currentSchemaVersion = 3

  /**
   How long a session (and its metrics, logs, crash report) is retained before `init` prunes it.
   */
  static let sessionRetention: TimeInterval = 7 * 24 * 60 * 60 // 7 days

  let database: SQLiteDatabase

  let fileUrl: URL

  convenience init(fileName: String = "metrics") throws {
    let directoryUrl = try Self.defaultDirectoryUrl()
    try self.init(directoryUrl: directoryUrl, fileName: fileName)
  }

  /**
   Opens the database, falling back to a wipe-and-retry on the first failure. The retry exists for
   the rare case where the on-disk file is corrupted in a way the schema-mismatch path can't detect
   (e.g. truncated WAL after a power loss). Throws the second error if the retry also fails — the
   caller (`AppMetrics.database`) decides what to do with that.
   */
  static func openWipingOnFailure(fileName: String = "metrics") throws -> MetricsDatabase {
    let directoryUrl = try defaultDirectoryUrl()
    do {
      return try MetricsDatabase(directoryUrl: directoryUrl, fileName: fileName)
    } catch {
      logger.warn("[AppMetrics] Opening the metrics database failed (\(error.localizedDescription)); wiping the file and retrying.")
      try? removeDatabaseFile(at: directoryUrl.appendingPathComponent("\(fileName).db"))
      return try MetricsDatabase(directoryUrl: directoryUrl, fileName: fileName)
    }
  }

  private static func defaultDirectoryUrl() throws -> URL {
    return try FileManager.default
      .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      .appendingPathComponent("ExpoAppMetrics")
  }

  /**
   Designated initializer. Tests use this overload to point the database at a temporary directory
   instead of the user's documents directory.
   */
  init(directoryUrl: URL, fileName: String = "metrics") throws {
    self.fileUrl = directoryUrl.appendingPathComponent("\(fileName).db")
    self.database = try Self.openConnection(fileUrl: fileUrl)
    try createSchemaIfNeeded()
    scheduleDeactivateOrphanedSessions()
    schedulePruneExpiredSessions()
  }

  /**
   Marks any session that was still flagged active when the previous process exited (force-quit,
   OOM, crash before `stop()` could run) as inactive. The cutoff is captured before any new session
   row is inserted, so the just-launched main session won't be touched: tasks drain on
   `AppMetricsActor` in FIFO order, and `Session.init` enqueues its INSERT after this task.

   `weak self` for the same reason as `schedulePruneExpiredSessions` — a transient database can
   safely deinit before its scheduled task runs.
   */
  private func scheduleDeactivateOrphanedSessions() {
    let cutoff = Date.now.ISO8601Format()
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      do {
        try self.deactivateAllSessionsBefore(timestamp: cutoff)
      } catch {
        logger.warn("[AppMetrics] Failed to deactivate orphaned sessions: \(error.localizedDescription)")
      }
    }
  }

  /**
   Dispatches a one-shot prune of retention-expired sessions onto `AppMetricsActor`. Fire-and-forget
   from `init` so opening the database isn't slowed by the deletion; subsequent actor-isolated calls
   queue behind it and will see the pruned state.

   `weak self` so a database that's been discarded before the task runs (e.g. a transient instance
   in a test, or a replaced singleton) doesn't keep its connection alive past its visible lifetime
   — running prune against a connection whose file has been wiped trips a libsqlite3 use-after-free.
   */
  private func schedulePruneExpiredSessions() {
    AppMetricsActor.isolated { [weak self] in
      guard let self else {
        return
      }
      let cutoff = Date.now.addingTimeInterval(-Self.sessionRetention).ISO8601Format()
      do {
        try self.cleanupSessions(olderThan: cutoff)
      } catch {
        logger.warn("[AppMetrics] Failed to prune expired sessions: \(error.localizedDescription)")
      }
    }
  }

  /**
   Opens a connection at `fileUrl`. If the existing database was written by a different schema
   version than this build understands, the file (plus WAL/shm sidecars) is deleted and a fresh
   empty connection is returned — losing local metrics is preferable to operating on a schema we
   can't read or write.
   */
  private static func openConnection(fileUrl: URL) throws -> SQLiteDatabase {
    let mismatchedVersion: Int?
    do {
      let database = try SQLiteDatabase(fileUrl: fileUrl)
      mismatchedVersion = try mismatchedSchemaVersion(database: database)
      // `database` deinits here, releasing the underlying connection before the file is deleted.
    }
    if let mismatchedVersion {
      logger.warn("""
        [AppMetrics] Metrics database at \(fileUrl.path) is at schema v\(mismatchedVersion) but \
        this build expects v\(currentSchemaVersion); recreating to keep this build functional.
        """)
      try removeDatabaseFile(at: fileUrl)
    }
    return try SQLiteDatabase(fileUrl: fileUrl)
  }

  /**
   Returns the on-disk schema version when it differs from `currentSchemaVersion`, or `nil` when the
   file is fresh (no `schema_version` table) or already at the expected version. A fresh file is
   handled by `createSchemaIfNeeded`, which stamps the current version on first use.
   */
  private static func mismatchedSchemaVersion(database: borrowing SQLiteDatabase) throws -> Int? {
    let tableExists = try database.prepare("""
      SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version' LIMIT 1
      """)
    var hasTable = false
    try tableExists.forEachRow { _ in
      hasTable = true
    }
    if !hasTable {
      return nil
    }
    guard let onDiskVersion = try readSchemaVersion(database: database) else {
      return nil
    }
    return onDiskVersion == currentSchemaVersion ? nil : onDiskVersion
  }

  /**
   Removes the database file along with its WAL/shm sidecars. The caller must ensure no
   `SQLiteDatabase` instance for this file is still alive — when one falls out of scope its `deinit`
   runs `sqlite3_close_v2`, which is what releases the file handle.
   */
  private static func removeDatabaseFile(at fileUrl: URL) throws {
    let fileManager = FileManager.default
    let basePath = fileUrl.path
    for path in [basePath, basePath + "-wal", basePath + "-shm"] {
      if fileManager.fileExists(atPath: path) {
        try fileManager.removeItem(atPath: path)
      }
    }
  }

  /**
   Schema version recorded in the open database. `nil` only on a freshly created file before
   `createSchemaIfNeeded` has stamped a version row — which shouldn't be observable from outside
   `init`. Exposed primarily so tests can verify migration behavior without reaching into the
   underlying `SQLiteDatabase`.
   */
  @AppMetricsActor
  var schemaVersion: Int? {
    return try? Self.readSchemaVersion(database: database)
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
   Patches the OTA-related app columns on every active session. Called when the launched-update id
   becomes known after the session row has already been written (e.g. an update finishes downloading
   mid-session, or `getUpdatesMetricsInfo()` initially returned nil).
   */
  @AppMetricsActor
  func updateAppUpdatesInfoForActiveSessions(
    updateId: String?,
    runtimeVersion: String?,
    requestHeadersJSON: String?
  ) throws {
    let statement = try database.prepare("""
      UPDATE sessions
      SET appUpdateId = ?1, appUpdateRuntimeVersion = ?2, appUpdateRequestHeaders = ?3
      WHERE isActive = 1
      """)
    try statement.bindAll([updateId, runtimeVersion, requestHeadersJSON])
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

  /**
   Returns every session along with its metrics, logs, and crash report — newest first. Used by the
   JS-facing read APIs and (filtered down) by the dispatch path.
   */
  @AppMetricsActor
  func getAllSessionsWithChildren() throws -> [SessionWithChildren] {
    return try getAllSessions().map { session in
      let metrics = try getMetrics(sessionId: session.id)
      let logs = try getLogs(sessionId: session.id)
      let crash = try getCrashReport(sessionId: session.id)
      return SessionWithChildren(session: session, metrics: metrics, logs: logs, crashReportJSON: crash)
    }
  }

  /**
   Returns metric rows whose `id` is greater than `cursor`, in ascending id order. Dispatch uses
   this with the persisted "last dispatched metric id" cursor to fetch only new rows.
   */
  @AppMetricsActor
  func getMetrics(afterId cursor: Int64) throws -> [MetricRow] {
    let statement = try database.prepare("""
      SELECT id, sessionId, timestamp, category, name, value, routeName, updateId, params
      FROM metrics WHERE id > ?1 ORDER BY id ASC
      """)
    try statement.bindAll([cursor])
    var rows: [MetricRow] = []
    try statement.forEachRow { row in
      rows.append(MetricRow(row: row))
    }
    return rows
  }

  /**
   Returns log rows whose `id` is greater than `cursor`, in ascending id order.
   */
  @AppMetricsActor
  func getLogs(afterId cursor: Int64) throws -> [LogRow] {
    let statement = try database.prepare("""
      SELECT id, sessionId, timestamp, severity, name, body, attributes, droppedAttributesCount
      FROM logs WHERE id > ?1 ORDER BY id ASC
      """)
    try statement.bindAll([cursor])
    var rows: [LogRow] = []
    try statement.forEachRow { row in
      rows.append(LogRow(row: row))
    }
    return rows
  }

  /**
   Fetches a batch of sessions by id. Used to hydrate session metadata after looking up which
   sessions own a set of metric/log rows during dispatch.
   */
  @AppMetricsActor
  func getSessions(ids: [String]) throws -> [SessionRow] {
    if ids.isEmpty {
      return []
    }
    let placeholders = ids.indices.map { "?\($0 + 1)" }.joined(separator: ", ")
    let statement = try database.prepare("""
      SELECT \(sessionColumns) FROM sessions WHERE id IN (\(placeholders))
      """)
    try statement.bindAll(ids.map { $0 as SQLiteBindable })
    var rows: [SessionRow] = []
    try statement.forEachRow { row in
      rows.append(SessionRow(row: row))
    }
    return rows
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
    return database.lastInsertRowid()
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

  /**
   Returns the highest `id` currently in the metrics table, or `nil` if it's empty. Useful for
   detecting that an externally-held cursor (e.g. expo-observe's dispatch progress) has fallen out
   of sync with the table — usually because the database was wiped on a schema mismatch.
   */
  @AppMetricsActor
  func getMaxMetricId() throws -> Int64? {
    return try selectMaxId(table: "metrics")
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
    return database.lastInsertRowid()
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

  @AppMetricsActor
  func getMaxLogId() throws -> Int64? {
    return try selectMaxId(table: "logs")
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

  /**
   Creates the four data tables plus `schema_version`. Relationships:

   - `sessions` is the root. Every other table keys off `sessions.id` (a UUID string).
   - `metrics` and `logs` each have a `sessionId` FK with `ON DELETE CASCADE`. Their `id` is
     `INTEGER PRIMARY KEY AUTOINCREMENT` so `expo-observe` can dispatch with a monotonic cursor.
   - `crash_reports` is keyed by `sessionId`. There's no FK constraint; the relationship is
     informational, and deletes cascade manually (see `deleteSession`, `deleteAllSessions`,
     `cleanupSessions`).
   */
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

  private static func readSchemaVersion(database: borrowing SQLiteDatabase) throws -> Int? {
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

  @AppMetricsActor
  private func selectMaxId(table: String) throws -> Int64? {
    // The table name is a literal we control (`metrics` / `logs`), so interpolating into the SQL
    // text is safe — SQLite has no parameter placeholder for identifiers.
    let statement = try database.prepare("SELECT MAX(id) FROM \(table)")
    var maxId: Int64?
    try statement.forEachRow { row in
      maxId = row.int64(at: 0)
    }
    return maxId
  }

  private let sessionColumns = """
    id, type, startTimestamp, endTimestamp, isActive, environment,
    appName, appIdentifier, appVersion, appBuildNumber,
    appUpdateId, appUpdateRuntimeVersion, appUpdateRequestHeaders, appEasBuildId,
    deviceOs, deviceOsVersion, deviceModel, deviceName,
    expoSdkVersion, reactNativeVersion, clientVersion, languageTag
    """
}
