// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

// `@unchecked Sendable`: the `@JS(.concurrent)` members send `self` off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` shared object.
@SharedObject
final class NativeStatement: SharedObject, @unchecked Sendable {
  var pointer: OpaquePointer?
  var isFinalized = false
  var extraPointer: OpaquePointer?
  internal let lock = DispatchSemaphore(value: 1)

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
    try database.ensureOpen()
    try ensureNotFinalized()

    // The statement is stateful and may be reached from several threads at once, so every call that
    // touches it takes the same critical section.
    lock.wait()
    defer {
      lock.signal()
    }

    if exsqlite3_reset(pointer) != SQLITE_OK {
      throw SQLiteErrorException(database.lastErrorMessage())
    }
  }

  private func getColumnNames() throws -> [String] {
    try ensureNotFinalized()
    let columnCount = Int(exsqlite3_column_count(pointer))
    var columnNames: [String] = Array(repeating: "", count: columnCount)
    for i in 0..<columnCount {
      columnNames[i] = String(cString: exsqlite3_column_name(pointer, Int32(i)))
    }
    return columnNames
  }

  private func finalize(database: NativeDatabase) throws {
    try database.ensureOpen()
    try ensureNotFinalized()

    // Guard the stateful statement, see `reset` above.
    lock.wait()
    defer {
      lock.signal()
    }

    if exsqlite3_finalize(pointer) != SQLITE_OK {
      throw SQLiteErrorException(database.lastErrorMessage())
    }
    isFinalized = true
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
