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
}

// `==` lives in an extension: an operator declared inside a type that carries a member-attribute macro
// is seen twice by the compiler and fails the `Equatable` conformance check.
// swiftlint:disable:next no_grouping_extension
extension NativeStatement: Equatable {
  static func == (lhs: NativeStatement, rhs: NativeStatement) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
