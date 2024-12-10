// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

private typealias SQLiteColumnNames = [String]
private typealias SQLiteColumnValues = [Any]
private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)
private let MEMORY_DB_NAME = ":memory:"

public final class SQLiteModule: Module {
  // Store unmanaged (SQLiteModule, Database) pairs for sqlite callbacks,
  // will release the pair when `closeDatabase` is called.
  private var contextPairs = [Unmanaged<AnyObject>]()

  private static let lockQueue = DispatchQueue(label: "expo.modules.sqlite.lockQueue")
  private var cachedDatabases = [NativeDatabase]()
  private var cachedStatements = [NativeDatabase: [NativeStatement]]()
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("ExpoSQLite")

    Constants {
      let defaultDatabaseDirectory =
        appContext?.config.documentDirectory?.appendingPathComponent("SQLite").standardized.path
      return [
        "defaultDatabaseDirectory": defaultDatabaseDirectory
      ]
    }

    Events("onDatabaseChange")

    OnStartObserving {
      hasListeners = true
    }

    OnStopObserving {
      hasListeners = false
    }

    OnDestroy {
      removeAllCachedDatabases().forEach {
        do {
          try closeDatabase($0)
        } catch {}
      }
    }

    AsyncFunction("deleteDatabaseAsync") { (databasePath: String) in
      try deleteDatabase(databasePath: databasePath)
    }
    Function("deleteDatabaseSync") { (databasePath: String) in
      try deleteDatabase(databasePath: databasePath)
    }

    AsyncFunction("importAssetDatabaseAsync") { (databasePath: String, assetDatabasePath: String, forceOverwrite: Bool) in
      let path = try ensureDatabasePathExists(path: databasePath)
      let fileManager = FileManager.default
      if fileManager.fileExists(atPath: path.standardizedFileURL.path) && !forceOverwrite {
        return
      }
      guard let assetPath = Utilities.urlFrom(string: assetDatabasePath)?.path,
        fileManager.fileExists(atPath: assetPath) else {
        throw DatabaseNotFoundException(assetDatabasePath)
      }
      try? fileManager.removeItem(atPath: path.absoluteString)
      try fileManager.copyItem(atPath: assetPath, toPath: path.standardizedFileURL.path)
    }

    AsyncFunction("ensureDatabasePathExistsAsync") { (databasePath: String) in
      try ensureDatabasePathExists(path: databasePath)
    }
    Function("ensureDatabasePathExistsSync") { (databasePath: String) in
      try ensureDatabasePathExists(path: databasePath)
    }

