//  Copyright © 2021 650 Industries. All rights reserved.

// swiftlint:disable line_length

import Foundation
import SQLite3

internal final class UpdatesDatabaseMigration4To5: UpdatesDatabaseMigration {
  private(set) var filename: String = "expo-v4.db"

  func runMigration(onDatabase db: OpaquePointer) throws {
    try db.withForeignKeysOff {
      try db.withTransaction { trx in
        try trx.safeExecOrRollback(sql: """
          CREATE TABLE "new_assets" (
            "id"  INTEGER PRIMARY KEY AUTOINCREMENT,
            "url"  TEXT,
            "key"  TEXT UNIQUE,
            "headers"  TEXT,
            "type"  TEXT NOT NULL,
            "metadata"  TEXT,
            "download_time"  INTEGER NOT NULL,
            "relative_path"  TEXT NOT NULL,
            "hash"  BLOB NOT NULL,
            "hash_type"  INTEGER NOT NULL,
            "marked_for_deletion"  INTEGER NOT NULL
          )
        """)

        try trx.safeExecOrRollback(sql: """
          INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)
            SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`
        """)

        try trx.safeExecOrRollback(sql: "DROP TABLE `assets`")
        try trx.safeExecOrRollback(sql: "ALTER TABLE `new_assets` RENAME TO `assets`")
      }
    }
  }
}
