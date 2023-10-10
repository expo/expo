// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import sqlite3

private typealias Row = [String: Any]
private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)

public final class SQLiteModuleNext: Module {
  // Store unmanaged (SQLiteModuleNext, Database) pairs for sqlite callbacks,
  // will release the pair when `closeDatabase` is called.
  private var contextPairs = [Unmanaged<AnyObject>]()

  private var databaseMap = [DatabaseId: Database]()
  private var statementMap = [StatementId: Statement]()
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("ExpoSQLiteNext")

    Events("onDatabaseChange")

    OnStartObserving {
      hasListeners = true
    }

    OnStopObserving {
      hasListeners = false
    }

    OnDestroy {
      statementMap.values.forEach {
        sqlite3_finalize($0.instance)
      }
      statementMap.removeAll()
      databaseMap.values.forEach {
        closeDatabase($0)
      }
      databaseMap.removeAll()
    }

    AsyncFunction("openDatabaseAsync") { (dbName: String, options: OpenDatabaseOptions) -> DatabaseId in
      guard let path = pathForDatabaseName(name: dbName) else {
        throw DatabaseException()
      }

      // Try to find opened database for fast refresh
      for (id, database) in databaseMap {
        if database.dbName == dbName {
          return id
        }
      }

      var db: OpaquePointer?
      if sqlite3_open(path.absoluteString, &db) != SQLITE_OK {
        throw DatabaseException()
      }

      let id = Database.pullNextId()
      let database = Database(id: id, dbName: dbName, openOptions: options, instance: db)

      if options.enableCRSQLite {
        crsqlite_init_from_swift(db)
      }
      
      if options.enableChangeListener {
        let contextPair = Unmanaged.passRetained(((self, database) as AnyObject))
        contextPairs.append(contextPair)
        sqlite3_update_hook(
          db, { obj, action, _, tableName, rowId in
            guard let obj,
                  let tableName,
                  let pair = Unmanaged<AnyObject>.fromOpaque(obj).takeUnretainedValue() as? (SQLiteModuleNext, Database) else {
              return
            }
            let selfInstance = pair.0
            let database = pair.1
            if selfInstance.hasListeners {
              selfInstance.sendEvent("onDatabaseChange", [
                "dbName": database.dbName,
                "tableName": String(cString: UnsafePointer(tableName)),
                "rowId": rowId,
                "typeId": SQLAction.fromCode(value: action)
              ])
            }
          },
          contextPair.toOpaque()
        )
      }

      databaseMap[id] = database
      return id
    }

    AsyncFunction("deleteDatabaseAsync") { (dbName: String) in
      for (id, database) in databaseMap {
        if database.dbName == dbName {
          throw DeleteDatabaseException(dbName)
        }
      }

      guard let path = pathForDatabaseName(name: dbName) else {
        throw Exceptions.FileSystemModuleNotFound()
      }

      if !FileManager.default.fileExists(atPath: path.absoluteString) {
        throw DatabaseNotFoundException(dbName)
      }

      do {
        try FileManager.default.removeItem(atPath: path.absoluteString)
      } catch {
        throw DeleteDatabaseFileException(dbName)
      }
    }

    Function("isInTransaction") { (dbId: DatabaseId) -> Bool in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      return sqlite3_get_autocommit(db.instance) == 0
    }

    AsyncFunction("isInTransactionAsync") { (dbId: DatabaseId) -> Bool in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      return sqlite3_get_autocommit(db.instance) == 0
    }

    AsyncFunction("closeDatabaseAsync") { (dbId: DatabaseId) in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      closeDatabase(db)
      databaseMap.removeValue(forKey: dbId)
    }

    AsyncFunction("execAsync") { (dbId: DatabaseId, source: String) in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      var error: UnsafeMutablePointer<CChar>? = nil
      let ret = sqlite3_exec(db.instance, source, nil, nil, &error)
      if ret != SQLITE_OK, let error = error {
        let errorString = String(cString: error)
        sqlite3_free(error)
        throw SQLiteErrorException(errorString)
      }
    }

    AsyncFunction("prepareAsync") { (dbId: DatabaseId, source: String) -> StatementId in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      var statement: OpaquePointer?
      if sqlite3_prepare_v2(db.instance, source, Int32(source.count), &statement, nil) != SQLITE_OK {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      let id = Statement.pullNextId()
      statementMap[id] = Statement(id: id, instance: statement)
      return id
    }

    AsyncFunction("statementArrayRunAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [Any]) -> [String: Int] in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (index, param) in bindParams.enumerated() {
        try bindStatementParam(statement: statement, with: param, at: Int32(index + 1))
      }
      let ret = sqlite3_step(statement.instance)
      if ret != SQLITE_ROW && ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return [
        "lastID": Int(sqlite3_last_insert_rowid(db.instance)),
        "changes": Int(sqlite3_changes(db.instance)),
      ]
    }

