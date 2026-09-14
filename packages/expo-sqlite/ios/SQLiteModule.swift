// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

private typealias SQLiteColumnValues = [Any]
private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)
private let MEMORY_DB_NAME = ":memory:"

private let moduleQueue = DispatchQueue(label: "expo.module.sqlite.AsyncQueue", qos: .userInitiated, attributes: .concurrent)

// `@unchecked Sendable`: the `@JS(.concurrent)` members send the module off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` module. The mutable state is either guarded by `lockQueue` or
// only read off the JavaScript thread (`hasListeners`).
@ExpoModule("ExpoSQLite")
public final class SQLiteModule: Module, @unchecked Sendable {
  // Store unmanaged (SQLiteModule, Database) pairs for sqlite callbacks,
  // will release the pair when `closeDatabase` is called.
  private var contextPairs = [Unmanaged<AnyObject>]()

  private static let lockQueue = DispatchQueue(label: "expo.modules.sqlite.lockQueue")
  private var cachedDatabases = [NativeDatabase]()
  private(set) var hasListeners = false

  @JS
  var defaultDatabaseDirectory: String? {
    #if os(tvOS)
    return appContext?.config.cacheDirectory?.appendingPathComponent("SQLite").standardized.path
    #else
    return appContext?.config.documentDirectory?.appendingPathComponent("SQLite").standardized.path
    #endif
  }

  @JS
  var bundledExtensions: [String: [String: String?]] {
    var bundledExtensions: [String: [String: String?]] = [:]
    #if WITH_SQLITE_VEC
    bundledExtensions["sqlite-vec"] = [
      "libPath": Bundle(identifier: "sqlite-vec")?.path(forResource: "vec", ofType: ""),
      "entryPoint": "sqlite3_vec_init"
    ]
    #endif
    return bundledExtensions
  }

  @Event("onDatabaseChange")
  var onDatabaseChange: (DatabaseChangeEvent) -> Void

  public override func didStartListening(event: String) {
    hasListeners = true
  }

  public override func didStopListening(event: String) {
    hasListeners = false
  }

  public override func willDestroy() {
    removeAllCachedDatabases().forEach {
      do {
        try closeDatabase($0)
      } catch {}
    }
  }

  // MARK: - Module functions

  @JS(.concurrent)
  func deleteDatabaseAsync(databasePath: String) async throws {
    try deleteDatabase(databasePath: databasePath)
  }

  @JS
  func deleteDatabaseSync(databasePath: String) throws {
    try deleteDatabase(databasePath: databasePath)
  }

  @JS(.concurrent)
  func importAssetDatabaseAsync(databasePath: String, assetDatabasePath: String, forceOverwrite: Bool) async throws {
    try importAssetDatabase(databasePath: databasePath, assetDatabasePath: assetDatabasePath, forceOverwrite: forceOverwrite)
  }

  @JS(.concurrent)
  func ensureDatabasePathExistsAsync(databasePath: String) async throws {
    _ = try ensureDatabasePathExists(path: databasePath)
  }

  @JS
  func ensureDatabasePathExistsSync(databasePath: String) throws {
    _ = try ensureDatabasePathExists(path: databasePath)
  }

  @JS(.concurrent)
  func backupDatabaseAsync(
    destDatabase: NativeDatabase,
    destDatabaseName: String,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: String
  ) async throws {
    try backupDatabase(
      destDatabase: destDatabase,
      destDatabaseName: destDatabaseName,
      sourceDatabase: sourceDatabase,
      sourceDatabaseName: sourceDatabaseName
    )
  }

  @JS
  func backupDatabaseSync(
    destDatabase: NativeDatabase,
    destDatabaseName: String,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: String
  ) throws {
    try backupDatabase(
      destDatabase: destDatabase,
      destDatabaseName: destDatabaseName,
      sourceDatabase: sourceDatabase,
      sourceDatabaseName: sourceDatabaseName
    )
  }

