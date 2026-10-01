// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

// `@unchecked Sendable`: the `@JS(.concurrent)` members send `self` off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` shared object.
@SharedObject
final class NativeStatement: SharedObject, @unchecked Sendable {
  var pointer: OpaquePointer?
  var isFinalized = false
  var extraPointer: OpaquePointer?
  /// Serializes the native calls that touch the statement. It is stateful and may be reached from several
  /// threads at once, so every call that touches it runs inside this lock.
  internal let lock = Mutex(())

  @JS
  nonisolated override init() {
    super.init()
  }

  /// Throws when the statement has been finalized, so a member can refuse to touch the freed handle.
  func ensureNotFinalized() throws {
    if isFinalized {
      throw AccessClosedResourceException()
    }
  }

  // MARK: - JavaScript members

  @JS(.concurrent)
  func resetAsync(database: NativeDatabase) async throws {
    try reset(database: database)
  }

  @JS
  func resetSync(database: NativeDatabase) throws {
    try reset(database: database)
  }

  @JS(.concurrent)
  func getColumnNamesAsync() async throws -> [String] {
    return try getColumnNames()
  }

  @JS
  func getColumnNamesSync() throws -> [String] {
    return try getColumnNames()
  }

  @JS(.concurrent)
  func finalizeAsync(database: NativeDatabase) async throws {
    try finalize(database: database)
  }

  @JS
  func finalizeSync(database: NativeDatabase) throws {
    try finalize(database: database)
  }

