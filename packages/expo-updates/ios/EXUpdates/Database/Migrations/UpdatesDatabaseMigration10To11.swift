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
    try db.withTransaction { trx in
      try trx.safeExecOrRollback(sql: """
        ALTER TABLE "updates" ADD COLUMN "url" TEXT;
        ALTER TABLE "updates" ADD COLUMN "headers" TEXT;
      """)
    }
  }
}
