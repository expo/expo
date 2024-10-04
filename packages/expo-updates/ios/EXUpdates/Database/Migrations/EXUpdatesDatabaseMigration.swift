//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
import SQLite3

public enum EXUpdatesDatabaseMigrationError: Error {
  case foreignKeysError
  case transactionError
  case migrationSQLError
}

public class TransactionExecutor {
  let db: OpaquePointer

  init(db: OpaquePointer) {
    self.db = db
  }

  public func safeExecOrRollback(sql: String) throws {
    guard sqlite3_exec(db, String(sql.utf8), nil, nil, nil) == SQLITE_OK else {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseMigrationError.migrationSQLError
    }
  }

  public func safeExecOrRollback(sql: String, args: [Any?]) throws {
    do {
      _ = try EXUpdatesDatabaseUtils.execute(sql: sql, withArgs: args, onDatabase: db)
    } catch {
      sqlite3_exec(db, "ROLLBACK;", nil, nil, nil)
      throw EXUpdatesDatabaseMigrationError.migrationSQLError
    }
  }
}

extension OpaquePointer {
  public func withForeignKeysOff<R>(_ body: () throws -> R) throws -> R {
    // https://www.sqlite.org/lang_altertable.html#otheralter
    guard sqlite3_exec(self, "PRAGMA foreign_keys=OFF;", nil, nil, nil) == SQLITE_OK else {
      throw EXUpdatesDatabaseMigrationError.foreignKeysError
    }
    defer {
      sqlite3_exec(self, "PRAGMA foreign_keys=ON;", nil, nil, nil)
    }

    return try body()
  }

  public func withTransaction<R>(_ body: (TransactionExecutor) throws -> R) throws -> R {
    guard sqlite3_exec(self, "BEGIN;", nil, nil, nil) == SQLITE_OK else {
      throw EXUpdatesDatabaseMigrationError.transactionError
    }

    let result = try body(TransactionExecutor(db: self))

    guard sqlite3_exec(self, "COMMIT;", nil, nil, nil) == SQLITE_OK else {
      throw EXUpdatesDatabaseMigrationError.transactionError
    }

    return result
  }
}

public protocol EXUpdatesDatabaseMigration {
  var filename: String { get }
  func runMigration(onDatabase db: OpaquePointer) throws
}
