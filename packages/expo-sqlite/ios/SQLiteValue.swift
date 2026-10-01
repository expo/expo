// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// A value of one of the SQLite storage classes, as it crosses the JavaScript boundary: a bind
/// parameter on the way in and a column value on the way out.
///
/// The conversions are written by hand rather than synthesized with `@Union`: a union decodes by
/// trying each alternative in order, so a string would fail two decodes before it matches. Here
/// one check of the value's type picks the case.
enum SQLiteValue: Sendable {
  case integer(Int64)
  case double(Double)
  case text(String)
  case blob(ArrayBuffer)
  case null

  /// Reads the value of the column at `index` in the current row of `statement`.
  @inline(__always)
  init(statement: OpaquePointer?, column index: Int32) throws {
    switch exsqlite3_column_type(statement, index) {
    case SQLITE_INTEGER:
      self = .integer(exsqlite3_column_int64(statement, index))
    case SQLITE_FLOAT:
      self = .double(exsqlite3_column_double(statement, index))
    case SQLITE_TEXT:
      guard let text = exsqlite3_column_text(statement, index) else {
        throw InvalidConvertibleException("Null text")
      }
      self = .text(String(cString: text))
    case SQLITE_BLOB:
      guard let blob = exsqlite3_column_blob(statement, index) else {
        self = .blob(ArrayBuffer(size: 0))
        return
      }
      let size = exsqlite3_column_bytes(statement, index)
      self = .blob(ArrayBuffer.copy(of: blob, count: Int(size)))
    case SQLITE_NULL:
      self = .null
    case let type:
      throw InvalidConvertibleException("Unsupported column type: \(type)")
    }
  }

  /// Binds the value to the parameter at `index` of `statement`.
  @inline(__always)
  func bind(to statement: OpaquePointer?, at index: Int32) {
    switch self {
    case .integer(let value):
      exsqlite3_bind_int64(statement, index, value)
    case .double(let value):
      exsqlite3_bind_double(statement, index, value)
    case .text(let value):
      exsqlite3_bind_text(statement, index, value, -1, SQLITE_TRANSIENT)
    case .blob(let value):
      _ = value.withUnsafeBytes {
        exsqlite3_bind_blob(statement, index, $0.baseAddress, Int32(value.byteLength), SQLITE_TRANSIENT)
      }
    case .null:
      exsqlite3_bind_null(statement, index)
    }
  }
}

// swiftlint:disable:next no_grouping_extension
extension SQLiteValue: JavaScriptCodable {
  // Numbers decode to `.double`, matching the type-erased path this replaces, which read every number
  // as a `Double`. Booleans bind as 0 or 1.
  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> SQLiteValue {
    if value.isNumber() {
      return .double(value.getDouble())
    }
    if value.isString() {
      return .text(value.getString())
    }
    if value.isNull() || value.isUndefined() {
      return .null
    }
    if value.isBool() {
      return .integer(value.getBool() ? 1 : 0)
    }
    if value.isObject() {
      return .blob(try ArrayBuffer.decode(value, in: runtime))
    }
    throw InvalidConvertibleException(unsupportedParameterMessage)
  }

  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws -> SQLiteValue {
    if value.isNumber() {
      return .double(value.getDouble())
    }
    if value.isString() {
      return .text(value.getString())
    }
    if value.isNull() || value.isUndefined() {
      return .null
    }
    if value.isBool() {
      return .integer(value.getBool() ? 1 : 0)
    }
    if value.isObject() {
      return .blob(try ArrayBuffer.decode(value, in: runtime))
    }
    throw InvalidConvertibleException(unsupportedParameterMessage)
  }

  // Integers encode to a JS number like before, not to a `bigint`.
  @JavaScriptActor
  static func encode(_ value: SQLiteValue, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    switch value {
    case .integer(let value):
      return .number(Double(value))
    case .double(let value):
      return .number(value)
    case .text(let value):
      return JavaScriptValue(runtime, value)
    case .blob(let value):
      return try ArrayBuffer.encode(value, in: runtime)
    case .null:
      return .null
    }
  }
}

private let unsupportedParameterMessage = """
  Unsupported bind parameter type. A parameter must be a number, string, boolean, null, ArrayBuffer or \
  Uint8Array; convert the value to one of these types before binding it
  """

private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)

// swiftlint:disable:next no_grouping_extension
extension SQLiteValue: Equatable {
  static func == (lhs: SQLiteValue, rhs: SQLiteValue) -> Bool {
    switch (lhs, rhs) {
    case let (.integer(lhs), .integer(rhs)):
      return lhs == rhs
    case let (.double(lhs), .double(rhs)):
      return lhs == rhs
    case let (.text(lhs), .text(rhs)):
      return lhs == rhs
    case let (.blob(lhs), .blob(rhs)):
      return lhs.withUnsafeBytes { lhs in rhs.withUnsafeBytes { rhs in lhs.elementsEqual(rhs) } }
    case (.null, .null):
      return true
    default:
      return false
    }
  }
}
