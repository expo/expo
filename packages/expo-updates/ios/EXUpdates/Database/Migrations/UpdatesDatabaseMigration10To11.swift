// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif

internal final class UpdatesDatabaseMigration10To11: UpdatesDatabaseMigration {
  private(set) var filename: String = "expo-v10.db"

  func runMigration(onDatabase db: OpaquePointer) throws {
    let sql = """
      ALTER TABLE "updates" ADD COLUMN "from_override" INTEGER NOT NULL DEFAULT 0
    """

    guard sqlite3_exec(db, String(sql.utf8), nil, nil, nil) == SQLITE_OK else {
      throw UpdatesDatabaseMigrationError.migrationSQLError
    }
  }
}
