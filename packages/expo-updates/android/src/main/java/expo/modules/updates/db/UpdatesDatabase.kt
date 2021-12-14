package expo.modules.updates.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import expo.modules.updates.db.dao.AssetDao
import expo.modules.updates.db.dao.JSONDataDao
import expo.modules.updates.db.dao.UpdateDao
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.JSONDataEntity
import expo.modules.updates.db.entity.UpdateAssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import java.util.*

@Database(
  entities = [UpdateEntity::class, UpdateAssetEntity::class, AssetEntity::class, JSONDataEntity::class],
  exportSchema = false,
  version = 9
)
@TypeConverters(Converters::class)
abstract class UpdatesDatabase : RoomDatabase() {
  abstract fun updateDao(): UpdateDao
  abstract fun assetDao(): AssetDao
  abstract fun jsonDataDao(): JSONDataDao?

  companion object {
    private var instance: UpdatesDatabase? = null

    private const val DB_NAME = "updates.db"
    private val TAG = UpdatesDatabase::class.java.simpleName

    @JvmStatic @Synchronized
    fun getInstance(context: Context?): UpdatesDatabase {
      if (instance == null) {
        instance = Room.databaseBuilder(context!!, UpdatesDatabase::class.java, DB_NAME)
          .addMigrations(MIGRATION_4_5)
          .addMigrations(MIGRATION_5_6)
          .addMigrations(MIGRATION_6_7)
          .addMigrations(MIGRATION_7_8)
          .addMigrations(MIGRATION_8_9)
          .fallbackToDestructiveMigration()
          .allowMainThreadQueries()
          .build()
      }
      return instance!!
    }

    private fun SupportSQLiteDatabase.runInTransactionWithForeignKeysOff(block: SupportSQLiteDatabase.() -> Unit) {
      // https://www.sqlite.org/lang_altertable.html#otheralter
      try {
        execSQL("PRAGMA foreign_keys=OFF")
        beginTransaction()
        try {
          block()
          setTransactionSuccessful()
        } finally {
          endTransaction()
        }
      } finally {
        execSQL("PRAGMA foreign_keys=ON")
      }
    }

    val MIGRATION_4_5: Migration = object : Migration(4, 5) {
      override fun migrate(database: SupportSQLiteDatabase) {
        database.runInTransactionWithForeignKeysOff {
          execSQL("CREATE TABLE `new_assets` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `url` TEXT, `key` TEXT, `headers` TEXT, `type` TEXT NOT NULL, `metadata` TEXT, `download_time` INTEGER, `relative_path` TEXT, `hash` BLOB, `hash_type` INTEGER NOT NULL, `marked_for_deletion` INTEGER NOT NULL)")
          execSQL(
            "INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)" +
              " SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`"
          )
          execSQL("DROP TABLE `assets`")
          execSQL("ALTER TABLE `new_assets` RENAME TO `assets`")
          execSQL("CREATE UNIQUE INDEX `index_assets_key` ON `assets` (`key`)")
        }
      }
    }

    val MIGRATION_5_6: Migration = object : Migration(5, 6) {
      override fun migrate(database: SupportSQLiteDatabase) {
        database.runInTransactionWithForeignKeysOff {
          execSQL("CREATE TABLE `new_updates` (`id` BLOB NOT NULL, `scope_key` TEXT NOT NULL, `commit_time` INTEGER NOT NULL, `runtime_version` TEXT NOT NULL, `launch_asset_id` INTEGER, `manifest` TEXT, `status` INTEGER NOT NULL, `keep` INTEGER NOT NULL, `last_accessed` INTEGER NOT NULL, PRIMARY KEY(`id`), FOREIGN KEY(`launch_asset_id`) REFERENCES `assets`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )")
          // insert current time as lastAccessed date for all existing updates
          val currentTime = Date().time
          execSQL(
            "INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`)" +
              " SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `metadata` AS `manifest`, `status`, `keep`, ?1 AS `last_accessed` FROM `updates`",
            arrayOf<Any>(currentTime)
          )
          execSQL("DROP TABLE `updates`")
          execSQL("ALTER TABLE `new_updates` RENAME TO `updates`")
          execSQL("CREATE INDEX `index_updates_launch_asset_id` ON `updates` (`launch_asset_id`)")
          execSQL("CREATE UNIQUE INDEX `index_updates_scope_key_commit_time` ON `updates` (`scope_key`, `commit_time`)")
        }
      }
    }

    /**
     * Make the `assets` table `type` column nullable
     */
    val MIGRATION_6_7: Migration = object : Migration(6, 7) {
      override fun migrate(database: SupportSQLiteDatabase) {
        database.runInTransactionWithForeignKeysOff {
          execSQL("CREATE TABLE IF NOT EXISTS `new_assets` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `url` TEXT, `key` TEXT, `headers` TEXT, `type` TEXT, `metadata` TEXT, `download_time` INTEGER, `relative_path` TEXT, `hash` BLOB, `hash_type` INTEGER NOT NULL, `marked_for_deletion` INTEGER NOT NULL)")
          execSQL(
            "INSERT INTO `new_assets` (`id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion`)" +
              " SELECT `id`, `url`, `key`, `headers`, `type`, `metadata`, `download_time`, `relative_path`, `hash`, `hash_type`, `marked_for_deletion` FROM `assets`"
          )
          execSQL("DROP TABLE `assets`")
          execSQL("ALTER TABLE `new_assets` RENAME TO `assets`")
          execSQL("CREATE UNIQUE INDEX `index_assets_key` ON `assets` (`key`)")
        }
      }
    }

    /**
     * Add the `successful_launch_count` and `failed_launch_count` columns to `updates`
     */
    val MIGRATION_7_8: Migration = object : Migration(7, 8) {
      override fun migrate(database: SupportSQLiteDatabase) {
        database.runInTransactionWithForeignKeysOff {
          execSQL("CREATE TABLE `new_updates` (`id` BLOB NOT NULL, `scope_key` TEXT NOT NULL, `commit_time` INTEGER NOT NULL, `runtime_version` TEXT NOT NULL, `launch_asset_id` INTEGER, `manifest` TEXT, `status` INTEGER NOT NULL, `keep` INTEGER NOT NULL, `last_accessed` INTEGER NOT NULL, `successful_launch_count` INTEGER NOT NULL DEFAULT 0, `failed_launch_count` INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(`id`), FOREIGN KEY(`launch_asset_id`) REFERENCES `assets`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )")

          // insert `1` for successful_launch_count for all existing updates
          // to make sure we don't roll back past them
          execSQL(
            "INSERT INTO `new_updates` (`id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`, `successful_launch_count`, `failed_launch_count`)" +
              " SELECT `id`, `scope_key`, `commit_time`, `runtime_version`, `launch_asset_id`, `manifest`, `status`, `keep`, `last_accessed`, 1 AS `successful_launch_count`, 0 AS `failed_launch_count` FROM `updates`"
          )
          execSQL("DROP TABLE `updates`")
          execSQL("ALTER TABLE `new_updates` RENAME TO `updates`")
          execSQL("CREATE INDEX `index_updates_launch_asset_id` ON `updates` (`launch_asset_id`)")
          execSQL("CREATE UNIQUE INDEX `index_updates_scope_key_commit_time` ON `updates` (`scope_key`, `commit_time`)")
        }
      }
    }

    val MIGRATION_8_9: Migration = object : Migration(8, 9) {
      override fun migrate(database: SupportSQLiteDatabase) {
        database.runInTransactionWithForeignKeysOff {
          execSQL("ALTER TABLE `assets` ADD COLUMN `extra_request_headers` TEXT")
        }
      }
    }
  }
}