    // swiftlint:disable:next closure_body_length
    Class(NativeDatabase.self) {
      Constructor { (databasePath: String, options: OpenDatabaseOptions, serializedData: Data?) -> NativeDatabase in
        var db: OpaquePointer?

        if let serializedData = serializedData {
          db = try deserializeDatabase(serializedData)
        } else {
          // Try to find opened database for fast refresh
          if let cachedDb = findCachedDatabase(where: { $0.databasePath == databasePath && $0.openOptions == options && !options.useNewConnection }) {
            return cachedDb
          }

          let path = try ensureDatabasePathExists(path: databasePath)
          if exsqlite3_open(path.standardizedFileURL.path, &db) != SQLITE_OK {
            throw DatabaseException()
          }
        }

        let database = NativeDatabase(db, databasePath: databasePath, openOptions: options)
        addCachedDatabase(database)
        return database
      }

      AsyncFunction("initAsync") { (database: NativeDatabase) in
        try initDb(database: database)
      }
      Function("initSync") { (database: NativeDatabase) in
        try initDb(database: database)
      }

      AsyncFunction("isInTransactionAsync") { (database: NativeDatabase) -> Bool in
        try maybeThrowForClosedDatabase(database)
        return exsqlite3_get_autocommit(database.pointer) == 0
      }
      Function("isInTransactionSync") { (database: NativeDatabase) -> Bool in
        try maybeThrowForClosedDatabase(database)
        return exsqlite3_get_autocommit(database.pointer) == 0
      }

      AsyncFunction("closeAsync") { (database: NativeDatabase) in
        removeCachedDatabase(of: database)
        try closeDatabase(database)
      }
      Function("closeSync") { (database: NativeDatabase) in
        removeCachedDatabase(of: database)
        try closeDatabase(database)
      }

      AsyncFunction("execAsync") { (database: NativeDatabase, source: String) in
        try exec(database: database, source: source)
      }
      Function("execSync") { (database: NativeDatabase, source: String) in
        try exec(database: database, source: source)
      }

      AsyncFunction("serializeAsync") { (database: NativeDatabase, databaseName: String) in
        try serialize(database: database, databaseName: databaseName)
      }
      Function("serializeSync") { (database: NativeDatabase, databaseName: String) in
        try serialize(database: database, databaseName: databaseName)
      }

      AsyncFunction("prepareAsync") { (database: NativeDatabase, statement: NativeStatement, source: String) in
        try prepareStatement(database: database, statement: statement, source: source)
      }
      Function("prepareSync") { (database: NativeDatabase, statement: NativeStatement, source: String) in
        try prepareStatement(database: database, statement: statement, source: source)
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(NativeStatement.self) {
      Constructor {
        return NativeStatement()
      }

      // swiftlint:disable line_length

      AsyncFunction("runAsync") { (statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: Data], shouldPassAsArray: Bool) -> [String: Any] in
        return try run(statement: statement, database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
      }
      Function("runSync") { (statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: Data], shouldPassAsArray: Bool) -> [String: Any] in
        return try run(statement: statement, database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
      }

      // swiftlint:enable line_length

      AsyncFunction("stepAsync") { (statement: NativeStatement, database: NativeDatabase) -> SQLiteColumnValues? in
        return try step(statement: statement, database: database)
      }
      Function("stepSync") { (statement: NativeStatement, database: NativeDatabase) -> SQLiteColumnValues? in
        return try step(statement: statement, database: database)
      }

      AsyncFunction("getAllAsync") { (statement: NativeStatement, database: NativeDatabase) -> [SQLiteColumnValues] in
        return try getAll(statement: statement, database: database)
      }
      Function("getAllSync") { (statement: NativeStatement, database: NativeDatabase) -> [SQLiteColumnValues] in
        return try getAll(statement: statement, database: database)
      }

      AsyncFunction("resetAsync") { (statement: NativeStatement, database: NativeDatabase) in
        try reset(statement: statement, database: database)
      }
      Function("resetSync") { (statement: NativeStatement, database: NativeDatabase) in
        try reset(statement: statement, database: database)
      }

      AsyncFunction("getColumnNamesAsync") { (statement: NativeStatement) -> SQLiteColumnNames in
        return try getColumnNames(statement: statement)
      }
      Function("getColumnNamesSync") { (statement: NativeStatement) -> SQLiteColumnNames in
        return try getColumnNames(statement: statement)
      }

      AsyncFunction("finalizeAsync") { (statement: NativeStatement, database: NativeDatabase) in
        try finalize(statement: statement, database: database)
      }
      Function("finalizeSync") { (statement: NativeStatement, database: NativeDatabase) in
        try finalize(statement: statement, database: database)
      }
    }
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
    fileSystem.ensureDirExists(withPath: pathUrl.deletingLastPathComponent().standardizedFileURL.path)

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
      throw SQLiteErrorException(convertSqlLiteErrorToString(db))
    }
    return db
  }

  private func initDb(database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    if database.openOptions.enableCRSQLite {
      crsqlite_init_from_swift(database.pointer)
    }
    if database.openOptions.enableChangeListener {
      addUpdateHook(database)
    }
  }

  private func exec(database: NativeDatabase, source: String) throws {
    try maybeThrowForClosedDatabase(database)
    var error: UnsafeMutablePointer<CChar>?
    let ret = exsqlite3_exec(database.pointer, source, nil, nil, &error)
    if ret != SQLITE_OK, let error = error {
      let errorString = String(cString: error)
      exsqlite3_free(error)
      throw SQLiteErrorException(errorString)
    }
  }

  private func serialize(database: NativeDatabase, databaseName: String) throws -> Data {
    try maybeThrowForClosedDatabase(database)

    var size: sqlite3_int64 = 0
    guard let bytes = exsqlite3_serialize(database.pointer, databaseName, &size, 0) else {
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }

    let serializedData = Data(bytes: bytes, count: Int(size))
    exsqlite3_free(bytes)
    return serializedData
  }