  public func definition() -> ModuleDefinition {
    // MARK: - NativeDatabase

    // swiftlint:disable:next closure_body_length
    Class(NativeDatabase.self) {
      Constructor { (databasePath: String, options: OpenDatabaseOptions, serializedData: Data?) -> NativeDatabase in
        var db: OpaquePointer?

        if let serializedData = serializedData {
          db = try deserializeDatabase(serializedData)
        } else {
          // Try to find opened database for fast refresh
          if let cachedDb = findCachedDatabase(where: { $0.databasePath == databasePath && $0.openOptions == options && !options.useNewConnection }) {
            cachedDb.addRef()
            return cachedDb
          }

          let path = try ensureDatabasePathExists(path: databasePath)
          if exsqlite3_open(path.toFilePath(), &db) != SQLITE_OK {
            throw DatabaseException()
          }
        }

        let database = NativeDatabase(db, databasePath: databasePath, openOptions: options)
        addCachedDatabase(database)
        return database
      }

      AsyncFunction("initAsync") { (database: NativeDatabase) in
        try initDb(database: database)
      }.runOnQueue(moduleQueue)
      Function("initSync") { (database: NativeDatabase) in
        try initDb(database: database)
      }

      AsyncFunction("closeAsync") { (database: NativeDatabase) in
        try maybeThrowForClosedDatabase(database)
        if let db = removeCachedDatabase(of: database) {
          try closeDatabase(db)
        }
      }.runOnQueue(moduleQueue)
      // Interrupt must reach SQLite immediately, without waiting for the running query's queue.
      Function("interruptSync") { (database: NativeDatabase) in
        // Do not block the JS thread or touch a connection being closed on another thread.
        guard database.closeLock.try() else {
          throw AccessClosedResourceException()
        }
        defer { database.closeLock.unlock() }
        try maybeThrowForClosedDatabase(database)
        exsqlite3_interrupt(database.pointer)
      }
      Function("closeSync") { (database: NativeDatabase) in
        try maybeThrowForClosedDatabase(database)
        if let db = removeCachedDatabase(of: database) {
          try closeDatabase(db)
        }
      }
    }

    // MARK: - NativeStatement

    Class(NativeStatement.self) {
      // swiftlint:disable line_length

      AsyncFunction("runAsync") { (statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: ArrayBuffer], shouldPassAsArray: Bool) -> [String: Any] in
        return try run(statement: statement, database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
      }.runOnQueue(moduleQueue)
      Function("runSync") { (statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: ArrayBuffer], shouldPassAsArray: Bool) -> [String: Any] in
        return try run(statement: statement, database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
      }

      // swiftlint:enable line_length

      AsyncFunction("stepAsync") { (statement: NativeStatement, database: NativeDatabase) -> SQLiteColumnValues? in
        return try step(statement: statement, database: database)
      }.runOnQueue(moduleQueue)
      Function("stepSync") { (statement: NativeStatement, database: NativeDatabase) -> SQLiteColumnValues? in
        return try step(statement: statement, database: database)
      }

      AsyncFunction("getAllAsync") { (statement: NativeStatement, database: NativeDatabase) -> [SQLiteColumnValues] in
        return try getAll(statement: statement, database: database)
      }.runOnQueue(moduleQueue)
      Function("getAllSync") { (statement: NativeStatement, database: NativeDatabase) -> [SQLiteColumnValues] in
        return try getAll(statement: statement, database: database)
      }
    }

    // MARK: - NativeSession

    NativeSession._synthesizedClassDefinition()
  }

  private func ensureDatabasePathExists(path: String) throws -> URL {
    if path == MEMORY_DB_NAME {
      guard let url = URL(string: path) else {
        throw DatabaseException()
      }
      return url
    }
    guard let fileSystem = appContext?.fileSystem else {
      throw Exceptions.FileSystemModuleNotFound()
    }

    guard let pathUrl = URL(string: path) else {
      throw DatabaseInvalidPathException(path)
    }
    fileSystem.ensureDirExists(withPath: pathUrl.deletingLastPathComponent().toFilePath())

    return pathUrl
  }

