package expo.modules.updates.db;

import android.content.Context;
import android.database.Cursor;
import android.util.Log;

import androidx.room.migration.Migration;
import expo.modules.updates.db.dao.AssetDao;
import expo.modules.updates.db.dao.JSONDataDao;
import expo.modules.updates.db.dao.UpdateDao;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.JSONDataEntity;
import expo.modules.updates.db.entity.UpdateAssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import androidx.annotation.NonNull;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;
import androidx.sqlite.db.SupportSQLiteDatabase;

import java.util.Date;

@Database(entities = {UpdateEntity.class, UpdateAssetEntity.class, AssetEntity.class, JSONDataEntity.class}, exportSchema = false, version = 7)
@TypeConverters({Converters.class})
public abstract class UpdatesDatabase extends RoomDatabase {

  private static UpdatesDatabase sInstance;

  private static final String DB_NAME = "updates.db";
  private static final String TAG = UpdatesDatabase.class.getSimpleName();

  public abstract UpdateDao updateDao();
  public abstract AssetDao assetDao();
  public abstract JSONDataDao jsonDataDao();

  public static synchronized UpdatesDatabase getInstance(Context context) {
    if (sInstance == null) {
      sInstance = Room.databaseBuilder(context, UpdatesDatabase.class, DB_NAME)
              .addMigrations(MIGRATION_4_5)
              .addMigrations(MIGRATION_5_6)
              .addMigrations(MIGRATION_6_7)
              .fallbackToDestructiveMigration()
              .allowMainThreadQueries()
              .build();
    }
    return sInstance;
  }

  static final Migration MIGRATION_4_5 = new Migration(4, 5) {
    @Override
    public void migrate(SupportSQLiteDatabase database) {
      // https://www.sqlite.org/lang_altertable.html#otheralter
      database.execSQL("PRAGMA foreign_keys=OFF");
      database.beginTransaction();
      try {
        try {
          database.execSQL("CREATE TABLE `new_assets` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `url` TEXT, `key` TEXT, `headers` TEXT, `type` TEXT NOT NULL, `metadata` TEXT, `download_time` INTEGER, `relative_path` TEXT, `hash` BLOB, `hash_type` INTEGER NOT NULL, `marked_for_deletion` INTEGER NOT NULL)");
          database.execSQL("INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)" +
            " SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`");
          database.execSQL("DROP TABLE `assets`");
          database.execSQL("ALTER TABLE `new_assets` RENAME TO `assets`");
          database.execSQL("CREATE UNIQUE INDEX `index_assets_key` ON `assets` (`key`)");
          database.setTransactionSuccessful();
        } finally {
          database.endTransaction();
        }
      } finally {
        database.execSQL("PRAGMA foreign_keys=ON");
      }
    }
  };

  static final Migration MIGRATION_5_6 = new Migration(5, 6) {
    @Override
    public void migrate(@NonNull SupportSQLiteDatabase database) {
      // https://www.sqlite.org/lang_altertable.html#otheralter
      database.execSQL("PRAGMA foreign_keys=OFF");
      database.beginTransaction();
      try {
        try {
          database.execSQL("CREATE TABLE `new_updates` (`id` BLOB NOT NULL, `scope_key` TEXT NOT NULL, `commit_time` INTEGER NOT NULL, `runtime_version` TEXT NOT NULL, `launch_asset_id` INTEGER, `manifest` TEXT, `status` INTEGER NOT NULL, `keep` INTEGER NOT NULL, `last_accessed` INTEGER NOT NULL, PRIMARY KEY(`id`), FOREIGN KEY(`launch_asset_id`) REFERENCES `assets`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )");
          // insert current time as lastAccessed date for all existing updates
          long currentTime = new Date().getTime();
          database.execSQL("INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`)" +
                  " SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `metadata` AS `manifest`, `status`, `keep`, ?1 AS `last_accessed` FROM `updates`", new Object[]{currentTime});
          database.execSQL("DROP TABLE `updates`");
          database.execSQL("ALTER TABLE `new_updates` RENAME TO `updates`");
          database.execSQL("CREATE INDEX `index_updates_launch_asset_id` ON `updates` (`launch_asset_id`)");
          database.execSQL("CREATE UNIQUE INDEX `index_updates_scope_key_commit_time` ON `updates` (`scope_key`, `commit_time`)");
          database.setTransactionSuccessful();
        } finally {
          database.endTransaction();
        }
      } finally {
        database.execSQL("PRAGMA foreign_keys=ON");
      }
    }
  };

  /**
   * Make the `assets` table `type` column nullable
   */
  static final Migration MIGRATION_6_7 = new Migration(6, 7) {
    @Override
    public void migrate(@NonNull SupportSQLiteDatabase database) {
      // https://www.sqlite.org/lang_altertable.html#otheralter
      database.execSQL("PRAGMA foreign_keys=OFF");
      database.beginTransaction();
      try {
        try {
           database.execSQL("CREATE TABLE IF NOT EXISTS `new_assets` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `url` TEXT, `key` TEXT, `headers` TEXT, `type` TEXT, `metadata` TEXT, `download_time` INTEGER, `relative_path` TEXT, `hash` BLOB, `hash_type` INTEGER NOT NULL, `marked_for_deletion` INTEGER NOT NULL)");
           database.execSQL("INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)" +
                                              " SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`");
           database.execSQL("DROP TABLE `assets`");
           database.execSQL("ALTER TABLE `new_assets` RENAME TO `assets`");
           database.execSQL("CREATE UNIQUE INDEX `index_assets_key` ON `assets` (`key`)");

           database.setTransactionSuccessful();
        } finally {
          database.endTransaction();
        }
      } finally {
        database.execSQL("PRAGMA foreign_keys=ON");
      }
    }
  };
}
