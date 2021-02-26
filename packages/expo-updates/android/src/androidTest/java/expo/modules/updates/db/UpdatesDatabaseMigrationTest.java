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
  public void migrate4To5() throws IOException {
    SupportSQLiteDatabase db = helper.createDatabase(TEST_DB, 4);

    // db has schema version 4. insert some data using SQL queries.
    // cannot use DAO classes because they expect the latest schema.
    db.execSQL("INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES" +
      " (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,0,0),\n" +
      " (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871',NULL,0,0),\n" +
      " (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950',NULL,0,0)");
    db.execSQL("INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES" +
      " (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"updateMetadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"updateGroupCreatedAt\":\"2021-02-23T12:53:46.851Z\",\"branchName\":\"rollout\"}}',1,1),\n" +
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

    boolean fails;
    try {
      db.execSQL("INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 13)");
      fails = false;
    } catch (SQLiteConstraintException e) {
      fails = true;
    }
    Assert.assertTrue(fails);

    // test on delete cascade
    db.execSQL("DELETE FROM `assets` WHERE `id` = 5");
    Cursor cursorUpdatesAssets6 = db.query("SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5");
    Assert.assertEquals(0, cursorUpdatesAssets6.getCount());
  }
}