  @JS(.concurrent)
  func runAsync(
    database: NativeDatabase,
    bindParams: [String: SQLiteValue],
    bindBlobParams: [String: ArrayBuffer],
    shouldPassAsArray: Bool
  ) async throws -> SQLiteRunResult {
    return try run(database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
  }

  @JS
  func runSync(
    database: NativeDatabase,
    bindParams: [String: SQLiteValue],
    bindBlobParams: [String: ArrayBuffer],
    shouldPassAsArray: Bool
  ) throws -> SQLiteRunResult {
    return try run(database: database, bindParams: bindParams, bindBlobParams: bindBlobParams, shouldPassAsArray: shouldPassAsArray)
  }

  @JS(.concurrent)
  func stepAsync(database: NativeDatabase) async throws -> [SQLiteValue]? {
    return try step(database: database)
  }

  @JS
  func stepSync(database: NativeDatabase) throws -> [SQLiteValue]? {
    return try step(database: database)
  }

  @JS(.concurrent)
  func getAllAsync(database: NativeDatabase) async throws -> [[SQLiteValue]] {
    return try getAll(database: database)
  }

  @JS
  func getAllSync(database: NativeDatabase) throws -> [[SQLiteValue]] {
    return try getAll(database: database)
  }

  // MARK: - Implementation shared by the sync and async members

  private func reset(database: NativeDatabase) throws {
    try lock.withLock { _ in
      try ensureNotFinalized()
      try database.ensureOpen()

      if exsqlite3_reset(pointer) != SQLITE_OK {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
    }
  }

  private func getColumnNames() throws -> [String] {
    return try lock.withLock { _ in
      try ensureNotFinalized()
      let columnCount = Int(exsqlite3_column_count(pointer))
      var columnNames: [String] = Array(repeating: "", count: columnCount)
      for i in 0..<columnCount {
        columnNames[i] = String(cString: exsqlite3_column_name(pointer, Int32(i)))
      }
      return columnNames
    }
  }

  func finalize(database: NativeDatabase) throws {
    database.statementLifecycleLock.lock()
    defer { database.statementLifecycleLock.unlock() }
    try lock.withLock { _ in
      try ensureNotFinalized()
      try database.ensureOpen()

      let ret = exsqlite3_finalize(pointer)
      // SQLite destroys the statement even when returning an earlier execution error.
      isFinalized = true
      pointer = nil
      database.statements.removeAll { $0 === self }
      if ret != SQLITE_OK {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
    }
  }

  private func run(
    database: NativeDatabase,
    bindParams: [String: SQLiteValue],
    bindBlobParams: [String: ArrayBuffer],
    shouldPassAsArray: Bool
  ) throws -> SQLiteRunResult {
    return try lock.withLock { _ in
      try ensureNotFinalized()
      try database.ensureOpen()

      exsqlite3_reset(pointer)
      exsqlite3_clear_bindings(pointer)
      for (key, param) in bindParams {
        let index = try bindParamIndex(for: key, shouldPassAsArray: shouldPassAsArray)
        if index > 0 {
          param.bind(to: pointer, at: index)
        }
      }
      for (key, param) in bindBlobParams {
        let index = try bindParamIndex(for: key, shouldPassAsArray: shouldPassAsArray)
        if index > 0 {
          SQLiteValue.blob(param).bind(to: pointer, at: index)
        }
      }

      let ret = exsqlite3_step(pointer)
      if ret != SQLITE_ROW && ret != SQLITE_DONE {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
      return SQLiteRunResult(
        lastInsertRowId: Int(exsqlite3_last_insert_rowid(database.pointer)),
        changes: Int(exsqlite3_changes(database.pointer)),
        firstRowValues: ret == SQLITE_ROW ? try columnValues() : []
      )
    }
  }

  private func step(database: NativeDatabase) throws -> [SQLiteValue]? {
    return try lock.withLock { _ in
      try ensureNotFinalized()
      try database.ensureOpen()

      let ret = exsqlite3_step(pointer)
      if ret == SQLITE_ROW {
        return try columnValues()
      }
      if ret != SQLITE_DONE {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
      return nil
    }
  }

  private func getAll(database: NativeDatabase) throws -> [[SQLiteValue]] {
    return try lock.withLock { _ in
      try ensureNotFinalized()
      try database.ensureOpen()

      var rows: [[SQLiteValue]] = []
      while true {
        let ret = exsqlite3_step(pointer)
        if ret == SQLITE_ROW {
          rows.append(try columnValues())
          continue
        }
        if ret == SQLITE_DONE {
          break
        }
        throw SQLiteErrorException(database.lastErrorMessage())
      }
      return rows
    }
  }

  /// The values of the current row. Call it inside `lock`, after a step that returned `SQLITE_ROW`.
  private func columnValues() throws -> [SQLiteValue] {
    let columnCount = exsqlite3_column_count(pointer)
    var values: [SQLiteValue] = []
    values.reserveCapacity(Int(columnCount))
    for index in 0..<columnCount {
      values.append(try SQLiteValue(statement: pointer, column: index))
    }
    return values
  }

  /// The 1-based SQLite index of a bind parameter: an array position for positional parameters, or the
  /// index of the named parameter otherwise. Zero means the statement has no such parameter.
  private func bindParamIndex(for key: String, shouldPassAsArray: Bool) throws -> Int32 {
    if shouldPassAsArray {
      guard let position = Int32(key) else {
        throw InvalidBindParameterException()
      }
      return position + 1
    }
    return exsqlite3_bind_parameter_index(pointer, key)
  }
}

/// The result of `NativeStatement.run`: the effect of the statement and the values of the first row
/// it returned, if any.
@Record
struct SQLiteRunResult {
  // `Int` rather than SQLite's `Int64`: a 64-bit integer encodes as a JavaScript BigInt, and JavaScript
  // reads these as numbers.
  var lastInsertRowId: Int
  var changes: Int
  var firstRowValues: [SQLiteValue]
}

// `==` lives in an extension: an operator declared inside a type that carries a member-attribute macro
// is seen twice by the compiler and fails the `Equatable` conformance check.
// swiftlint:disable:next no_grouping_extension
extension NativeStatement: Equatable {
  static func == (lhs: NativeStatement, rhs: NativeStatement) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
