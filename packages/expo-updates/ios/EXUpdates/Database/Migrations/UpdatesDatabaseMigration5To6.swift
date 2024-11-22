//  Copyright © 2021 650 Industries. All rights reserved.

// swiftlint:disable line_length

import Foundation
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif

internal final class UpdatesDatabaseMigration5To6: UpdatesDatabaseMigration {
  private(set) var filename: String = "expo-v5.db"

  func runMigration(onDatabase db: OpaquePointer) throws {
    try db.withForeignKeysOff {
      try db.withTransaction { trx in
        try trx.safeExecOrRollback(sql: """
          CREATE TABLE "new_updates" (
            "id"  BLOB UNIQUE,
            "scope_key"  TEXT NOT NULL,
            "commit_time"  INTEGER NOT NULL,
            "runtime_version"  TEXT NOT NULL,
            "launch_asset_id" INTEGER,
            "manifest"  TEXT,
            "status"  INTEGER NOT NULL,
            "keep"  INTEGER NOT NULL,
            "last_accessed"  INTEGER NOT NULL,
            PRIMARY KEY("id"),
            FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
          )
        """)

        // insert current time as lastAccessed date for all existing updates
        let currentTime = Date().timeIntervalSince1970 * 1000
        try trx.safeExecOrRollback(
          sql: "INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`) SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `metadata` AS `manifest`, `status`, `keep`, ?1 AS `last_accessed` FROM `updates`",
          args: [currentTime]
        )

        try trx.safeExecOrRollback(sql: "DROP TABLE `updates`")
        try trx.safeExecOrRollback(sql: "ALTER TABLE `new_updates` RENAME TO `updates`")
        try trx.safeExecOrRollback(sql: """
          CREATE UNIQUE INDEX "index_updates_scope_key_commit_time" ON "updates" ("scope_key", "commit_time")
        """)
        try trx.safeExecOrRollback(sql: """
          CREATE INDEX "index_updates_launch_asset_id" ON "updates" ("launch_asset_id")
        """)
      }
    }
  }
}

// swiftlint:enable line_length
