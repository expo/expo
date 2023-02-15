package expo.modules.updates.manifest

import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import org.json.JSONObject
import java.util.*

/**
 * Utility methods for reading and writing JSON metadata from manifests (e.g. `serverDefinedHeaders`
 * and `manifestFilters`, both used for rollouts) to and from SQLite.
 */
object ManifestMetadata {
  private val TAG = ManifestMetadata::class.java.simpleName

  private const val MANIFEST_SERVER_DEFINED_HEADERS_KEY = "serverDefinedHeaders"
  private const val MANIFEST_FILTERS_KEY = "manifestFilters"

  private fun getJSONObject(
    key: String,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return try {
      val jsonString = database.jsonDataDao()!!
        .loadJSONStringForKey(key, configuration.scopeKey!!)
      if (jsonString != null) JSONObject(jsonString) else null
    } catch (e: Exception) {
      Log.e(TAG, "Error retrieving $key from database", e)
      null
    }
  }

  @JvmStatic fun getServerDefinedHeaders(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return getJSONObject(MANIFEST_SERVER_DEFINED_HEADERS_KEY, database, configuration)
  }

  fun getManifestFilters(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return getJSONObject(MANIFEST_FILTERS_KEY, database, configuration)
  }

  fun saveMetadata(
    updateManifest: UpdateManifest,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ) {
    val fieldsToSet = mutableMapOf<String, String>()
    if (updateManifest.serverDefinedHeaders != null) {
      fieldsToSet[MANIFEST_SERVER_DEFINED_HEADERS_KEY] = updateManifest.serverDefinedHeaders.toString()
    }
    if (updateManifest.manifestFilters != null) {
      fieldsToSet[MANIFEST_FILTERS_KEY] = updateManifest.manifestFilters.toString()
    }
    if (fieldsToSet.isNotEmpty()) {
      database.jsonDataDao()!!.setMultipleFields(fieldsToSet, configuration.scopeKey!!)
    }
  }
}
