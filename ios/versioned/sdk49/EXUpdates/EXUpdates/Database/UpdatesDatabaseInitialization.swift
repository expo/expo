//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable identifier_name

// sqlite db opening OpaquePointer doesn't work well with nullability
// swiftlint:disable force_unwrapping

import Foundation
import SQLite3

enum UpdatesDatabaseInitializationError: Error {
  case migrateAndRemoveOldDatabaseFailure
  case moveExistingCorruptedDatabaseFailure
  case openAfterMovingCorruptedDatabaseFailure
  case openInitialDatabaseOtherFailure
  case openDatabaseFalure
  case databseSchemaInitializationFailure
}

/**
 * Utility class that handles database initialization and migration.
 */
internal final class UpdatesDatabaseInitialization {
  private static let LatestFilename = "expo-v9.db"
  private static let LatestSchema = """
    CREATE TABLE "updates" (
      "id"  BLOB UNIQUE,
      "scope_key"  TEXT NOT NULL,
      "commit_time"  INTEGER NOT NULL,
      "runtime_version"  TEXT NOT NULL,
      "launch_asset_id" INTEGER,
      "manifest"  TEXT,
      "status"  INTEGER NOT NULL,
      "keep"  INTEGER NOT NULL,
      "last_accessed"  INTEGER NOT NULL,
      "successful_launch_count"  INTEGER NOT NULL DEFAULT 0,
      "failed_launch_count"  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY("id"),
      FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
    );
    CREATE TABLE "assets" (
      "id"  INTEGER PRIMARY KEY AUTOINCREMENT,
      "url"  TEXT,
      "key"  TEXT UNIQUE,
      "headers"  TEXT,
      "expected_hash"  TEXT,
      "extra_request_headers"  TEXT,
      "type"  TEXT NOT NULL,
      "metadata"  TEXT,
      "download_time"  INTEGER NOT NULL,
      "relative_path"  TEXT NOT NULL,
      "hash"  BLOB NOT NULL,
      "hash_type"  INTEGER NOT NULL,
      "marked_for_deletion"  INTEGER NOT NULL
    );
    CREATE TABLE "updates_assets" (
      "update_id"  BLOB NOT NULL,
      "asset_id" INTEGER NOT NULL,
      FOREIGN KEY("update_id") REFERENCES "updates"("id") ON DELETE CASCADE,
      FOREIGN KEY("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
    );
    CREATE TABLE "json_data" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "last_updated" INTEGER NOT NULL,
      "scope_key" TEXT NOT NULL
    );
    CREATE UNIQUE INDEX "index_updates_scope_key_commit_time" ON "updates" ("scope_key", "commit_time");
    CREATE INDEX "index_updates_launch_asset_id" ON "updates" ("launch_asset_id");
    CREATE INDEX "index_json_data_scope_key" ON "json_data" ("scope_key");
  """

  static func initializeDatabaseWithLatestSchema(inDirectory directory: URL) throws -> OpaquePointer {
    return try initializeDatabaseWithLatestSchema(
      inDirectory: directory,
      migrations: UpdatesDatabaseMigrationRegistry.migrations()
    )
  }

  static func initializeDatabaseWithLatestSchema(inDirectory directory: URL, migrations: [UpdatesDatabaseMigration]) throws -> OpaquePointer {
    return try initializeDatabase(
      withSchema: LatestSchema,
      filename: LatestFilename,
      inDirectory: directory,
      shouldMigrate: true,
      migrations: migrations
    )
  }

