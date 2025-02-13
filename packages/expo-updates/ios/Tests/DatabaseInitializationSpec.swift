//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore
#if canImport(sqlite3)
import sqlite3
#else
import SQLite3
#endif

@testable import EXUpdates

let UpdatesDatabaseV4Schema = """
  CREATE TABLE "updates" (
    "id"  BLOB UNIQUE,
    "scope_key"  TEXT NOT NULL,
    "commit_time"  INTEGER NOT NULL,
    "runtime_version"  TEXT NOT NULL,
    "launch_asset_id" INTEGER,
    "metadata"  TEXT,
    "status"  INTEGER NOT NULL,
    "keep"  INTEGER NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
  );
  CREATE TABLE "assets" (
    "id"  INTEGER PRIMARY KEY AUTOINCREMENT,
    "url"  TEXT,
    "key"  TEXT NOT NULL UNIQUE,
    "headers"  TEXT,
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

let UpdatesDatabaseV5Schema = """
  CREATE TABLE "updates" (
    "id"  BLOB UNIQUE,
    "scope_key"  TEXT NOT NULL,
    "commit_time"  INTEGER NOT NULL,
    "runtime_version"  TEXT NOT NULL,
    "launch_asset_id" INTEGER,
    "metadata"  TEXT,
    "status"  INTEGER NOT NULL,
    "keep"  INTEGER NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
  );
  CREATE TABLE "assets" (
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

let UpdatesDatabaseV6Schema = """
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
    PRIMARY KEY("id"),
    FOREIGN KEY("launch_asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
  );
  CREATE TABLE "assets" (
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

let UpdatesDatabaseV7Schema = """
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

let UpdatesDatabaseV8Schema = """
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

let UpdatesDatabaseV9Schema = """
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

class UpdatesDatabaseInitializationSpec : ExpoSpec {
  override class func spec() {
    var testDatabaseDir: URL!

    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")

      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }
    }

    describe("database persistence") {
      it("persists") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          logger: UpdatesLogger()
        )

        // insert some test data
        let insertSql = """
          INSERT INTO "assets" ("url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion")
            VALUES (NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql: insertSql, withArgs: nil, onDatabase: db)

        // mimic the app closing and reopening
        sqlite3_close(db)
        let newDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          logger: UpdatesLogger()
        )

        // ensure the data is still there
        let selectSql = "SELECT * FROM `assets` WHERE `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        let rows = try! UpdatesDatabaseUtils.execute(sql: selectSql, withArgs: nil, onDatabase: newDb)
        expect(rows.count) == 1
        expect((rows[0]["id"] as? NSNumber)?.intValue) == 1
      }
    }

    describe("migrations") {
      it("migrates 4 to latest") {
        // this test just does some simple data validation to make sure the database persists across all migrations
        // individual migrations are tested in more detail individually
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV4Schema,
          filename: "expo-v4.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        let insertUpdatesSql = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","metadata","status","keep") VALUES
            (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{"metadata":{"updateGroup":"34993d39-57e6-46cf-8fa2-eba836f40828","branchName":"rollout"}}',1,1),
            (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);
        """
        let insertUpdatesAssetsSql = """
          INSERT INTO "updates_assets" ("update_id","asset_id") VALUES
            (X'8C263F9DE3FF48888496E3244C788661',2),
            (X'8C263F9DE3FF48888496E3244C788661',3),
            (X'594100ea066e4804b5c7c907c773f980',4);
        """

        _ = try! UpdatesDatabaseUtils.execute(sql: insertAssetsSql, withArgs: nil, onDatabase: db)
        _ = try! UpdatesDatabaseUtils.execute(sql: insertUpdatesSql, withArgs: nil, onDatabase: db)
        _ = try! UpdatesDatabaseUtils.execute(sql: insertUpdatesAssetsSql, withArgs: nil, onDatabase: db)
        sqlite3_close(db)

        // initialize without specifying migrations in order to run them all
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          logger: UpdatesLogger()
        )

        // verify data integrity
        let updatesSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql1, withArgs:nil, onDatabase:migratedDb).count) == 1

        // expect the second update to have been deleted since it didn't have a manifest
        let updatesSql2 = "SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql2, withArgs:nil, onDatabase:migratedDb).count) == 0

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        let updatesAssetsSql1 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1

        // this asset should be deleted by foreign key constraint since its update had a null manifest and was deleted
        let updatesAssetsSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 0

        // make sure multiple migrations are running
        let lastAccessedSql = "SELECT DISTINCT `last_accessed` FROM `updates` WHERE `last_accessed` IS NOT NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:lastAccessedSql, withArgs:nil, onDatabase:migratedDb).count) == 1
        let successfulLaunchCountSql = "SELECT * FROM `updates` WHERE `successful_launch_count` = 1"
        expect(try! UpdatesDatabaseUtils.execute(sql:successfulLaunchCountSql, withArgs:nil, onDatabase:migratedDb).count) == 1
      }

      it("migrates 4 to 5") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV4Schema,
          filename: "expo-v4.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        let insertUpdatesSql = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","metadata","status","keep") VALUES
          (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{"metadata":{"updateGroup":"34993d39-57e6-46cf-8fa2-eba836f40828","branchName":"rollout"}}',1,1),
          (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);
        """
        let insertUpdatesAssetsSql = """
          INSERT INTO "updates_assets" ("update_id","asset_id") VALUES
            (X'8C263F9DE3FF48888496E3244C788661',2),
            (X'8C263F9DE3FF48888496E3244C788661',3),
            (X'594100ea066e4804b5c7c907c773f980',4);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesAssetsSql, withArgs:nil, onDatabase:db)

        sqlite3_close(db)

        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(inDirectory: testDatabaseDir, migrations: [UpdatesDatabaseMigration4To5()], logger: UpdatesLogger())

        // verify data integrity
        let updatesSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesSql2 = "SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql2, withArgs:nil, onDatabase:migratedDb).count) == 1

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        let updatesAssetsSql1 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure we can insert multiple assets with null keys
        let nullInsertSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (5,NULL,NULL,NULL,'js',NULL,1614137406589,'bundle-1614137401951','1234',0,0),\
            (6,NULL,NULL,NULL,'js',NULL,1614137406580,'bundle-1614137401952','5678',0,0);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:nullInsertSql, withArgs:nil, onDatabase:migratedDb)

        // make sure foreign key constraint still works
        let foreignKeyInsertSql = "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 5)"
        let foreignKeySelectSql = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5"
        _ = try! UpdatesDatabaseUtils.execute(sql:foreignKeyInsertSql, withArgs:nil, onDatabase:migratedDb)
        expect(try! UpdatesDatabaseUtils.execute(sql:foreignKeySelectSql, withArgs:nil, onDatabase:migratedDb).count) == 1

        let foreignKeyInsertBadSql = "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 13)"

        expect {
          try UpdatesDatabaseUtils.execute(sql:foreignKeyInsertBadSql, withArgs:nil, onDatabase:migratedDb)
        }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
          expect(error.info?.extendedCode) == 787
        })

        // test on delete cascade
        let deleteSql = "DELETE FROM `assets` WHERE `id` = 5"
        let selectDeletedSql = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5"
        _ = try! UpdatesDatabaseUtils.execute(sql:deleteSql, withArgs:nil, onDatabase:migratedDb)
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql, withArgs:nil, onDatabase:migratedDb).count) == 0
      }


      it("migrates 5 to 6") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV5Schema,
          filename: "expo-v5.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        let insertUpdatesSql = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","metadata","status","keep") VALUES
            (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\\"metadata\\":{\\"updateGroup\\":\\"34993d39-57e6-46cf-8fa2-eba836f40828\\",\\"branchName\\":\\"rollout\\"}}',1,1),
            (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);
        """
        let insertUpdatesAssetsSql = """
          INSERT INTO "updates_assets" ("update_id","asset_id") VALUES
            (X'8C263F9DE3FF48888496E3244C788661',2),
            (X'8C263F9DE3FF48888496E3244C788661',3),
            (X'594100ea066e4804b5c7c907c773f980',4);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesAssetsSql, withArgs:nil, onDatabase:db)

        sqlite3_close(db)

        // initialize a new database object the normal way and run migrations
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          migrations: [UpdatesDatabaseMigration5To6()],
          logger: UpdatesLogger()
        )

        // verify data integrity
        let updatesSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesSql2 = "SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql2, withArgs:nil, onDatabase:migratedDb).count) == 1

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        let updatesAssetsSql1 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure metadata -> manifest column rename worked
        let updatesNonNullManifestSql = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `manifest` = '{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesNonNullManifestSql, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure last_accessed column was filled in appropriately (all existing updates have the same last_accessed time)
        let lastAccessedSql1 = "SELECT DISTINCT last_accessed FROM `updates`"
        expect(try! UpdatesDatabaseUtils.execute(sql:lastAccessedSql1, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure we can add new updates with different last_accessed times
        let lastAccessedSql2 = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep", "last_accessed") VALUES
            (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',NULL,NULL,1,1,1619647642456)
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:lastAccessedSql2, withArgs:nil, onDatabase:migratedDb)
        let lastAccessedSql3 = "SELECT DISTINCT last_accessed FROM `updates`"
        expect(try! UpdatesDatabaseUtils.execute(sql:lastAccessedSql3, withArgs:nil, onDatabase:migratedDb).count) == 2

        // make sure foreign key constraints still work

        // try to insert an update with a non-existent launch asset id (47)
        let foreignKeyInsertBadSql1 = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep", "last_accessed") VALUES  (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456)
        """
        expect {
          try UpdatesDatabaseUtils.execute(sql:foreignKeyInsertBadSql1, withArgs:nil, onDatabase:migratedDb)
        }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
          expect(error.info?.extendedCode) == 787
        })

        // try to insert an entry in updates_assets that references a nonexistent update
        let foreignKeyInsertBadSql2 = "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"
        expect {
          try UpdatesDatabaseUtils.execute(sql:foreignKeyInsertBadSql2, withArgs:nil, onDatabase:migratedDb)
        }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
          expect(error.info?.extendedCode) == 787
        })

        // test updates on delete cascade
        let deleteSql = "DELETE FROM `assets` WHERE `id` = 3"
        let selectDeletedSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'"
        _ = try! UpdatesDatabaseUtils.execute(sql:deleteSql, withArgs:nil, onDatabase:migratedDb)
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql1, withArgs:nil, onDatabase:migratedDb).count) == 0

        // test updates_assets on delete cascade
        // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
        let selectDeletedSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql2, withArgs:nil, onDatabase:migratedDb).count) == 0
        let selectDeletedSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql3, withArgs:nil, onDatabase:migratedDb).count) == 0
      }

      it("migrates 6 to 7") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV6Schema,
          filename: "expo-v6.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        let insertUpdatesSql = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep", "last_accessed") VALUES
            (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\\"metadata\\":{\\"updateGroup\\":\\"34993d39-57e6-46cf-8fa2-eba836f40828\\",\\"branchName\\":\\"rollout\\"}}',1,1,1619647642456),
            (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1,1619647642457);
        """
        let insertUpdatesAssetsSql = """
          INSERT INTO "updates_assets" ("update_id","asset_id") VALUES
            (X'8C263F9DE3FF48888496E3244C788661',2),
            (X'8C263F9DE3FF48888496E3244C788661',3),
            (X'594100ea066e4804b5c7c907c773f980',4);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesAssetsSql, withArgs:nil, onDatabase:db)

        sqlite3_close(db)

        // initialize a new database object the normal way and run migrations
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          migrations: [UpdatesDatabaseMigration6To7()],
          logger: UpdatesLogger()
        )

        // verify data integrity
        let updatesSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1 AND `last_accessed` = 1619647642456 AND `successful_launch_count` = 1 AND `failed_launch_count` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesSql2 = "SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1 AND `last_accessed` = 1619647642457 AND `successful_launch_count` = 1 AND `failed_launch_count` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql2, withArgs:nil, onDatabase:migratedDb).count) == 1

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        let updatesAssetsSql1 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure successful_launch_count and failed_launch_count columns were filled in properly
        let successfulLaunchCountSql = "SELECT DISTINCT `successful_launch_count` FROM `updates`"
        expect(try! UpdatesDatabaseUtils.execute(sql:successfulLaunchCountSql, withArgs:nil, onDatabase:migratedDb).count) == 1
        let failedLaunchCount = "SELECT DISTINCT `failed_launch_count` FROM `updates`"
        expect(try! UpdatesDatabaseUtils.execute(sql:failedLaunchCount, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure we can modify successful and failed launch counts
        let modifySuccessfulLaunchCountSql = "UPDATE `updates` SET `successful_launch_count` = 2 WHERE `id` = X'8C263F9DE3FF48888496E3244C788661';"
        let modifyFailedLaunchCountSql = "UPDATE `updates` SET `failed_launch_count` = 1 WHERE `id` = X'594100ea066e4804b5c7c907c773f980';"
        _ = try! UpdatesDatabaseUtils.execute(sql:modifySuccessfulLaunchCountSql, withArgs:nil, onDatabase:migratedDb)
        _ = try! UpdatesDatabaseUtils.execute(sql:modifyFailedLaunchCountSql, withArgs:nil, onDatabase:migratedDb)
        let checkFailedLaunchCountSql = "SELECT `id` FROM `updates` WHERE `failed_launch_count` > 0"
        expect(try! UpdatesDatabaseUtils.execute(sql:checkFailedLaunchCountSql, withArgs:nil, onDatabase:migratedDb).count) == 1

        // make sure foreign key constraints still work

        // try to insert an update with a non-existent launch asset id (47)
        let foreignKeyInsertBadSql1 = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep", "last_accessed","successful_launch_count","failed_launch_count") VALUES  (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456,0,0)
        """
        expect {
          try UpdatesDatabaseUtils.execute(sql:foreignKeyInsertBadSql1, withArgs:nil, onDatabase:migratedDb)
        }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
          expect(error.info?.extendedCode) == 787
        })

        // try to insert an entry in updates_assets that references a nonexistent update
        let foreignKeyInsertBadSql2 = "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"
        expect {
          try UpdatesDatabaseUtils.execute(sql:foreignKeyInsertBadSql2, withArgs:nil, onDatabase:migratedDb)
        }.to(throwError(errorType: UpdatesDatabaseUtilsError.self) { error in
          expect(error.info?.extendedCode) == 787
        })

        // test updates on delete cascade
        let deleteSql = "DELETE FROM `assets` WHERE `id` = 3"
        _ = try! UpdatesDatabaseUtils.execute(sql:deleteSql, withArgs:nil, onDatabase:migratedDb)
        let selectDeletedSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'"
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql1, withArgs:nil, onDatabase:migratedDb).count) == 0

        // test updates_assets on delete cascade
        // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
        let selectDeletedSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql2, withArgs:nil, onDatabase:migratedDb).count) == 0
        let selectDeletedSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:selectDeletedSql3, withArgs:nil, onDatabase:migratedDb).count) == 0
      }

      it("migrates 7 to 8") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV7Schema,
          filename: "expo-v7.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """

        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)


        sqlite3_close(db)

        // initialize a new database object the normal way and run migrations
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          migrations: [UpdatesDatabaseMigration7To8()],
          logger: UpdatesLogger()
        )

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1
      }

      it("migrates 8 to 9") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV8Schema,
          filename: "expo-v8.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion","extra_request_headers") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0,NULL),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0,NULL),
            (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0,NULL);
        """

        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)


        sqlite3_close(db)

        // initialize a new database object the normal way and run migrations
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          migrations: [UpdatesDatabaseMigration8To9()],
          logger: UpdatesLogger()
        )

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1
      }

      it("migrates 9 to 10") {
        let db = try! UpdatesDatabaseInitialization.initializeDatabase(
          withSchema: UpdatesDatabaseV9Schema,
          filename: "expo-v9.db",
          inDirectory: testDatabaseDir,
          shouldMigrate: false,
          migrations: [],
          logger: UpdatesLogger()
        )

        // insert test data
        let insertAssetsSql = """
          INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES
            (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),
            (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),
            (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);
        """
        let insertUpdatesSql = """
          INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep", "last_accessed") VALUES
            (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\\"metadata\\":{\\"updateGroup\\":\\"34993d39-57e6-46cf-8fa2-eba836f40828\\",\\"branchName\\":\\"rollout\\"}}',1,1,1619647642456),
            (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1,1619647642457);
        """
        let insertUpdatesAssetsSql = """
          INSERT INTO "updates_assets" ("update_id","asset_id") VALUES
            (X'8C263F9DE3FF48888496E3244C788661',2),
            (X'8C263F9DE3FF48888496E3244C788661',3),
            (X'594100ea066e4804b5c7c907c773f980',4);
        """
        _ = try! UpdatesDatabaseUtils.execute(sql:insertAssetsSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesSql, withArgs:nil, onDatabase:db)
        _ = try! UpdatesDatabaseUtils.execute(sql:insertUpdatesAssetsSql, withArgs:nil, onDatabase:db)

        sqlite3_close(db)

        // initialize a new database object the normal way and run migrations
        let migratedDb = try! UpdatesDatabaseInitialization.initializeDatabaseWithLatestSchema(
          inDirectory: testDatabaseDir,
          migrations: [UpdatesDatabaseMigration9To10()],
          logger: UpdatesLogger()
        )

        // verify data integrity
        let updatesSql1 = "SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql1, withArgs:nil, onDatabase:migratedDb).count) == 1

        // expect the second update to have been deleted since it didn't have a manifest
        let updatesSql2 = "SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesSql2, withArgs:nil, onDatabase:migratedDb).count) == 0

        let assetsSql1 = "SELECT * FROM `assets` WHERE `id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql2 = "SELECT * FROM `assets` WHERE `id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1
        let assetsSql3 = "SELECT * FROM `assets` WHERE `id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:assetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 1

        let updatesAssetsSql1 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql1, withArgs:nil, onDatabase:migratedDb).count) == 1
        let updatesAssetsSql2 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql2, withArgs:nil, onDatabase:migratedDb).count) == 1

        // this asset should be deleted by foreign key constraint since its update had a null manifest and was deleted
        let updatesAssetsSql3 = "SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4"
        expect(try! UpdatesDatabaseUtils.execute(sql:updatesAssetsSql3, withArgs:nil, onDatabase:migratedDb).count) == 0
      }
    }
  }
}
