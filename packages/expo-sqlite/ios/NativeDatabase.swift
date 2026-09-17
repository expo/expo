// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

// `@unchecked Sendable`: `@JS(.concurrent)` members of the shared objects send the database off the
// JavaScript thread, which Swift 6 mode allows only for a `Sendable` object.
final class NativeDatabase: SharedObject, Equatable, Hashable, @unchecked Sendable {
  var pointer: OpaquePointer?
  let databasePath: String
  let openOptions: OpenDatabaseOptions
  var isClosed = false
  var extraPointer: OpaquePointer?
  private var refCount = AtomicInteger(1)

  init(_ pointer: OpaquePointer?, databasePath: String, openOptions: OpenDatabaseOptions) {
    self.pointer = pointer
    self.databasePath = databasePath
    self.openOptions = openOptions
  }

  @discardableResult
  func addRef() -> Int {
    return refCount.increment()
  }

  @discardableResult
  func release() -> Int {
    return refCount.decrement()
  }

  /// Throws when the database has been closed, so a member can refuse to touch the freed connection.
  func ensureOpen() throws {
    if isClosed {
      throw AccessClosedResourceException()
    }
  }

  /// The code and message of the most recent error on this connection.
  func lastErrorMessage() -> String {
    return sqliteErrorMessage(for: pointer)
  }

  // MARK: - Equatable

  static func == (lhs: NativeDatabase, rhs: NativeDatabase) -> Bool {
    return lhs.pointer == rhs.pointer
  }

  // MARK: - Hashable

  func hash(into hasher: inout Hasher) {
    hasher.combine(pointer)
  }
}

internal func sqliteErrorMessage(for db: OpaquePointer?) -> String {
  let code = exsqlite3_errcode(db)
  let message = String(cString: exsqlite3_errmsg(db), encoding: .utf8) ?? ""
  return "Error code \(code): \(message)"
}
