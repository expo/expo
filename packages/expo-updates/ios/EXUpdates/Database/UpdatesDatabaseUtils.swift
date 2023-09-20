//  Copyright © 2019 650 Industries. All rights reserved.

// A lot of stuff in this class was originally written in objective-c, and the swift
// equivalents don't seem to work quite the same, which is important to have backwards
// data compatibility.
// swiftlint:disable legacy_objc_type
// swiftlint:disable force_cast
// swiftlint:disable force_unwrapping

import Foundation
import sqlite3

internal struct UpdatesDatabaseUtilsErrorInfo {
  let code: Int
  let extendedCode: Int
  let message: String
}

internal struct UpdatesDatabaseUtilsError: Error {
  enum ErrorKind {
    case SQLitePrepareError
    case SQLiteArgsBindError
    case SQLiteBlobNotUUID
    case SQLiteGetResultsError
  }

  let kind: ErrorKind
  let info: UpdatesDatabaseUtilsErrorInfo?
}

// these are not exported in the swift headers
let SQLITE_STATIC = unsafeBitCast(0, to: sqlite3_destructor_type.self)
let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

private extension UUID {
  var data: Data {
    return withUnsafeBytes(of: self.uuid, { Data($0) })
  }
}

/**
 * Utility class with methods for common database functions used across multiple classes.
 */
internal final class UpdatesDatabaseUtils {
  static func execute(sql: String, withArgs args: [Any?]?, onDatabase db: OpaquePointer) throws -> [[String: Any?]] {
    var stmt: OpaquePointer?
    guard sqlite3_prepare_v2(db, String(sql.utf8), -1, &stmt, nil) == SQLITE_OK,
      let stmt = stmt else {
      throw UpdatesDatabaseUtilsError(kind: .SQLitePrepareError, info: errorCodesAndMessage(fromSqlite: db))
    }

    if let args = args {
      guard bind(statement: stmt, withArgs: args) else {
        throw UpdatesDatabaseUtilsError(kind: .SQLiteArgsBindError, info: errorCodesAndMessage(fromSqlite: db))
      }
    }

    var rows: [[String: Any?]] = []
    var columnNames: [String] = []

    var columnCount: Int32 = 0
    var didFetchColumns = false
    var result: Int32
    var hasMore = true
    var didError = false

    while hasMore {
      result = sqlite3_step(stmt)
      switch result {
      case SQLITE_ROW:
        if !didFetchColumns {
          // get all column names once at the beginning
          columnCount = sqlite3_column_count(stmt)

          for i in 0..<columnCount {
            columnNames.append(String(utf8String: sqlite3_column_name(stmt, Int32(i)))!)
          }

          didFetchColumns = true
        }

        var entry: [String: Any] = [:]
        for i in 0..<columnCount {
          let columnValue = try getValue(withStatement: stmt, column: i)
          entry[columnNames[Int(i)]] = columnValue
        }
        rows.append(entry)
      case SQLITE_DONE:
        hasMore = false
      default:
        didError = true
        hasMore = false
      }
    }

    sqlite3_finalize(stmt)

    if didError {
      throw UpdatesDatabaseUtilsError(kind: .SQLiteGetResultsError, info: errorCodesAndMessage(fromSqlite: db))
    }

    return rows
  }

  private static func bind(statement stmt: OpaquePointer, withArgs args: [Any?]) -> Bool {
    for (index, arg) in args.enumerated() {
      let bindIdx = Int32(index + 1)
      switch arg {
      case let arg as UUID:
        guard withUnsafeBytes(of: arg.uuid, { bufferPointer -> Int32 in
          sqlite3_bind_blob(stmt, bindIdx, bufferPointer.baseAddress, 16, SQLITE_TRANSIENT)
        }) == SQLITE_OK else {
          return false
        }
      case let arg as NSNumber:
        guard sqlite3_bind_int64(stmt, bindIdx, arg.int64Value) == SQLITE_OK else {
          return false
        }
      case let arg as Date:
        let dateValue = arg.timeIntervalSince1970 * 1000
        guard sqlite3_bind_int64(stmt, bindIdx, Int64(dateValue)) == SQLITE_OK else {
          return false
        }
      case let arg as NSDictionary:
        guard let jsonData = try? JSONSerialization.data(withJSONObject: arg) as NSData else {
          return false
        }
        guard sqlite3_bind_text(stmt, bindIdx, jsonData.bytes, Int32(jsonData.length), SQLITE_TRANSIENT) == SQLITE_OK else {
          return false
        }
      case nil:
        guard sqlite3_bind_null(stmt, bindIdx) == SQLITE_OK else {
          return false
        }
      default:
        // convert to string
        var string: NSString
        if let argNSString = arg as? NSString {
          string = argNSString
        } else {
          string = (arg as! NSObject).description as NSString
        }
        let data = string.data(using: NSUTF8StringEncoding)! as NSData
        guard sqlite3_bind_text(stmt, bindIdx, data.bytes, Int32(data.length), SQLITE_TRANSIENT) == SQLITE_OK else {
          return false
        }
      }
    }
    return true
  }

  private static func getValue(withStatement stmt: OpaquePointer, column: Int32) throws -> Any? {
    let columnType = sqlite3_column_type(stmt, column)
    switch columnType {
    case SQLITE_INTEGER:
      return sqlite3_column_int64(stmt, column)
    case SQLITE_FLOAT:
      return sqlite3_column_double(stmt, column)
    case SQLITE_BLOB:
      guard sqlite3_column_bytes(stmt, column) == 16 else {
        throw UpdatesDatabaseUtilsError(kind: .SQLiteBlobNotUUID, info: nil)
      }
      let blob = Data(bytes: sqlite3_column_blob(stmt, column), count: 16)
      return blob.withUnsafeBytes { rawBytes -> UUID in
        NSUUID(uuidBytes: rawBytes) as UUID
      }
    case SQLITE_TEXT:
      return NSString(
        bytes: sqlite3_column_text(stmt, column),
        length: Int(sqlite3_column_bytes(stmt, column)),
        encoding: NSUTF8StringEncoding
      ) as? String
    default:
      return nil
    }
  }

  static func errorCodesAndMessage(fromSqlite db: OpaquePointer) -> UpdatesDatabaseUtilsErrorInfo {
    let code = sqlite3_errcode(db)
    let extendedCode = sqlite3_extended_errcode(db)
    let message = String(cString: sqlite3_errmsg(db))
    return UpdatesDatabaseUtilsErrorInfo(code: Int(code), extendedCode: Int(extendedCode), message: message)
  }

  static func date(fromUnixTimeMilliseconds number: NSNumber) -> Date {
    return Date(timeIntervalSince1970: number.doubleValue / 1000)
  }
}
