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

private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)
