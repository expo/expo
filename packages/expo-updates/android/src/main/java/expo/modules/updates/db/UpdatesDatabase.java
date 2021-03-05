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

@Database(entities = {UpdateEntity.class, UpdateAssetEntity.class, AssetEntity.class, JSONDataEntity.class}, exportSchema = false, version = 5)
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
}