  private func deserializeDatabase(_ serializedData: Data) throws -> OpaquePointer? {
    var db: OpaquePointer?
    if exsqlite3_open(MEMORY_DB_NAME, &db) != SQLITE_OK {
      throw DatabaseException()
    }
    let size = sqlite3_int64(serializedData.count)
    guard let buffer = exsqlite3_malloc64(sqlite3_uint64(size)) else {
      throw SQLiteErrorException("Unable to allocate memory for \(size) bytes")
    }
    try serializedData.withUnsafeBytes {
      guard let baseAddress = $0.baseAddress else {
        exsqlite3_free(buffer)
        throw SQLiteErrorException("Unable to get allocated memory base address")
      }
      memcpy(buffer, baseAddress, Int(size))
    }
    let flags = UInt32(SQLITE_DESERIALIZE_RESIZEABLE | SQLITE_DESERIALIZE_FREEONCLOSE)
    let ret = exsqlite3_deserialize(db, "main", buffer.assumingMemoryBound(to: UInt8.self), size, size, flags)
    if ret != SQLITE_OK {
      throw SQLiteErrorException(sqliteErrorMessage(for: db))
    }
    return db
  }

  private func initDb(database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    if database.openOptions.enableChangeListener {
      addUpdateHook(database)
    }
  }

  // swiftlint:disable line_length

