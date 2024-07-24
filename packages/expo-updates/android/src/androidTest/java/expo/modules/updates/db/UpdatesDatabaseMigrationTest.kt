package expo.modules.updates.db

import android.database.sqlite.SQLiteConstraintException
import androidx.room.testing.MigrationTestHelper
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesDatabaseMigrationTest {
  @JvmField @Rule
  var helper: MigrationTestHelper = MigrationTestHelper(
    InstrumentationRegistry.getInstrumentation(),
    UpdatesDatabase::class.java.canonicalName,
    FrameworkSQLiteOpenHelperFactory()
  )

  @Test
  @Throws(IOException::class)
  fun testMigrate4To5() {
    var db = helper.createDatabase(TEST_DB, 4)

    // db has schema version 4. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )
    db.execSQL(
      """INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","metadata","status","keep") VALUES (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{"metadata":{"updateGroup":"34993d39-57e6-46cf-8fa2-eba836f40828","branchName":"rollout"}}',1,1),
 (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1)"""
    )
    db.execSQL(
      """INSERT INTO "updates_assets" ("update_id","asset_id") VALUES (X'8C263F9DE3FF48888496E3244C788661',2),
 (X'8C263F9DE3FF48888496E3244C788661',3),
 (X'594100ea066e4804b5c7c907c773f980',4)"""
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 5 and provide
    // MIGRATION_4_5 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 5, true, UpdatesDatabase.MIGRATION_4_5)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorUpdates1 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'")
    Assert.assertEquals(1, cursorUpdates1.count.toLong())
    val cursorUpdates2 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'")
    Assert.assertEquals(1, cursorUpdates2.count.toLong())
    val cursorAssets1 =
      db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets1.count.toLong())
    val cursorAssets2 =
      db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets2.count.toLong())
    val cursorAssets3 =
      db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets3.count.toLong())
    val cursorUpdatesAssets1 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2")
    Assert.assertEquals(1, cursorUpdatesAssets1.count.toLong())
    val cursorUpdatesAssets2 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3")
    Assert.assertEquals(1, cursorUpdatesAssets2.count.toLong())
    val cursorUpdatesAssets3 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4")
    Assert.assertEquals(1, cursorUpdatesAssets3.count.toLong())

    // make sure we can insert multiple assets with null keys
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (5,NULL,NULL,NULL,'js',NULL,1614137406589,'bundle-1614137401951',NULL,0,0),
 (6,NULL,NULL,NULL,'js',NULL,1614137406580,'bundle-1614137401952',NULL,0,0)"""
    )

    // make sure foreign key constraint still works
    db.execSQL("INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 5)")
    val cursorUpdatesAssets4 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5")
    Assert.assertEquals(1, cursorUpdatesAssets4.count.toLong())
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 13)"
      )
    )

    // test on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 5")
    val cursorUpdatesAssets6 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5")
    Assert.assertEquals(0, cursorUpdatesAssets6.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate5To6() {
    var db = helper.createDatabase(TEST_DB, 5)

    // db has schema version 5. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )
    db.execSQL(
      """INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","metadata","status","keep") VALUES (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1),
 (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1)"""
    )
    db.execSQL(
      """INSERT INTO "updates_assets" ("update_id","asset_id") VALUES (X'8C263F9DE3FF48888496E3244C788661',2),
 (X'8C263F9DE3FF48888496E3244C788661',3),
 (X'594100ea066e4804b5c7c907c773f980',4)"""
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 6 and provide
    // MIGRATION_5_6 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 6, true, UpdatesDatabase.MIGRATION_5_6)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorUpdates1 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1")
    Assert.assertEquals(1, cursorUpdates1.count.toLong())
    val cursorUpdates2 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1")
    Assert.assertEquals(1, cursorUpdates2.count.toLong())
    val cursorAssets1 =
      db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets1.count.toLong())
    val cursorAssets2 =
      db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets2.count.toLong())
    val cursorAssets3 =
      db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets3.count.toLong())
    val cursorUpdatesAssets1 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2")
    Assert.assertEquals(1, cursorUpdatesAssets1.count.toLong())
    val cursorUpdatesAssets2 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3")
    Assert.assertEquals(1, cursorUpdatesAssets2.count.toLong())
    val cursorUpdatesAssets3 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4")
    Assert.assertEquals(1, cursorUpdatesAssets3.count.toLong())

    // make sure metadata -> manifest column rename worked
    val cursorNonNullManifest =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `manifest` = '{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}'")
    Assert.assertEquals(1, cursorNonNullManifest.count.toLong())

    // make sure last_accessed column was filled in appropriately (all existing updates have the same last_accessed time)
    val cursorLastAccessed = db.query("SELECT DISTINCT last_accessed FROM `updates`")
    Assert.assertEquals(1, cursorLastAccessed.count.toLong())

    // make sure we can add new updates with different last_accessed times
    db.execSQL(
      "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
        " (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',NULL,NULL,1,1,1619647642456)"
    )
    val cursorLastAccessed2 = db.query("SELECT DISTINCT last_accessed FROM `updates`")
    Assert.assertEquals(2, cursorLastAccessed2.count.toLong())

    // make sure foreign key constraints still work

    // try to insert an update with a non-existent launch asset id (47)
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
          " (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456)"
      )
    )
    // try to insert an entry in updates_assets that references a nonexistent update
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"
      )
    )

    // test updates on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 3")
    val cursorUpdatesOnDelete =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'")
    Assert.assertEquals(0, cursorUpdatesOnDelete.count.toLong())

    // test updates_assets on delete cascade
    // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
    val cursorUpdatesAssetsOnDelete1 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2")
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete1.count.toLong())
    val cursorUpdatesAssetsOnDelete2 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3")
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete2.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate6To7() {
    var db = helper.createDatabase(TEST_DB, 6)
    db.execSQL("PRAGMA foreign_keys=ON")

    // db has schema version 6. insert some data using SQL queries.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (1,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (2,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (3,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )
    db.execSQL(
      "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
        " (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',1,NULL,1,1,1619647642456)"
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 7 and provide
    // MIGRATION_6_7 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 7, true, UpdatesDatabase.MIGRATION_6_7)
    db.execSQL("PRAGMA foreign_keys=ON")

    // Confirm that 'type' is now nullable.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (4,NULL,NULL,NULL,'png',NULL,1,NULL,NULL,0,0),
 (5,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,0)"""
    )
    val allAssets = db.query("SELECT * FROM `assets`")
    Assert.assertEquals(5, allAssets.count.toLong())
    val assetsWithNullType = db.query("SELECT * FROM `assets` WHERE `type` IS NULL")
    Assert.assertEquals(1, assetsWithNullType.count.toLong())
    val assetsWithNonNullType = db.query("SELECT * FROM `assets` WHERE `type` IS NOT NULL")
    Assert.assertEquals(4, assetsWithNonNullType.count.toLong())

    // check updates with were not deleted by foreign key CASCADE policy.
    val allUpdates = db.query("SELECT * FROM `updates`")
    Assert.assertEquals(1, allUpdates.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate7To8() {
    var db = helper.createDatabase(TEST_DB, 7)

    // db has schema version 7. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )
    db.execSQL(
      """INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep","last_accessed") VALUES (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1,1619647642456),
 (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1,1619647642457)"""
    )
    db.execSQL(
      """INSERT INTO "updates_assets" ("update_id","asset_id") VALUES (X'8C263F9DE3FF48888496E3244C788661',2),
 (X'8C263F9DE3FF48888496E3244C788661',3),
 (X'594100ea066e4804b5c7c907c773f980',4)"""
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 8 and provide
    // MIGRATION_7_8 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 8, true, UpdatesDatabase.MIGRATION_7_8)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorUpdates1 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1 AND `last_accessed` = 1619647642456 AND `successful_launch_count` = 1 AND `failed_launch_count` = 0")
    Assert.assertEquals(1, cursorUpdates1.count.toLong())
    val cursorUpdates2 =
      db.query("SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1 AND `last_accessed` = 1619647642457 AND `successful_launch_count` = 1 AND `failed_launch_count` = 0")
    Assert.assertEquals(1, cursorUpdates2.count.toLong())
    val cursorAssets1 =
      db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets1.count.toLong())
    val cursorAssets2 =
      db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets2.count.toLong())
    val cursorAssets3 =
      db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0")
    Assert.assertEquals(1, cursorAssets3.count.toLong())
    val cursorUpdatesAssets1 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2")
    Assert.assertEquals(1, cursorUpdatesAssets1.count.toLong())
    val cursorUpdatesAssets2 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3")
    Assert.assertEquals(1, cursorUpdatesAssets2.count.toLong())
    val cursorUpdatesAssets3 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4")
    Assert.assertEquals(1, cursorUpdatesAssets3.count.toLong())

    // make sure successful_launch_count and failed_launch_count columns were filled in properly
    val cursorDistinctSuccessfulLaunchCount =
      db.query("SELECT DISTINCT `successful_launch_count` FROM `updates`")
    Assert.assertEquals(1, cursorDistinctSuccessfulLaunchCount.count.toLong())
    val cursorDistinctFailedLaunchCount =
      db.query("SELECT DISTINCT `failed_launch_count` FROM `updates`")
    Assert.assertEquals(1, cursorDistinctFailedLaunchCount.count.toLong())

    // make sure we can modify successful and failed launch counts
    db.execSQL("UPDATE `updates` SET `successful_launch_count` = 2 WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'")
    val cursorModifySuccessfulLaunchCount = db.query("SELECT DISTINCT `successful_launch_count` FROM `updates`")
    Assert.assertEquals(2, cursorModifySuccessfulLaunchCount.count.toLong())
    db.execSQL("UPDATE `updates` SET `failed_launch_count` = 1 WHERE `id` = X'594100ea066e4804b5c7c907c773f980'")
    val cursorModifyFailedLaunchCount = db.query("SELECT `id` FROM `updates` WHERE `failed_launch_count` > 0")
    Assert.assertEquals(1, cursorModifyFailedLaunchCount.count.toLong())

    // make sure foreign key constraints still work

    // try to insert an update with a non-existent launch asset id (47)
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\",\"successful_launch_count\",\"failed_launch_count\") VALUES" +
          " (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456,0,0)"
      )
    )
    // try to insert an entry in updates_assets that references a nonexistent update
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"
      )
    )

    // test updates on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 3")
    val cursorUpdatesOnDelete =
      db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'")
    Assert.assertEquals(0, cursorUpdatesOnDelete.count.toLong())

    // test updates_assets on delete cascade
    // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
    val cursorUpdatesAssetsOnDelete1 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2")
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete1.count.toLong())
    val cursorUpdatesAssetsOnDelete2 =
      db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3")
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete2.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate8To9() {
    var db = helper.createDatabase(TEST_DB, 8)

    // db has schema version 8. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 9 and provide
    // MIGRATION_8_9 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 9, true, UpdatesDatabase.MIGRATION_8_9)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorAssets1 =
      db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL")
    Assert.assertEquals(1, cursorAssets1.count.toLong())
    val cursorAssets2 =
      db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL")
    Assert.assertEquals(1, cursorAssets2.count.toLong())
    val cursorAssets3 =
      db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL")
    Assert.assertEquals(1, cursorAssets3.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate9To10() {
    var db = helper.createDatabase(TEST_DB, 9)

    // db has schema version 9. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion","extra_request_headers") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0,NULL),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0,NULL),
 (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0,NULL)"""
    )

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 10 and provide
    // MIGRATION_9_10 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 10, true, UpdatesDatabase.MIGRATION_9_10)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorAssets1 =
      db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL")
    Assert.assertEquals(1, cursorAssets1.count.toLong())
    val cursorAssets2 =
      db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL")
    Assert.assertEquals(1, cursorAssets2.count.toLong())
    val cursorAssets3 =
      db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0 AND `extra_request_headers` IS NULL AND `expected_hash` IS NULL")
    Assert.assertEquals(1, cursorAssets3.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate10To11() {
    var db = helper.createDatabase(TEST_DB, 10)

    // db has schema version 10. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion","extra_request_headers","expected_hash") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0,NULL,'testhash2'),
    (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0,NULL,'testhash3'),
    (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0,NULL,'testhash4')"""
    )

    val cursorAssetsPrecondition1 = db.query("SELECT * FROM `assets`")
    Assert.assertEquals(3, cursorAssetsPrecondition1.count.toLong())
    val cursorAssetsPrecondition2 = db.query("SELECT * FROM `assets` WHERE `expected_hash` IS NULL")
    Assert.assertEquals(0, cursorAssetsPrecondition2.count.toLong())

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 11 and provide
    // MIGRATION_10_11 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 11, true, UpdatesDatabase.MIGRATION_10_11)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorAssets1 = db.query("SELECT * FROM `assets`")
    Assert.assertEquals(3, cursorAssets1.count.toLong())
    val cursorAssets2 = db.query("SELECT * FROM `assets` WHERE `expected_hash` IS NULL")
    Assert.assertEquals(3, cursorAssets2.count.toLong())
  }

  @Test
  @Throws(IOException::class)
  fun testMigrate11To12() {
    var db = helper.createDatabase(TEST_DB, 11)

    // db has schema version 11. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL(
      """INSERT INTO "assets" ("id","url","key","headers","type","metadata","download_time","relative_path","hash","hash_type","marked_for_deletion") VALUES (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),
 (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),
 (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)"""
    )
    db.execSQL(
      """INSERT INTO "updates" ("id","scope_key","commit_time","runtime_version","launch_asset_id","manifest","status","keep","last_accessed") VALUES (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1,1619647642456),
 (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1,1619647642457)"""
    )
    db.execSQL(
      """INSERT INTO "updates_assets" ("update_id","asset_id") VALUES (X'8C263F9DE3FF48888496E3244C788661',2),
 (X'8C263F9DE3FF48888496E3244C788661',3),
 (X'594100ea066e4804b5c7c907c773f980',4)"""
    )

    val cursorUpdatesBefore = db.query("SELECT * FROM `updates`")
    Assert.assertEquals(2, cursorUpdatesBefore.count.toLong())

    // Prepare for the next version.
    db.close()

    // Re-open the database with version 12 and provide
    // MIGRATION_11_12 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 12, true, UpdatesDatabase.MIGRATION_11_12)
    db.execSQL("PRAGMA foreign_keys=ON")

    // schema changes automatically verified, we just need to verify data integrity
    val cursorUpdates1 = db.query("SELECT * FROM `updates`")
    Assert.assertEquals(1, cursorUpdates1.count.toLong())

    // make sure foreign key constraints still work

    // try to insert an update with a non-existent launch asset id (47)
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\",\"successful_launch_count\",\"failed_launch_count\") VALUES" +
          " (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456,0,0)"
      )
    )
    // try to insert an entry in updates_assets that references a nonexistent update
    Assert.assertTrue(
      execSQLExpectingException(
        db,
        "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"
      )
    )
  }

  private fun execSQLExpectingException(db: SupportSQLiteDatabase, sql: String): Boolean {
    val fails: Boolean = try {
      db.execSQL(sql)
      false
    } catch (e: SQLiteConstraintException) {
      true
    }
    return fails
  }

  companion object {
    private const val TEST_DB = "migration-test.db"
  }
}
