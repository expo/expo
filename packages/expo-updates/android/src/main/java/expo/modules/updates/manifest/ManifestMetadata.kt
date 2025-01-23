package expo.modules.updates.manifest

import android.util.Log
import expo.modules.jsonutils.require
import expo.modules.structuredheaders.Dictionary
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.dao.JSONDataDao
import org.json.JSONObject

/**
 * Utility methods for reading and writing JSON metadata from manifests (e.g. `serverDefinedHeaders`
 * and `manifestFilters`, both used for rollouts) to and from SQLite.
 */
object ManifestMetadata {
  private val TAG = ManifestMetadata::class.java.simpleName

  private fun getJSONObject(
    key: JSONDataDao.JSONDataKey,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return try {
      val jsonString = database.jsonDataDao()!!
        .loadJSONStringForKey(key, configuration.scopeKey)
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
    return getJSONObject(JSONDataDao.JSONDataKey.MANIFEST_SERVER_DEFINED_HEADERS, database, configuration)
  }

  fun getManifestFilters(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return getJSONObject(JSONDataDao.JSONDataKey.MANIFEST_FILTERS, database, configuration)
  }

  fun getExtraParams(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): Map<String, String>? {
    return getJSONObject(JSONDataDao.JSONDataKey.EXTRA_PARAMS, database, configuration)?.asStringStringMap()
  }

  fun setExtraParam(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    key: String,
    value: String?
  ) {
    // this is done within a transaction to ensure consistency
    database.jsonDataDao()!!.updateJSONStringForKey(JSONDataDao.JSONDataKey.EXTRA_PARAMS, configuration.scopeKey) { previousValue ->
      val jsonObject = previousValue?.let { JSONObject(it) }
      val extraParamsToWrite = (jsonObject?.asStringStringMap()?.toMutableMap() ?: mutableMapOf()).also {
        if (value != null) {
          it[key] = value
        } else {
          it.remove(key)
        }
      }.toMap()

      // ensure that this can be serialized to a structured-header dictionary
      // this will throw for invalid values
      Dictionary.valueOf(extraParamsToWrite.mapValues { elem -> StringItem.valueOf(elem.value) }).serialize()

      JSONObject(extraParamsToWrite).toString()
    }
  }

  fun saveMetadata(
    responseHeaderData: ResponseHeaderData,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ) {
    val fieldsToSet = mutableMapOf<JSONDataDao.JSONDataKey, String>()
    if (responseHeaderData.serverDefinedHeaders != null) {
      fieldsToSet[JSONDataDao.JSONDataKey.MANIFEST_SERVER_DEFINED_HEADERS] = responseHeaderData.serverDefinedHeaders.toString()
    }
    if (responseHeaderData.manifestFilters != null) {
      fieldsToSet[JSONDataDao.JSONDataKey.MANIFEST_FILTERS] = responseHeaderData.manifestFilters.toString()
    }
    if (fieldsToSet.isNotEmpty()) {
      database.jsonDataDao()!!.setMultipleFields(fieldsToSet, configuration.scopeKey)
    }
  }

  fun clearMetadataForBuildDataClearOperation(database: UpdatesDatabase) {
    database.jsonDataDao()!!.deleteJSONDataForKeysForAllScopeKeys(
      listOf(
        JSONDataDao.JSONDataKey.EXTRA_PARAMS,
        JSONDataDao.JSONDataKey.MANIFEST_SERVER_DEFINED_HEADERS,
        JSONDataDao.JSONDataKey.MANIFEST_FILTERS
      )
    )
  }

  private fun JSONObject.asStringStringMap(): Map<String, String> {
    return buildMap {
      this@asStringStringMap.keys().asSequence().forEach { key ->
        this[key] = this@asStringStringMap.require(key)
      }
    }
  }
}
