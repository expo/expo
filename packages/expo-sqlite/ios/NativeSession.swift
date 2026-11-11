// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

// `@unchecked Sendable`: the `@JS(.concurrent)` members send `self` off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` shared object.
@SharedObject
final class NativeSession: SharedObject, @unchecked Sendable {
  var pointer: OpaquePointer?

  @JS
  nonisolated override init() {
    super.init()
  }

  // MARK: - JavaScript members

  @JS(.concurrent)
  func attachAsync(database: NativeDatabase, table: String?) async throws {
    try attach(database: database, table: table)
  }

  @JS
  func attachSync(database: NativeDatabase, table: String?) throws {
    try attach(database: database, table: table)
  }

  @JS(.concurrent)
  func enableAsync(database: NativeDatabase, enabled: Bool) async throws {
    try enable(database: database, enabled: enabled)
  }

  @JS
  func enableSync(database: NativeDatabase, enabled: Bool) throws {
    try enable(database: database, enabled: enabled)
  }

  @JS(.concurrent)
  func closeAsync(database: NativeDatabase) async throws {
    try close(database: database)
  }

  @JS
  func closeSync(database: NativeDatabase) throws {
    try close(database: database)
  }

  @JS(.concurrent)
  func createChangesetAsync(database: NativeDatabase) async throws -> ArrayBuffer {
    return try createChangeset(database: database)
  }

  @JS
  func createChangesetSync(database: NativeDatabase) throws -> ArrayBuffer {
    return try createChangeset(database: database)
  }

  @JS(.concurrent)
  func createInvertedChangesetAsync(database: NativeDatabase) async throws -> ArrayBuffer {
    return try createInvertedChangeset(database: database)
  }

  @JS
  func createInvertedChangesetSync(database: NativeDatabase) throws -> ArrayBuffer {
    return try createInvertedChangeset(database: database)
  }

  @JS(.concurrent)
  func applyChangesetAsync(database: NativeDatabase, changeset: ArrayBuffer) async throws {
    try applyChangeset(database: database, changeset: changeset)
  }

  @JS
  func applyChangesetSync(database: NativeDatabase, changeset: ArrayBuffer) throws {
    try applyChangeset(database: database, changeset: changeset)
  }

  @JS(.concurrent)
  func invertChangesetAsync(database: NativeDatabase, changeset: ArrayBuffer) async throws -> ArrayBuffer {
    return try invertChangeset(database: database, changeset: changeset)
  }

  @JS
  func invertChangesetSync(database: NativeDatabase, changeset: ArrayBuffer) throws -> ArrayBuffer {
    return try invertChangeset(database: database, changeset: changeset)
  }

  // MARK: - Implementation shared by the sync and async members

  private func attach(database: NativeDatabase, table: String?) throws {
    try database.ensureOpen()
    let tableName = table?.cString(using: .utf8)
    if exsqlite3session_attach(pointer, tableName) != SQLITE_OK {
      throw SQLiteErrorException(database.lastErrorMessage())
    }
  }

  private func enable(database: NativeDatabase, enabled: Bool) throws {
    try database.ensureOpen()
    exsqlite3session_enable(pointer, enabled ? 1 : 0)
  }

  private func close(database: NativeDatabase) throws {
    try database.ensureOpen()
    exsqlite3session_delete(pointer)
  }

  private func createChangeset(database: NativeDatabase) throws -> ArrayBuffer {
    try database.ensureOpen()
    var size: Int32 = 0
    var buffer: UnsafeMutableRawPointer?
    if exsqlite3session_changeset(pointer, &size, &buffer) != SQLITE_OK {
      throw SQLiteErrorException(database.lastErrorMessage())
    }
    guard let buffer else {
      return ArrayBuffer(size: 0)
    }
    defer {
      exsqlite3_free(buffer)
    }
    return ArrayBuffer.copy(of: buffer, count: Int(size))
  }

  private func createInvertedChangeset(database: NativeDatabase) throws -> ArrayBuffer {
    let changeset = try createChangeset(database: database)
    return try invertChangeset(database: database, changeset: changeset)
  }

  private func applyChangeset(database: NativeDatabase, changeset: some AnyArrayBuffer) throws {
    try database.ensureOpen()
    try changeset.withUnsafeBytes {
      let buffer = UnsafeMutableRawPointer(mutating: $0.baseAddress)
      if exsqlite3changeset_apply(
        database.pointer,
        Int32(changeset.byteLength),
        buffer,
        nil,
        { _, _, _ -> Int32 in
          return SQLITE_CHANGESET_REPLACE
        },
        nil
      ) != SQLITE_OK {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
    }
  }

  private func invertChangeset(database: NativeDatabase, changeset: some AnyArrayBuffer) throws -> ArrayBuffer {
    try database.ensureOpen()
    return try changeset.withUnsafeBytes {
      let inBuffer = UnsafeMutableRawPointer(mutating: $0.baseAddress)
      var outSize: Int32 = 0
      var outBuffer: UnsafeMutableRawPointer?
      if exsqlite3changeset_invert(Int32(changeset.byteLength), inBuffer, &outSize, &outBuffer) != SQLITE_OK {
        throw SQLiteErrorException(database.lastErrorMessage())
      }
      guard let outBuffer else {
        return ArrayBuffer(size: 0)
      }
      defer {
        exsqlite3_free(outBuffer)
      }
      return ArrayBuffer.copy(of: outBuffer, count: Int(outSize))
    }
  }
}

// `==` lives in an extension: an operator declared inside a type that carries a member-attribute macro
// is seen twice by the compiler and fails the `Equatable` conformance check.
// swiftlint:disable:next no_grouping_extension
extension NativeSession: Equatable {
  static func == (lhs: NativeSession, rhs: NativeSession) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