  private func prepareStatement(database: NativeDatabase, statement: NativeStatement, source: String) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    let sourceString = source.cString(using: .utf8)
    if exsqlite3_prepare_v2(database.pointer, sourceString, -1, &statement.pointer, nil) != SQLITE_OK {
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }
    maybeAddCachedStatement(database: database, statement: statement)
  }

  // swiftlint:disable line_length

  private func run(statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: Data], shouldPassAsArray: Bool) throws -> [String: Any] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)

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

  // swiftlint:enable line_length

  private func step(statement: NativeStatement, database: NativeDatabase) throws -> SQLiteColumnValues? {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    let ret = exsqlite3_step(statement.pointer)
    if ret == SQLITE_ROW {
      return try getColumnValues(statement: statement)
    }
    if ret != SQLITE_DONE {
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }
    return nil
  }

  private func getAll(statement: NativeStatement, database: NativeDatabase) throws -> [SQLiteColumnValues] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    var columnValuesList: [SQLiteColumnValues] = []
    while true {
      let ret = exsqlite3_step(statement.pointer)
      if ret == SQLITE_ROW {
        columnValuesList.append(try getColumnValues(statement: statement))
        continue
      } else if ret == SQLITE_DONE {
        break
      }
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }
    return columnValuesList
  }

  private func reset(statement: NativeStatement, database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    if exsqlite3_reset(statement.pointer) != SQLITE_OK {
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }
  }

  private func finalize(statement: NativeStatement, database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    maybeRemoveCachedStatement(database: database, statement: statement)
    if exsqlite3_finalize(statement.pointer) != SQLITE_OK {
      throw SQLiteErrorException(convertSqlLiteErrorToString(database))
    }
    statement.isFinalized = true
  }

  private func convertSqlLiteErrorToString(_ db: OpaquePointer?) -> String {
    let code = exsqlite3_errcode(db)
    let message = String(cString: exsqlite3_errmsg(db), encoding: .utf8) ?? ""
    return "Error code \(code): \(message)"
  }

  private func convertSqlLiteErrorToString(_ db: NativeDatabase) -> String {
    return convertSqlLiteErrorToString(db.pointer)
  }

  private func closeDatabase(_ db: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(db)
    for removedStatement in maybeRemoveAllCachedStatements(database: db) {
      exsqlite3_finalize(removedStatement.pointer)
    }

    if db.openOptions.enableCRSQLite {
      exsqlite3_exec(db.pointer, "SELECT crsql_finalize()", nil, nil, nil)
    }
    let ret = exsqlite3_close(db.pointer)
    db.isClosed = true

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
    let path = try ensureDatabasePathExists(path: databasePath).standardizedFileURL.path

    if !FileManager.default.fileExists(atPath: path) {
      throw DatabaseNotFoundException(path)
    }

    do {
      try FileManager.default.removeItem(atPath: path)
    } catch {
      throw DeleteDatabaseFileException(path)
    }
  }

  private func addUpdateHook(_ database: NativeDatabase) {
    let contextPair = Unmanaged.passRetained(((self, database) as AnyObject))
    contextPairs.append(contextPair)
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
        selfInstance.sendEvent("onDatabaseChange", [
          "databaseName": String(cString: UnsafePointer(databaseName)),
          "databaseFilePath": String(cString: UnsafePointer(databaseFilePath)),
          "tableName": String(cString: UnsafePointer(tableName)),
          "rowId": rowId,
          "typeId": SQLAction.fromCode(value: action)
        ])
      }
    },
    contextPair.toOpaque())
  }

  private func getColumnNames(statement: NativeStatement) throws -> SQLiteColumnNames {
    try maybeThrowForFinalizedStatement(statement)
    let columnCount = Int(exsqlite3_column_count(statement.pointer))
    var columnNames: SQLiteColumnNames = Array(repeating: "", count: columnCount)
    for i in 0..<columnCount {
      columnNames[i] = String(cString: exsqlite3_column_name(statement.pointer, Int32(i)))
    }
    return columnNames
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
        return Data()
      }
      let size = exsqlite3_column_bytes(instance, index)
      return Data(bytes: blob, count: Int(size))
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
    case let param as Data:
      _ = param.withUnsafeBytes {
        exsqlite3_bind_blob(instance, index, $0.baseAddress, Int32(param.count), SQLITE_TRANSIENT)
      }
    case let param as Bool:
      exsqlite3_bind_int(instance, index, param ? 1 : 0)
    default:
      throw InvalidConvertibleException("Unsupported parameter type: \(type(of: param))")
    }
  }

  private func maybeThrowForClosedDatabase(_ database: NativeDatabase) throws {
    if database.isClosed {
      throw AccessClosedResourceException()
    }
  }

  private func maybeThrowForFinalizedStatement(_ statement: NativeStatement) throws {
    if statement.isFinalized {
      throw AccessClosedResourceException()
    }
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
        let database = cachedDatabases[index]
        cachedDatabases.remove(at: index)
        return database
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

  // MARK: - cachedStatements managements

  private func maybeAddCachedStatement(database: NativeDatabase, statement: NativeStatement) {
    if !database.openOptions.finalizeUnusedStatementsBeforeClosing {
      return
    }
    Self.lockQueue.sync {
      if cachedStatements[database] != nil {
        cachedStatements[database]?.append(statement)
      } else {
        cachedStatements[database] = [statement]
      }
    }
  }

  private func maybeRemoveCachedStatement(database: NativeDatabase, statement: NativeStatement) {
    if !database.openOptions.finalizeUnusedStatementsBeforeClosing {
      return
    }
    Self.lockQueue.sync {
      if let index = cachedStatements[database]?.firstIndex(of: statement) {
        cachedStatements[database]?.remove(at: index)
      }
    }
  }

  private func maybeRemoveAllCachedStatements(database: NativeDatabase) -> [NativeStatement] {
    if !database.openOptions.finalizeUnusedStatementsBeforeClosing {
      return []
    }
    return Self.lockQueue.sync {
      if let statements = cachedStatements[database] {
        cachedStatements.removeValue(forKey: database)
        return statements
      }
      return []
    }
  }
}
