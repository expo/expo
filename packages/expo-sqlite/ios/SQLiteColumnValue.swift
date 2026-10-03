// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

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
