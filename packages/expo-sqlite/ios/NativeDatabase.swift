// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

// `@unchecked Sendable`: the `@JS(.concurrent)` members send `self` off the JavaScript thread, which
// Swift 6 mode allows only for a `Sendable` shared object.
@SharedObject
final class NativeDatabase: SharedObject, @unchecked Sendable {
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

  // MARK: - JavaScript members

  @JS(.concurrent)
  func isInTransactionAsync() async throws -> Bool {
    return try isInTransaction()
  }

  @JS
  func isInTransactionSync() throws -> Bool {
    return try isInTransaction()
  }

  @JS(.concurrent)
  func execAsync(source: String) async throws {
    try exec(source: source)
  }

  @JS
  func execSync(source: String) throws {
    try exec(source: source)
  }

  @JS(.concurrent)
  func serializeAsync(databaseName: String) async throws -> Data {
    return try serialize(databaseName: databaseName)
  }

  @JS
  func serializeSync(databaseName: String) throws -> Data {
    return try serialize(databaseName: databaseName)
  }

  @JS(.concurrent)
  func prepareAsync(statement: NativeStatement, source: String) async throws {
    try prepare(statement: statement, source: source)
  }

  @JS
  func prepareSync(statement: NativeStatement, source: String) throws {
    try prepare(statement: statement, source: source)
  }

  @JS(.concurrent)
  func createSessionAsync(session: NativeSession, dbName: String) async throws {
    try createSession(session: session, dbName: dbName)
  }

  @JS
  func createSessionSync(session: NativeSession, dbName: String) throws {
    try createSession(session: session, dbName: dbName)
  }

  @JS(.concurrent)
  func loadExtensionAsync(libPath: String, entryPoint: String?) async throws {
    try loadExtension(libPath: libPath, entryPoint: entryPoint)
  }

  @JS
  func loadExtensionSync(libPath: String, entryPoint: String?) throws {
    try loadExtension(libPath: libPath, entryPoint: entryPoint)
  }

  // MARK: - Implementation shared by the sync and async members

  private func isInTransaction() throws -> Bool {
    try ensureOpen()
    return exsqlite3_get_autocommit(pointer) == 0
  }

  private func exec(source: String) throws {
    try ensureOpen()
    var error: UnsafeMutablePointer<CChar>?
    let ret = exsqlite3_exec(pointer, source, nil, nil, &error)
    if ret != SQLITE_OK, let error = error {
      let errorString = String(cString: error)
      exsqlite3_free(error)
      throw SQLiteErrorException(errorString)
    }
  }

  private func serialize(databaseName: String) throws -> Data {
    try ensureOpen()
    var size: sqlite3_int64 = 0
    guard let bytes = exsqlite3_serialize(pointer, databaseName, &size, 0) else {
      throw SQLiteErrorException(lastErrorMessage())
    }
    let serializedData = Data(bytes: bytes, count: Int(size))
    exsqlite3_free(bytes)
    return serializedData
  }

  private func prepare(statement: NativeStatement, source: String) throws {
    try ensureOpen()
    try statement.ensureNotFinalized()
    let sourceString = source.cString(using: .utf8)
    if exsqlite3_prepare_v2(pointer, sourceString, -1, &statement.pointer, nil) != SQLITE_OK {
      throw SQLiteErrorException(lastErrorMessage())
    }
  }

  private func createSession(session: NativeSession, dbName: String) throws {
    try ensureOpen()
    let db = dbName.cString(using: .utf8)
    if exsqlite3session_create(pointer, db, &session.pointer) != SQLITE_OK {
      throw SQLiteErrorException(lastErrorMessage())
    }
  }

  private func loadExtension(libPath: String, entryPoint: String?) throws {
    try ensureOpen()
    exsqlite3_enable_load_extension(pointer, 1)
    var error: UnsafeMutablePointer<CChar>?
    let ret = exsqlite3_load_extension(pointer, libPath.cString(using: .utf8), entryPoint, &error)
    if ret != SQLITE_OK, let error = error {
      let errorString = String(cString: error)
      exsqlite3_free(error)
      throw SQLiteErrorException(errorString)
    }
  }
}

internal func sqliteErrorMessage(for db: OpaquePointer?) -> String {
  let code = exsqlite3_errcode(db)
  let message = String(cString: exsqlite3_errmsg(db), encoding: .utf8) ?? ""
  return "Error code \(code): \(message)"
}

// `==` lives in an extension: an operator declared inside a type that carries a member-attribute macro
// is seen twice by the compiler and fails the `Equatable` conformance check.
// swiftlint:disable:next no_grouping_extension
extension NativeDatabase: Equatable, Hashable {
  static func == (lhs: NativeDatabase, rhs: NativeDatabase) -> Bool {
    return lhs.pointer == rhs.pointer
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(pointer)
  }
}
