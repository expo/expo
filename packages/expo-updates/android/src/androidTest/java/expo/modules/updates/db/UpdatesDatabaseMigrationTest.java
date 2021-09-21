package expo.modules.updates.db;

import android.database.Cursor;
import android.database.sqlite.SQLiteConstraintException;

import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.IOException;

import androidx.room.testing.MigrationTestHelper;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;

@RunWith(AndroidJUnit4ClassRunner.class)
public class UpdatesDatabaseMigrationTest {
  private static final String TEST_DB = "migration-test.db";

  @Rule
  public MigrationTestHelper helper;

  public UpdatesDatabaseMigrationTest() {
    helper = new MigrationTestHelper(InstrumentationRegistry.getInstrumentation(),
      UpdatesDatabase.class.getCanonicalName(),
      new FrameworkSQLiteOpenHelperFactory());
  }

  @Test
  public void testMigrate4To5() throws IOException {
    SupportSQLiteDatabase db = helper.createDatabase(TEST_DB, 4);

    // db has schema version 4. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
      " (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),\n" +
      " (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),\n" +
      " (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)");
    db.execSQL("INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES" +
      " (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1),\n" +
      " (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1)");
    db.execSQL("INSERT INTO \"updates_assets\" (\"update_id\",\"asset_id\") VALUES" +
      " (X'8C263F9DE3FF48888496E3244C788661',2),\n" +
      " (X'8C263F9DE3FF48888496E3244C788661',3),\n" +
      " (X'594100ea066e4804b5c7c907c773f980',4)");

    // Prepare for the next version.
    db.close();

    // Re-open the database with version 5 and provide
    // MIGRATION_4_5 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 5, true, UpdatesDatabase.MIGRATION_4_5);

    db.execSQL("PRAGMA foreign_keys=ON");

    // schema changes automatically verified, we just need to verify data integrity
    Cursor cursorUpdates1 = db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'");
    Assert.assertEquals(1, cursorUpdates1.getCount());
    Cursor cursorUpdates2 = db.query("SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'");
    Assert.assertEquals(1, cursorUpdates2.getCount());