  private func run(statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: any AnyArrayBuffer], shouldPassAsArray: Bool) throws -> [String: Any] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)

    // The statement with parameter bindings is stateful,
    // we have to guard with a critical section for thread safety.
    return try statement.lock.withLock { _ -> [String: Any] in
      exsqlite3_reset(statement.pointer)
      exsqlite3_clear_bindings(statement.pointer)
      for (key, param) in bindParams {
        let index = try getBindParamIndex(statement: statement, key: key, shouldPassAsArray: shouldPassAsArray)
        if index > 0 {
          try bindStatementParam(statement: statement, with: param, at: index)
        }
      }
      for (key, param) in bindBlobParams {
        let index = try getBindParamIndex(statement: statement, key: key, shouldPassAsArray: shouldPassAsArray)
        if index > 0 {
          try bindStatementParam(statement: statement, with: param, at: index)
        }
      }

      let ret = exsqlite3_step(statement.pointer)
      if ret != SQLITE_ROW && ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(database))
      }
      let firstRowValues: SQLiteColumnValues = (ret == SQLITE_ROW) ? try getColumnValues(statement: statement) : []
      return [
        "lastInsertRowId": Int(exsqlite3_last_insert_rowid(database.pointer)),
        "changes": Int(exsqlite3_changes(database.pointer)),
        "firstRowValues": firstRowValues
      ]
    }
  }

  // swiftlint:enable line_length

  private func step(statement: NativeStatement, database: NativeDatabase) throws -> SQLiteColumnValues? {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)

    // Guard the stateful statement, see `run` above.
    return try statement.lock.withLock { _ -> SQLiteColumnValues? in
      let ret = exsqlite3_step(statement.pointer)
      if ret == SQLITE_ROW {
        return try getColumnValues(statement: statement)
      }
      if ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(database))
      }
      return nil
    }
  }

  private func getAll(statement: NativeStatement, database: NativeDatabase) throws -> [SQLiteColumnValues] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)

    // Guard the stateful statement, see `run` above.
    return try statement.lock.withLock { _ -> [SQLiteColumnValues] in
      var columnValuesList: [SQLiteColumnValues] = []
      while true {
        let ret = exsqlite3_step(statement.pointer)
        if ret == SQLITE_ROW {
          columnValuesList.append(try getColumnValues(statement: statement))
          continue
        }
        if ret == SQLITE_DONE {
          break
        }
        throw SQLiteErrorException(convertSqlLiteErrorToString(database))
      }
      return columnValuesList
    }
  }

  private func convertSqlLiteErrorToString(_ db: NativeDatabase) -> String {
    return db.lastErrorMessage()
  }

  private func closeDatabase(_ db: NativeDatabase) throws {
    db.closeLock.lock()
    defer { db.closeLock.unlock() }
    try maybeThrowForClosedDatabase(db)
    try maybeFinalizeAllStatements(db)

    let ret = exsqlite3_close(db.pointer)
    db.isClosed = true

    Self.lockQueue.sync {
      if let index = contextPairs.firstIndex(where: {
        guard let pair = $0.takeUnretainedValue() as? (SQLiteModule, NativeDatabase) else {
          return false
        }
        if pair.1.sharedObjectId != db.sharedObjectId {
          return false
        }
        $0.release()
        return true
      }) {
        contextPairs.remove(at: index)
      }
    }

    if ret != SQLITE_OK {
      throw SQLiteErrorException(convertSqlLiteErrorToString(db))
    }
  }

  private func deleteDatabase(databasePath: String) throws {
    if findCachedDatabase(where: { $0.databasePath == databasePath }) != nil {
      throw DeleteDatabaseException(databasePath)
    }

    if databasePath == MEMORY_DB_NAME {
      return
    }
    let path = try ensureDatabasePathExists(path: databasePath).toFilePath()
    try DatabaseFileUtils.deleteDatabaseFiles(atPath: path)
  }

  private func importAssetDatabase(databasePath: String, assetDatabasePath: String, forceOverwrite: Bool) throws {
    let path = try ensureDatabasePathExists(path: databasePath)
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: path.toFilePath()) && !forceOverwrite {
      return
    }
    guard let assetPath = Utilities.urlFrom(string: assetDatabasePath)?.path,
      fileManager.fileExists(atPath: assetPath) else {
      throw DatabaseNotFoundException(assetDatabasePath)
    }
    try? fileManager.removeItem(atPath: path.absoluteString)
    try fileManager.copyItem(atPath: assetPath, toPath: path.toFilePath())
  }

  private func backupDatabase(destDatabase: NativeDatabase, destDatabaseName: String, sourceDatabase: NativeDatabase, sourceDatabaseName: String) throws {
    try maybeThrowForClosedDatabase(destDatabase)
    try maybeThrowForClosedDatabase(sourceDatabase)
    guard let backup = exsqlite3_backup_init(destDatabase.pointer, destDatabaseName, sourceDatabase.pointer, sourceDatabaseName) else {
      throw SQLiteErrorException(convertSqlLiteErrorToString(destDatabase))
    }
    exsqlite3_backup_step(backup, -1)
    if exsqlite3_backup_finish(backup) != SQLITE_OK {
      throw SQLiteErrorException(convertSqlLiteErrorToString(destDatabase))
    }
  }

  private func addUpdateHook(_ database: NativeDatabase) {
    let contextPair = Unmanaged.passRetained(((self, database) as AnyObject))
    Self.lockQueue.sync {
      contextPairs.append(contextPair)
    }
    // swiftlint:disable:next multiline_arguments
    exsqlite3_update_hook(database.pointer, { obj, action, databaseName, tableName, rowId in
      guard let obj,
        let tableName,
        let pair = Unmanaged<AnyObject>.fromOpaque(obj).takeUnretainedValue() as? (SQLiteModule, NativeDatabase) else {
        return
      }
      let selfInstance = pair.0
      let database = pair.1
      let databaseFilePath = exsqlite3_db_filename(database.pointer, databaseName)
      if selfInstance.hasListeners, let databaseName, let databaseFilePath {
        selfInstance.onDatabaseChange(DatabaseChangeEvent(
          databaseName: String(cString: UnsafePointer(databaseName)),
          databaseFilePath: String(cString: UnsafePointer(databaseFilePath)),
          tableName: String(cString: UnsafePointer(tableName)),
          rowId: Int(rowId),
          typeId: SQLAction.fromCode(value: action)
        ))
      }
    },
    contextPair.toOpaque())
  }

  private func getColumnValues(statement: NativeStatement) throws -> SQLiteColumnValues {
    try maybeThrowForFinalizedStatement(statement)
    let columnCount = Int(exsqlite3_column_count(statement.pointer))
    var columnValues: SQLiteColumnValues = Array(repeating: 0, count: columnCount)
    for i in 0..<columnCount {
      columnValues[i] = try getColumnValue(statement: statement, at: Int32(i))
    }
    return columnValues
  }

  @inline(__always)
  private func getColumnValue(statement: NativeStatement, at index: Int32) throws -> Any {
    let instance = statement.pointer
    let type = exsqlite3_column_type(instance, index)

    switch type {
    case SQLITE_INTEGER:
      return exsqlite3_column_int64(instance, index)
    case SQLITE_FLOAT:
      return exsqlite3_column_double(instance, index)
    case SQLITE_TEXT:
      guard let text = exsqlite3_column_text(instance, index) else {
        throw InvalidConvertibleException("Null text")
      }
      return String(cString: text)
    case SQLITE_BLOB:
      guard let blob = exsqlite3_column_blob(instance, index) else {
        return ArrayBuffer(size: 0)
      }
      let size = exsqlite3_column_bytes(instance, index)
      return ArrayBuffer.copy(of: blob, count: Int(size))
    case SQLITE_NULL:
      return NSNull()
    default:
      throw InvalidConvertibleException("Unsupported column type: \(type)")
    }
  }

  private func bindStatementParam(statement: NativeStatement, with param: Any, at index: Int32) throws {
    let instance = statement.pointer
    switch param {
    case Optional<Any>.none:
      exsqlite3_bind_null(instance, index)
    case _ as NSNull:
      exsqlite3_bind_null(instance, index)
    case let param as Int64:
      exsqlite3_bind_int64(instance, index, Int64(param))
    case let param as Double:
      exsqlite3_bind_double(instance, index, param)
    case let param as String:
      exsqlite3_bind_text(instance, index, param, -1, SQLITE_TRANSIENT)
    case let param as any AnyArrayBuffer:
      _ = param.withUnsafeBytes {
        exsqlite3_bind_blob(instance, index, $0.baseAddress, Int32(param.byteLength), SQLITE_TRANSIENT)
      }
    case let param as Bool:
      exsqlite3_bind_int(instance, index, param ? 1 : 0)
    default:
      throw InvalidConvertibleException("Unsupported parameter type: \(type(of: param))")
    }
  }

  private func maybeThrowForClosedDatabase(_ database: NativeDatabase) throws {
    try database.ensureOpen()
  }

  private func maybeThrowForFinalizedStatement(_ statement: NativeStatement) throws {
    try statement.ensureNotFinalized()
  }

  @inline(__always)
  private func getBindParamIndex(statement: NativeStatement, key: String, shouldPassAsArray: Bool) throws -> Int32 {
    let index: Int32
    if shouldPassAsArray {
      guard let intKey = Int32(key) else {
        throw InvalidBindParameterException()
      }
      index = intKey + 1
    } else {
      index = exsqlite3_bind_parameter_index(statement.pointer, key.cString(using: .utf8))
    }
    return index
  }

  // MARK: - cachedDatabases managements

  private func addCachedDatabase(_ database: NativeDatabase) {
    Self.lockQueue.sync {
      cachedDatabases.append(database)
    }
  }

  @discardableResult
  private func removeCachedDatabase(of database: NativeDatabase) -> NativeDatabase? {
    return Self.lockQueue.sync {
      if let index = cachedDatabases.firstIndex(of: database) {
        let db = cachedDatabases[index]
        if db.release() == 0 {
          cachedDatabases.remove(at: index)
          return db
        }
      }
      return nil
    }
  }

  private func findCachedDatabase(where predicate: (NativeDatabase) -> Bool) -> NativeDatabase? {
    return Self.lockQueue.sync {
      if let database = cachedDatabases.first(where: predicate) {
        return database
      }
      return nil
    }
  }

  private func removeAllCachedDatabases() -> [NativeDatabase] {
    return Self.lockQueue.sync {
      let databases = cachedDatabases
      cachedDatabases.removeAll()
      return databases
    }
  }

  // MARK: - statements managements
  private func maybeFinalizeAllStatements(_ database: NativeDatabase) throws {
    guard database.openOptions.finalizeUnusedStatementsBeforeClosing else {
      return
    }
    var stmt: OpaquePointer? = exsqlite3_next_stmt(database.pointer, nil)
    if stmt == nil {
      return
    }
    while let currentStmt = stmt {
      let nextStmt = exsqlite3_next_stmt(database.pointer, currentStmt)
      let ret = exsqlite3_finalize(currentStmt)
      if ret != SQLITE_OK {
        ExpoModulesCore.log.warn("exsqlite3_finalize failed: \(convertSqlLiteErrorToString(database))")
      }
      stmt = nextStmt
    }
  }
}
