//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif

internal enum UpdatesDatabaseMigrationError: Error, Sendable, LocalizedError {
  case foreignKeysError
  case transactionError
  case migrationSQLError

  var errorDescription: String? {
    switch self {
    case .foreignKeysError:
      return "SQLite error temporarily disabling foreign keys"
    case .transactionError:
      return "SQLite error beginning or ending transaction"
    case .migrationSQLError:
      return "SQLite error running migration"
    }
  }
}

internal final class TransactionExecutor {
  let db: OpaquePointer

  init(db: OpaquePointer) {
    self.db = db
  }

  func safeExecOrRollback(sql: String) throws {
    guard sqlite3_exec(db, String(sql.utf8), nil, nil, nil) == SQLITE_OK else {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseMigrationError.migrationSQLError
    }
  }

  func safeExecOrRollback(sql: String, args: [Any?]) throws {
    do {
      _ = try UpdatesDatabaseUtils.execute(sql: sql, withArgs: args, onDatabase: db)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw UpdatesDatabaseMigrationError.migrationSQLError
    }
  }
}

internal extension OpaquePointer {
  func withForeignKeysOff<R>(_ body: () throws -> R) throws -> R {
    // https://www.sqlite.org/lang_altertable.html#otheralter
    guard sqlite3_exec(self, "PRAGMA foreign_keys=OFF;", nil, nil, nil) == SQLITE_OK else {
      throw UpdatesDatabaseMigrationError.foreignKeysError
    }
    defer {
      sqlite3_exec(self, "PRAGMA foreign_keys=ON;", nil, nil, nil)
    }

    return try body()
  }

  func withTransaction<R>(_ body: (TransactionExecutor) throws -> R) throws -> R {
    guard sqlite3_exec(self, "BEGIN;", nil, nil, nil) == SQLITE_OK else {
      throw UpdatesDatabaseMigrationError.transactionError
    }

    let result = try body(TransactionExecutor(db: self))

    guard sqlite3_exec(self, "COMMIT;", nil, nil, nil) == SQLITE_OK else {
      throw UpdatesDatabaseMigrationError.transactionError
    }

    return result
  }
}

internal protocol UpdatesDatabaseMigration {
  var filename: String { get }
  func runMigration(onDatabase db: OpaquePointer) throws
}