    AsyncFunction("statementObjectRunAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [String: Any]) -> [String: Int] in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (name, param) in bindParams {
        let index = sqlite3_bind_parameter_index(statement.instance, name.cString(using: .utf8))
        if index > 0 {
          try bindStatementParam(statement: statement, with: param, at: index)
        }
      }
      let ret = sqlite3_step(statement.instance)
      if ret != SQLITE_ROW && ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return [
        "lastID": Int(sqlite3_last_insert_rowid(db.instance)),
        "changes": Int(sqlite3_changes(db.instance)),
      ]
    }

    AsyncFunction("statementArrayGetAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [Any]) -> Row? in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (index, param) in bindParams.enumerated() {
        try bindStatementParam(statement: statement, with: param, at: Int32(index + 1))
      }
      let ret = sqlite3_step(statement.instance)
      if ret == SQLITE_ROW {
        return try getRow(statement: statement)
      }
      if ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return nil
    }

    AsyncFunction("statementObjectGetAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [String: Any]) -> Row? in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (name, param) in bindParams {
        let index = sqlite3_bind_parameter_index(statement.instance, name.cString(using: .utf8))
        if index > 0 {
          try bindStatementParam(statement: statement, with: param, at: index)
        }
      }
      let ret = sqlite3_step(statement.instance)
      if ret == SQLITE_ROW {
        return try getRow(statement: statement)
      }
      if ret != SQLITE_DONE {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return nil
    }

    AsyncFunction("statementArrayGetAllAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [Any]) -> [Row] in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (index, param) in bindParams.enumerated() {
        try bindStatementParam(statement: statement, with: param, at: Int32(index + 1))
      }
      var rows: [Row] = []
      while true {
        let ret = sqlite3_step(statement.instance)
        if ret == SQLITE_ROW {
          rows.append(try getRow(statement: statement))
          continue
        } else if ret == SQLITE_DONE {
          break
        }
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return rows
    }

    AsyncFunction("statementObjectGetAllAsync") { (dbId: DatabaseId, statementId: StatementId, bindParams: [String: Any]) -> [Row] in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      for (name, param) in bindParams {
        let index = sqlite3_bind_parameter_index(statement.instance, name.cString(using: .utf8))
        if index > 0 {
          try bindStatementParam(statement: statement, with: param, at: index)
        }
      }
      var rows: [Row] = []
      while true {
        let ret = sqlite3_step(statement.instance)
        if ret == SQLITE_ROW {
          rows.append(try getRow(statement: statement))
          continue
        } else if ret == SQLITE_DONE {
          break
        }
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      return rows
    }

    AsyncFunction("statementResetAsync") { (dbId: DatabaseId, statementId: StatementId) in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      if sqlite3_reset(statement.instance) != SQLITE_OK {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
    }

    AsyncFunction("statementFinalizeAsync") { (dbId: DatabaseId, statementId: StatementId) in
      guard let db = databaseMap[dbId] else {
        throw DatabaseIdNotFoundException(dbId)
      }
      guard let statement = statementMap[statementId] else {
        throw StatementIdNotFoundException(statementId)
      }
      if sqlite3_finalize(statement.instance) != SQLITE_OK {
        throw SQLiteErrorException(convertSqlLiteErrorToString(db))
      }
      statementMap.removeValue(forKey: statementId)
    }
  }

  private func pathForDatabaseName(name: String) -> URL? {
    guard let fileSystem = appContext?.fileSystem else {
      return nil
    }

    let directory = URL(string: fileSystem.documentDirectory)?.appendingPathComponent("SQLite")
    fileSystem.ensureDirExists(withPath: directory?.absoluteString)

    return directory?.appendingPathComponent(name)
  }

  private func convertSqlLiteErrorToString(_ db: Database) -> String {
    let code = sqlite3_errcode(db.instance)
    let message = String(cString: sqlite3_errmsg(db.instance), encoding: .utf8) ?? ""
    return "Error code \(code): \(message)"
  }

  private func closeDatabase(_ db: Database) {
    if db.openOptions.enableCRSQLite {
      sqlite3_exec(db.instance, "SELECT crsql_finalize()", nil, nil, nil)
    }
    sqlite3_close(db.instance)

    if let index = contextPairs.firstIndex(where: {
      guard let pair = $0.takeUnretainedValue() as? (SQLiteModuleNext, Database) else {
        return false
      }
      if pair.1.id != db.id {
        return false
      }
      $0.release()
      return true
    }) {
      contextPairs.remove(at: index)
    }
  }

  private func getRow(statement: Statement) throws -> Row {
    var row = Row()
    let columnCount = sqlite3_column_count(statement.instance)
    for i in 0..<Int(columnCount) {
      let columnName = String(cString: sqlite3_column_name(statement.instance, Int32(i)))
      row[columnName] = try getColumnValue(statement: statement, at: Int32(i))
    }
    return row
  }

  private func getColumnValue(statement: Statement, at index: Int32) throws -> Any {
    let instance = statement.instance
    let type = sqlite3_column_type(instance, index)

    switch type {
    case SQLITE_INTEGER:
      return sqlite3_column_int(instance, index)
    case SQLITE_FLOAT:
      return sqlite3_column_double(instance, index)
    case SQLITE_TEXT:
      let text = sqlite3_column_text(instance, index)
      return String(cString: text!)
    case SQLITE_BLOB:
      let blob = sqlite3_column_blob(instance, index)
      let size = sqlite3_column_bytes(instance, index)
      return Data(bytes: blob!, count: Int(size))
    case SQLITE_NULL:
      return NSNull()
    default:
      throw Exception(name: "InvalidConvertibleException", description: "Unsupported column type: \(type)")
    }
  }

  private func bindStatementParam(statement: Statement, with param: Any, at index: Int32) throws {
    let instance = statement.instance
    switch param {
    case Optional<Any>.none:
      sqlite3_bind_null(instance, index)
    case let param as NSNull:
      sqlite3_bind_null(instance, index)
    case let param as Int:
      sqlite3_bind_int(instance, index, Int32(param))
    case let param as Double:
      sqlite3_bind_double(instance, index, param)
    case let param as String:
      sqlite3_bind_text(instance, index, param, Int32(param.count), SQLITE_TRANSIENT)
    case let param as Data:
      sqlite3_bind_blob(instance, index, (param as NSData).bytes, Int32(param.count), SQLITE_TRANSIENT)
    case let param as Bool:
      sqlite3_bind_int(instance, index, param ? 1 : 0)
    default:
      throw Exception(name: "InvalidConvertibleException", description: "Unsupported parameter type: \(type(of: param))")
    }
  }
}
