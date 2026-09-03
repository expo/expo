// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.storage

import android.content.Context
import androidx.annotation.WorkerThread
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.Executors

@Dao
interface ExperienceDao {
  @Query("SELECT * FROM ExperienceDBObject WHERE id = :scopeKey LIMIT 1")
  fun findByScopeKey(scopeKey: String): ExperienceDBObject?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insert(experience: ExperienceDBObject)
}

@Database(entities = [ExperienceDBObject::class], version = ExponentDB.VERSION, exportSchema = false)
abstract class ExponentKernelDatabase : RoomDatabase() {
  abstract fun experienceDao(): ExperienceDao
}

object ExponentDB {
  private val TAG = ExponentDB::class.java.simpleName

  const val NAME = "ExponentKernel"

  // v1 used DBFlow, v2 makes Room replace legacy files through the destructive fallback instead of failing schema validation.
  const val VERSION = 2

  private lateinit var database: ExponentKernelDatabase

  // Mirrors DBFlow's save queue: writes are serialized off the caller's thread.
  private val executor = Executors.newSingleThreadExecutor()

  @JvmStatic fun init(context: Context) {
    database = Room.databaseBuilder(context, ExponentKernelDatabase::class.java, "$NAME.db")
      .fallbackToDestructiveMigration()
      .build()
  }

  @JvmStatic fun saveExperience(exponentDBObject: ExponentDBObject) {
    executor.execute {
      try {
        val experience = ExperienceDBObject(
          scopeKey = exponentDBObject.manifest.getScopeKey(),
          manifestUrl = exponentDBObject.manifestUrl,
          bundleUrl = exponentDBObject.bundleUrl,
          manifest = exponentDBObject.manifest.toString()
        )
        database.experienceDao().insert(experience)
      } catch (e: JSONException) {
        EXL.e(TAG, e.message)
      }
    }
  }

  @JvmStatic fun experienceScopeKeyToExperience(
    experienceScopeKeyString: String,
    listener: ExperienceResultListener
  ) {
    executor.execute {
      val experienceDBObject = database.experienceDao().findByScopeKey(experienceScopeKeyString)
      if (experienceDBObject == null) {
        listener.onFailure()
      } else {
        try {
          listener.onSuccess(
            ExponentDBObject(
              experienceDBObject.manifestUrl!!,
              Manifest.fromManifestJson(JSONObject(experienceDBObject.manifest!!)),
              experienceDBObject.bundleUrl!!
            )
          )
        } catch (e: JSONException) {
          listener.onFailure()
        }
      }
    }
  }

  @WorkerThread
  @Throws(JSONException::class)
  @JvmStatic
  fun experienceScopeKeyToExperienceSync(experienceScopeKeyString: String): ExponentDBObject? {
    val experienceDBObject = database.experienceDao().findByScopeKey(experienceScopeKeyString)
      ?: return null
    return ExponentDBObject(
      experienceDBObject.manifestUrl!!,
      Manifest.fromManifestJson(JSONObject(experienceDBObject.manifest!!)),
      experienceDBObject.bundleUrl!!
    )
  }

  interface ExperienceResultListener {
    fun onSuccess(exponentDBObject: ExponentDBObject)
    fun onFailure()
  }
}
