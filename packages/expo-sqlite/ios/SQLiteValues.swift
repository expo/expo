// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// A bind parameter as it comes from JavaScript: `number | string | boolean | bigint | ArrayBuffer`.
/// `null` arrives as `nil` of the optional around it.
///
/// A union decodes its cases in declaration order and the first match wins, so `double` goes first:
/// the `Int64` decode accepts any number and rounds it, which would turn `1.5` into `2`. Ordered after
/// `double`, `integer` only matches a `bigint`.
@Union
enum SQLiteBindValue: Sendable {
  case double(Double)
  case text(String)
  case boolean(Bool)
  case integer(Int64)
  case blob(ArrayBuffer)

  /// Binds the value to the parameter at `index` of `statement`.
  @inline(__always)
  func bind(to statement: OpaquePointer?, at index: Int32) {
    switch self {
    case .double(let value):
      exsqlite3_bind_double(statement, index, value)
    case .text(let value):
      exsqlite3_bind_text(statement, index, value, -1, SQLITE_TRANSIENT)
    case .boolean(let value):
      exsqlite3_bind_int(statement, index, value ? 1 : 0)
    case .integer(let value):
      exsqlite3_bind_int64(statement, index, value)
    case .blob(let value):
      _ = value.withUnsafeBytes {
        exsqlite3_bind_blob(statement, index, $0.baseAddress, Int32(value.byteLength), SQLITE_TRANSIENT)
      }
    }
  }
}

/// A column value as it goes to JavaScript: `number | string | ArrayBuffer`. `NULL` goes as `nil` of
/// the optional around it.
///
/// `INTEGER` columns are read as `double`, so they reach JavaScript as a number, not a `bigint`. That
/// loses precision above 2^53, as the type-erased conversion did before.
@Union
enum SQLiteColumnValue: Sendable {
  case double(Double)
  case text(String)
  case blob(ArrayBuffer)

  /// Reads the value of the column at `index` in the current row of `statement`, or `nil` for `NULL`.
  @inline(__always)
  static func read(from statement: OpaquePointer?, column index: Int32) throws -> SQLiteColumnValue? {
    switch exsqlite3_column_type(statement, index) {
    case SQLITE_INTEGER:
      return .double(Double(exsqlite3_column_int64(statement, index)))
    case SQLITE_FLOAT:
      return .double(exsqlite3_column_double(statement, index))
    case SQLITE_TEXT:
      guard let text = exsqlite3_column_text(statement, index) else {
        throw InvalidConvertibleException("Null text")
      }
      return .text(String(cString: text))
    case SQLITE_BLOB:
      guard let blob = exsqlite3_column_blob(statement, index) else {
        return .blob(ArrayBuffer(size: 0))
      }
      let size = exsqlite3_column_bytes(statement, index)
      return .blob(ArrayBuffer.copy(of: blob, count: Int(size)))
    case SQLITE_NULL:
      return nil
    case let type:
      throw InvalidConvertibleException("Unsupported column type: \(type)")
    }
  }
}

// `==` lives in an extension: an operator declared inside a type that carries a member-attribute macro
// is seen twice by the compiler and fails the `Equatable` conformance check.
// swiftlint:disable:next no_grouping_extension
extension SQLiteColumnValue: Equatable {
  static func == (lhs: SQLiteColumnValue, rhs: SQLiteColumnValue) -> Bool {
    switch (lhs, rhs) {
    case let (.double(lhs), .double(rhs)):
      return lhs == rhs
    case let (.text(lhs), .text(rhs)):
      return lhs == rhs
    case let (.blob(lhs), .blob(rhs)):
      return lhs.withUnsafeBytes { lhs in rhs.withUnsafeBytes { rhs in lhs.elementsEqual(rhs) } }
    default:
      return false
    }
  }
}

private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)