    Cursor cursorAssets1 = db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets1.getCount());
    Cursor cursorAssets2 = db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets2.getCount());
    Cursor cursorAssets3 = db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets3.getCount());

    Cursor cursorUpdatesAssets1 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2");
    Assert.assertEquals(1, cursorUpdatesAssets1.getCount());
    Cursor cursorUpdatesAssets2 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3");
    Assert.assertEquals(1, cursorUpdatesAssets2.getCount());
    Cursor cursorUpdatesAssets3 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4");
    Assert.assertEquals(1, cursorUpdatesAssets3.getCount());

    // make sure we can insert multiple assets with null keys
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
      " (5,NULL,NULL,NULL,'js',NULL,1614137406589,'bundle-1614137401951',NULL,0,0),\n" +
      " (6,NULL,NULL,NULL,'js',NULL,1614137406580,'bundle-1614137401952',NULL,0,0)");

    // make sure foreign key constraint still works
    db.execSQL("INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 5)");
    Cursor cursorUpdatesAssets4 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5");
    Assert.assertEquals(1, cursorUpdatesAssets4.getCount());

    Assert.assertTrue(execSQLExpectingException(db, "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 13)"));

    // test on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 5");
    Cursor cursorUpdatesAssets6 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5");
    Assert.assertEquals(0, cursorUpdatesAssets6.getCount());
  }

  @Test
  public void testMigrate5To6() throws IOException {
    SupportSQLiteDatabase db = helper.createDatabase(TEST_DB, 5);

    // db has schema version 5. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
            " (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),\n" +
            " (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),\n" +
            " (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)");
    db.execSQL("INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES" +
            " (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}',1,1),\n" +
            " (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1)");
    db.execSQL("INSERT INTO \"updates_assets\" (\"update_id\",\"asset_id\") VALUES" +
            " (X'8C263F9DE3FF48888496E3244C788661',2),\n" +
            " (X'8C263F9DE3FF48888496E3244C788661',3),\n" +
            " (X'594100ea066e4804b5c7c907c773f980',4)");

    // Prepare for the next version.
    db.close();

    // Re-open the database with version 6 and provide
    // MIGRATION_5_6 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 6, true, UpdatesDatabase.MIGRATION_5_6);

    db.execSQL("PRAGMA foreign_keys=ON");

    // schema changes automatically verified, we just need to verify data integrity
    Cursor cursorUpdates1 = db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1");
    Assert.assertEquals(1, cursorUpdates1.getCount());
    Cursor cursorUpdates2 = db.query("SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1");
    Assert.assertEquals(1, cursorUpdates2.getCount());

    Cursor cursorAssets1 = db.query("SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets1.getCount());
    Cursor cursorAssets2 = db.query("SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets2.getCount());
    Cursor cursorAssets3 = db.query("SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` IS NULL AND `hash_type` = 0 AND `marked_for_deletion` = 0");
    Assert.assertEquals(1, cursorAssets3.getCount());

    Cursor cursorUpdatesAssets1 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2");
    Assert.assertEquals(1, cursorUpdatesAssets1.getCount());
    Cursor cursorUpdatesAssets2 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3");
    Assert.assertEquals(1, cursorUpdatesAssets2.getCount());
    Cursor cursorUpdatesAssets3 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4");
    Assert.assertEquals(1, cursorUpdatesAssets3.getCount());

    // make sure metadata -> manifest column rename worked
    Cursor cursorNonNullManifest = db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `manifest` = '{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}'");
    Assert.assertEquals(1, cursorNonNullManifest.getCount());

    // make sure last_accessed column was filled in appropriately (all existing updates have the same last_accessed time)
    Cursor cursorLastAccessed = db.query("SELECT DISTINCT last_accessed FROM `updates`");
    Assert.assertEquals(1, cursorLastAccessed.getCount());

    // make sure we can add new updates with different last_accessed times
    db.execSQL("INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
            " (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',NULL,NULL,1,1,1619647642456)");
    Cursor cursorLastAccessed2 = db.query("SELECT DISTINCT last_accessed FROM `updates`");
    Assert.assertEquals(2, cursorLastAccessed2.getCount());

    // make sure foreign key constraints still work

    // try to insert an update with a non-existent launch asset id (47)
    Assert.assertTrue(execSQLExpectingException(db, "INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
            " (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456)"));
    // try to insert an entry in updates_assets that references a nonexistent update
    Assert.assertTrue(execSQLExpectingException(db, "INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)"));

    // test updates on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 3");
    Cursor cursorUpdatesOnDelete = db.query("SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'");
    Assert.assertEquals(0, cursorUpdatesOnDelete.getCount());

    // test updates_assets on delete cascade
    // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
    Cursor cursorUpdatesAssetsOnDelete1 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2");
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete1.getCount());
    Cursor cursorUpdatesAssetsOnDelete2 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3");
    Assert.assertEquals(0, cursorUpdatesAssetsOnDelete2.getCount());
  }

  @Test
  public void testMigrate6To7() throws IOException {
    SupportSQLiteDatabase db = helper.createDatabase(TEST_DB, 6);
    db.execSQL("PRAGMA foreign_keys=ON");

    // db has schema version 6. insert some data using SQL queries.
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
            " (1,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),\n" +
            " (2,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),\n" +
            " (3,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)");
    db.execSQL("INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES" +
            " (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',1,NULL,1,1,1619647642456)");

    // Prepare for the next version.
    db.close();

    // Re-open the database with version 7 and provide
    // MIGRATION_6_7 as the migration process.
    db = helper.runMigrationsAndValidate(TEST_DB, 7, true, UpdatesDatabase.MIGRATION_6_7);

    // Confirm that 'type' is now nullable.
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
            " (4,NULL,NULL,NULL,'png',NULL,1,NULL,NULL,0,0),\n" +
            " (5,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,0,0)");

    db.execSQL("PRAGMA foreign_keys=ON");

    Cursor allAssets = db.query("SELECT * FROM `assets`");
    Assert.assertEquals(5, allAssets.getCount());

    Cursor assetsWithNullType = db.query("SELECT * FROM `assets` WHERE `type` IS NULL");
    Assert.assertEquals(1, assetsWithNullType.getCount());

    Cursor assetsWithNonNullType = db.query("SELECT * FROM `assets` WHERE `type` IS NOT NULL");
    Assert.assertEquals(4, assetsWithNonNullType.getCount());

    // check updates with were not deleted by foreign key CASCADE policy.
    Cursor allUpdates = db.query("SELECT * FROM `updates`");
    Assert.assertEquals(1, allUpdates.getCount());
  }


  private boolean execSQLExpectingException(SupportSQLiteDatabase db, String sql) {
    boolean fails;
    try {
      db.execSQL(sql);
      fails = false;
    } catch (SQLiteConstraintException e) {
      fails = true;
    }
    return fails;
  }
}
