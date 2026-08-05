// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SQLite3

public struct SQLiteError: Error, LocalizedError, Sendable {
  public let code: Int32
  public let message: String

  public var errorDescription: String? {
    return "SQLite error \(code): \(message)"
  }

  init(code: Int32, message: String) {
    self.code = code
    self.message = message
  }

  init(db: OpaquePointer?, code: Int32) {
    let message: String
    if let db {
      message = String(cString: sqlite3_errmsg(db))
    } else {
      message = "unknown error"
    }
    self.init(code: code, message: message)
  }
}
