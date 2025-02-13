// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import libsql

private typealias SQLiteColumnNames = [String]
private typealias SQLiteColumnValues = [Any]
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
      // swiftlint:disable:next closure_body_length
      Constructor { (databasePath: String, options: OpenDatabaseOptions, serializedData: Data?) -> NativeDatabase in
        var db: OpaquePointer?
        var errMsg: UnsafePointer<CChar>?

        if let serializedData = serializedData {
          db = try deserializeDatabase(serializedData)
        } else {
          // Try to find opened database for fast refresh
          if let cachedDb = findCachedDatabase(where: { $0.databasePath == databasePath && $0.openOptions == options && !options.useNewConnection }) {
            return cachedDb
          }

          guard let libSQLUrl = options.libSQLUrl else {
            throw InvalidArgumentsException("libSQLUrl must be provided")
          }
          guard let libSQLAuthToken = options.libSQLAuthToken else {
            throw InvalidArgumentsException("libSQLAuthToken must be provided")
          }
          if options.libSQLRemoteOnly {
            if libsql_open_remote_with_webpki(libSQLUrl.absoluteString, libSQLAuthToken, &db, &errMsg) != 0 {
              throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
            }
          } else {
            let path = try ensureDatabasePathExists(path: databasePath)
            var result: Int32 = 0
            path.standardizedFileURL.path.withCString { dbPath in
              libSQLUrl.absoluteString.withCString { libSQLUrl in
                libSQLAuthToken.withCString { libSQLAuthToken in
                  let libSQLConfig = libsql.libsql_config(
                    db_path: dbPath,
                    primary_url: libSQLUrl,
                    auth_token: libSQLAuthToken,
                    read_your_writes: 1,
                    encryption_key: nil,
                    sync_interval: 0,
                    with_webpki: 1,
                    offline: 1)
                  result = libsql_open_sync_with_config(libSQLConfig, &db, &errMsg)
                }
              }
            }
            if result != 0 {
              throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
            }
          }
        }

        let database = NativeDatabase(db, databasePath: databasePath, openOptions: options)
        var extraPointer: OpaquePointer?
        if libsql_connect(db, &extraPointer, &errMsg) != 0 {
          throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
        }
        database.extraPointer = extraPointer
        addCachedDatabase(database)
        return database
      }

      AsyncFunction("initAsync") { (database: NativeDatabase) in
        try initDb(database: database)
      }
      Function("initSync") { (database: NativeDatabase) in
        try initDb(database: database)
      }

      AsyncFunction("isInTransactionAsync") { (_: NativeDatabase) -> Bool in
        throw UnsupportedOperationException()
      }
      Function("isInTransactionSync") { (_: NativeDatabase) -> Bool in
        throw UnsupportedOperationException()
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

      AsyncFunction("syncLibSQL") { (database: NativeDatabase) in
        var errMsg: UnsafePointer<CChar>?
        if libsql_sync(database.pointer, &errMsg) != 0 {
          let err = convertLibSqlErrorToString(errMsg)
          throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
        }
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
    throw UnsupportedOperationException()
  }

  private func initDb(database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    if database.openOptions.enableCRSQLite {
      throw UnsupportedOperationException("enableCRSQLite is not supported in libSQL mode")
    }
    if database.openOptions.enableChangeListener {
      throw UnsupportedOperationException("enableChangeListener is not supported in libSQL mode")
    }
  }

  private func exec(database: NativeDatabase, source: String) throws {
    try maybeThrowForClosedDatabase(database)
    var errMsg: UnsafePointer<CChar>?
    if libsql_execute(database.extraPointer, source, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
  }

  private func serialize(database: NativeDatabase, databaseName: String) throws -> Data {
    throw UnsupportedOperationException()
  }

  private func prepareStatement(database: NativeDatabase, statement: NativeStatement, source: String) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    let sourceString = source.cString(using: .utf8)
    var errMsg: UnsafePointer<CChar>?
    if libsql_prepare(database.extraPointer, sourceString, &statement.pointer, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
    maybeAddCachedStatement(database: database, statement: statement)
  }

  // swiftlint:disable line_length

  private func run(statement: NativeStatement, database: NativeDatabase, bindParams: [String: Any], bindBlobParams: [String: Data], shouldPassAsArray: Bool) throws -> [String: Any] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)

    if let rows = statement.extraPointer {
      libsql_free_rows(rows)
      statement.extraPointer = nil
    }
    var errMsg: UnsafePointer<CChar>?
    libsql_reset_stmt(statement.pointer, &errMsg)
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

    let rows = try maybeBindStatementRows(statement)
    var row: OpaquePointer?
    if libsql_next_row(rows, &row, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
    defer {
      libsql_free_row(row)
    }
    let firstRowValues: SQLiteColumnValues
    if let row {
      firstRowValues = try getColumnValues(statement: statement, rows: rows, row: row)
    } else {
      firstRowValues = []
    }
    return [
      "lastInsertRowId": Int(libsql_last_insert_rowid(database.extraPointer)),
      "changes": Int(libsql_changes(database.extraPointer)),
      "firstRowValues": firstRowValues
    ]
  }

  // swiftlint:enable line_length

  private func step(statement: NativeStatement, database: NativeDatabase) throws -> SQLiteColumnValues? {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    let rows = try maybeBindStatementRows(statement)
    var row: OpaquePointer?
    var errMsg: UnsafePointer<CChar>?
    if libsql_next_row(rows, &row, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
    defer {
      libsql_free_row(row)
    }
    if let row {
      return try getColumnValues(statement: statement, rows: rows, row: row)
    }
    return nil
  }

  private func getAll(statement: NativeStatement, database: NativeDatabase) throws -> [SQLiteColumnValues] {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    var columnValuesList: [SQLiteColumnValues] = []
    var errMsg: UnsafePointer<CChar>?
    let rows = try maybeBindStatementRows(statement)
    while true {
      var row: OpaquePointer?
      if libsql_next_row(rows, &row, &errMsg) != 0 {
        throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
      }
      defer {
        libsql_free_row(row)
      }
      if row == nil && errMsg == nil {
        break
      }
      if let row {
        columnValuesList.append(try getColumnValues(statement: statement, rows: rows, row: row))
      }
    }
    return columnValuesList
  }

  private func reset(statement: NativeStatement, database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    if let rows = statement.extraPointer {
      libsql_free_rows(rows)
      statement.extraPointer = nil
    }
    var errMsg: UnsafePointer<CChar>?
    if libsql_reset_stmt(statement.pointer, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
  }

  private func finalize(statement: NativeStatement, database: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(database)
    try maybeThrowForFinalizedStatement(statement)
    maybeRemoveCachedStatement(database: database, statement: statement)
    if let rows = statement.extraPointer {
      libsql_free_rows(rows)
    }
    libsql_free_stmt(statement.pointer)
    statement.isFinalized = true
  }

  private func convertLibSqlErrorToString(_ errMsg: UnsafePointer<CChar>?) -> String {
    if let errMsg {
      return String(cString: errMsg)
    }
    return "Unknown error"
  }

  private func closeDatabase(_ db: NativeDatabase) throws {
    try maybeThrowForClosedDatabase(db)
    for removedStatement in maybeRemoveAllCachedStatements(database: db) {
      if let rows = removedStatement.extraPointer {
        libsql_free_rows(rows)
      }
      libsql_free_stmt(removedStatement.pointer)
    }

    libsql_disconnect(db.extraPointer)
    libsql_close(db.pointer)
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

  private func getColumnNames(statement: NativeStatement) throws -> SQLiteColumnNames {
    try maybeThrowForFinalizedStatement(statement)
    let rows = try maybeBindStatementRows(statement)
    let columnCount = Int(libsql_column_count(rows))
    var columnNames: SQLiteColumnNames = Array(repeating: "", count: columnCount)
    for i in 0..<columnCount {
      var name: UnsafePointer<CChar>?
      var errMsg: UnsafePointer<CChar>?
      libsql_column_name(rows, Int32(i), &name, &errMsg)
      if let name {
        columnNames[i] = String(cString: name)
      } else {
        columnNames[i] = "Unknown column name"
      }
    }
    return columnNames
  }

  private func getColumnValues(statement: NativeStatement, rows: OpaquePointer, row: OpaquePointer) throws -> SQLiteColumnValues {
    try maybeThrowForFinalizedStatement(statement)
    let columnCount = Int(libsql_column_count(rows))
    var columnValues: SQLiteColumnValues = Array(repeating: 0, count: columnCount)
    for i in 0..<columnCount {
      columnValues[i] = try getColumnValue(statement: statement, rows: rows, row: row, at: Int32(i))
    }
    return columnValues
  }

  @inline(__always)
  private func getColumnValue(statement: NativeStatement, rows: OpaquePointer, row: OpaquePointer, at index: Int32) throws -> Any {
    let instance = statement.pointer
    var errMsg: UnsafePointer<CChar>?
    var type: Int32 = 0

    if libsql_column_type(rows, row, index, &type, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }

    switch type {
    case LIBSQL_INT:
      var value: Int64 = 0
      if libsql_get_int(row, index, &value, &errMsg) != 0 {
        throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
      }
      return value
    case LIBSQL_FLOAT:
      var value: Double = 0
      if libsql_get_float(row, index, &value, &errMsg) != 0 {
        throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
      }
      return value
    case LIBSQL_TEXT:
      var text: UnsafePointer<CChar>?
      if libsql_get_string(row, index, &text, &errMsg) != 0 {
        throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
      }
      defer { libsql_free_string(text) }
      guard let text else {
        return ""
      }
      return String(cString: text)
    case LIBSQL_BLOB:
      var blob = libsql.blob()
      if libsql_get_blob(row, index, &blob, &errMsg) != 0 {
        throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
      }
      defer { libsql_free_blob(blob) }
      return Data(bytes: blob.ptr, count: Int(blob.len))
    case LIBSQL_NULL:
      return NSNull()
    default:
      throw InvalidConvertibleException("Unsupported column type: \(type)")
    }
  }

  private func bindStatementParam(statement: NativeStatement, with param: Any, at index: Int32) throws {
    let instance = statement.pointer
    var errMsg: UnsafePointer<CChar>?

    switch param {
    case Optional<Any>.none:
      libsql_bind_null(instance, index, &errMsg)
    case _ as NSNull:
      libsql_bind_null(instance, index, &errMsg)
    case let param as Int64:
      libsql_bind_int(instance, index, Int64(param), &errMsg)
    case let param as Double:
      libsql_bind_float(instance, index, param, &errMsg)
    case let param as String:
      libsql_bind_string(instance, index, param, &errMsg)
    case let param as Data:
      _ = param.withUnsafeBytes {
        libsql_bind_blob(instance, index, $0.baseAddress?.assumingMemoryBound(to: UInt8.self), Int32(param.count), &errMsg)
      }
    case let param as Bool:
      libsql_bind_int(instance, index, param ? 1 : 0, &errMsg)
    default:
      throw InvalidConvertibleException("Unsupported parameter type: \(type(of: param))")
    }

    if let errMsg = errMsg {
      throw SQLiteErrorException(String(cString: errMsg))
    }
  }

  private func maybeBindStatementRows(_ statement: NativeStatement) throws -> OpaquePointer {
    if let rows = statement.extraPointer {
      return rows
    }
    var rows: OpaquePointer?
    var errMsg: UnsafePointer<CChar>?
    if libsql_query_stmt(statement.pointer, &rows, &errMsg) != 0 {
      throw SQLiteErrorException(convertLibSqlErrorToString(errMsg))
    }
    guard let rows else {
      throw SQLiteErrorException("libsql_query_stmt returns nil rows")
    }
    statement.extraPointer = rows
    return rows
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
      throw UnsupportedOperationException("Named parameter binding is not supported in libSQL mode.")
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