  static func initializeDatabase(
    withSchema schema: String,
    filename: String,
    inDirectory directory: URL,
    shouldMigrate: Bool,
    migrations: [UpdatesDatabaseMigration]
  ) throws -> OpaquePointer {
    let dbUrl = directory.appendingPathComponent(filename)
    var shouldInitializeDatabaseSchema = !FileManager.default.fileExists(atPath: dbUrl.path)

    let success = migrateDatabase(inDirectory: directory, migrations: migrations)
    if !success {
      if FileManager.default.fileExists(atPath: dbUrl.path) {
        do {
          try FileManager.default.removeItem(atPath: dbUrl.path)
        } catch {
          throw UpdatesDatabaseInitializationError.migrateAndRemoveOldDatabaseFailure
        }
      }
      shouldInitializeDatabaseSchema = true
    } else {
      shouldInitializeDatabaseSchema = false
    }

    var dbInit: OpaquePointer?
    let resultCode = sqlite3_open(String(dbUrl.path.utf8), &dbInit)

    guard var db = dbInit else {
      throw UpdatesDatabaseInitializationError.openDatabaseFalure
    }

    if resultCode != SQLITE_OK {
      NSLog("Error opening SQLite db: %@", [UpdatesDatabaseUtils.errorCodesAndMessage(fromSqlite: db).message])
      sqlite3_close(db)

      if resultCode == SQLITE_CORRUPT || resultCode == SQLITE_NOTADB {
        let archivedDbFilename = String(format: "%f-%@", Date().timeIntervalSince1970, filename)
        let destinationUrl = directory.appendingPathComponent(archivedDbFilename)
        do {
          try FileManager.default.moveItem(at: dbUrl, to: destinationUrl)
        } catch {
          throw UpdatesDatabaseInitializationError.moveExistingCorruptedDatabaseFailure
        }

        NSLog("Moved corrupt SQLite db to %@", archivedDbFilename)
        var dbInit2: OpaquePointer?
        guard sqlite3_open(String(dbUrl.absoluteString.utf8), &dbInit2) == SQLITE_OK else {
          throw UpdatesDatabaseInitializationError.openAfterMovingCorruptedDatabaseFailure
        }

        guard let db2 = dbInit2 else {
          throw UpdatesDatabaseInitializationError.openDatabaseFalure
        }
        db = db2

        shouldInitializeDatabaseSchema = true
      } else {
        throw UpdatesDatabaseInitializationError.openInitialDatabaseOtherFailure
      }
    }

    // foreign keys must be turned on explicitly for each database connection
    do {
      _ = try UpdatesDatabaseUtils.execute(sql: "PRAGMA foreign_keys=ON;", withArgs: nil, onDatabase: db)
    } catch {
      NSLog("Error turning on foreign key constraint: %@", [error.localizedDescription])
    }

    if shouldInitializeDatabaseSchema {
      guard sqlite3_exec(db, String(schema.utf8), nil, nil, nil) == SQLITE_OK else {
        throw UpdatesDatabaseInitializationError.databseSchemaInitializationFailure
      }
    }

    return db
  }

  private static func migrateDatabase(inDirectory directory: URL, migrations: [UpdatesDatabaseMigration]) -> Bool {
    let latestURL = directory.appendingPathComponent(LatestFilename)
    if FileManager.default.fileExists(atPath: latestURL.path) {
      return true
    }

    // find the newest database version that exists and try to migrate that file (ignore any older ones)
    var existingURL: URL?
    var startingMigrationIndex: Int = 0
    for (idx, migration) in migrations.enumerated() {
      let possibleURL = directory.appendingPathComponent(migration.filename)
      if FileManager.default.fileExists(atPath: possibleURL.path) {
        existingURL = possibleURL
        startingMigrationIndex = idx
        break
      }
    }

    guard let existingURL = existingURL else {
      return false
    }

    do {
      try FileManager.default.moveItem(atPath: existingURL.path, toPath: latestURL.path)
    } catch {
      NSLog("Migration failed: failed to rename database file")
      return false
    }

    var db: OpaquePointer?
    if sqlite3_open(String(latestURL.absoluteString.utf8), &db) != SQLITE_OK {
      NSLog("Error opening migrated SQLite db: %@", [UpdatesDatabaseUtils.errorCodesAndMessage(fromSqlite: db!).message])
      sqlite3_close(db)
      return false
    }

    for index in startingMigrationIndex..<migrations.count {
      let migration = migrations[index]
      do {
        try migration.runMigration(onDatabase: db!)
      } catch {
        NSLog("Error migrating SQLite db: %@", [UpdatesDatabaseUtils.errorCodesAndMessage(fromSqlite: db!).message])
        sqlite3_close(db)
        return false
      }
    }

    // migration was successful
    sqlite3_close(db)
    return true
  }
}
