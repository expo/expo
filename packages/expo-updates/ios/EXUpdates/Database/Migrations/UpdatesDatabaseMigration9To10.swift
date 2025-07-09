//  Copyright © 2021 650 Industries. All rights reserved.

// swiftlint:disable line_length

import Foundation
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif

internal final class UpdatesDatabaseMigration9To10: UpdatesDatabaseMigration {
  private(set) var filename: String = "expo-v9.db"

  func runMigration(onDatabase db: OpaquePointer) throws {
    try db.withTransaction { trx in
      try trx.safeExecOrRollback(sql: """
        DELETE FROM "updates" WHERE "manifest" IS NULL
      """)
    }

    try db.withForeignKeysOff {
      try db.withTransaction { trx in
        try trx.safeExecOrRollback(sql: """
          CREATE TABLE "new_updates" (
            "id"  BLOB UNIQUE,
            "scope_key"  TEXT NOT NULL,
            "commit_time"  INTEGER NOT NULL,
            "runtime_version"  TEXT NOT NULL,
            "launch_asset_id" INTEGER,
            "manifest"  TEXT NOT NULL,
            "status"  INTEGER NOT NULL,
            "keep"  INTEGER NOT NULL,
            "last_accessed"  INTEGER NOT NULL,
            "successful_launch_count"  INTEGER NOT NULL DEFAULT 0,
            "failed_launch_count"  INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY("id"),
            FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
          )
        """)

        try trx.safeExecOrRollback(sql: "INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`, `successful_launch_count`, `failed_launch_count`) SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`, `successful_launch_count`, `failed_launch_count` FROM `updates` WHERE `manifest` IS NOT NULL")

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
