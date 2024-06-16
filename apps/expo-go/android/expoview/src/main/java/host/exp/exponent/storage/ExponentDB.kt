// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.storage

import androidx.annotation.WorkerThread
import com.raizlabs.android.dbflow.annotation.Database
import com.raizlabs.android.dbflow.config.FlowManager
import com.raizlabs.android.dbflow.sql.language.SQLite
import com.raizlabs.android.dbflow.structure.database.transaction.QueryTransaction
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import org.json.JSONException
import org.json.JSONObject

@Database(version = ExponentDB.VERSION)
object ExponentDB {
  private val TAG = ExponentDB::class.java.simpleName

  const val NAME = "ExponentKernel"
  const val VERSION = 1

  @JvmStatic fun saveExperience(exponentDBObject: ExponentDBObject) {
    try {
      val experience = ExperienceDBObject(
        scopeKey = exponentDBObject.manifest.getScopeKey(),
        manifestUrl = exponentDBObject.manifestUrl,
        bundleUrl = exponentDBObject.bundleUrl,
        manifest = exponentDBObject.manifest.toString()
      )
      FlowManager.getDatabase(ExponentDB::class.java).transactionManager.saveQueue.add(experience)
    } catch (e: JSONException) {
      EXL.e(TAG, e.message)
    }
  }

  @JvmStatic fun experienceScopeKeyToExperience(
    experienceScopeKeyString: String,
    listener: ExperienceResultListener
  ) {
    SQLite.select()
      .from(ExperienceDBObject::class.java)
      .where(ExperienceDBObject_Table.id.`is`(experienceScopeKeyString))
      .async()
      .querySingleResultCallback { _: QueryTransaction<*>?, experienceDBObject: ExperienceDBObject? ->
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
      }.execute()
  }

  @WorkerThread
  @Throws(JSONException::class)
  @JvmStatic
  fun experienceScopeKeyToExperienceSync(experienceScopeKeyString: String): ExponentDBObject? {
    val experienceDBObject = SQLite.select()
      .from(ExperienceDBObject::class.java)
      .where(ExperienceDBObject_Table.id.`is`(experienceScopeKeyString))
      .querySingle() ?: return null
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
