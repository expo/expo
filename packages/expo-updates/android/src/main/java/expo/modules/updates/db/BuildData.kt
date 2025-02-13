package expo.modules.updates.db

import expo.modules.manifests.core.toMap
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.dao.JSONDataDao
import expo.modules.updates.manifest.ManifestMetadata
import org.json.JSONObject

/**
 * The build data stored by the configuration is subject to change when
 * a user updates the binary.
 *
 * This can lead to inconsistent update loading behavior, for
 * example: https://github.com/expo/expo/issues/14372
 *
 * This singleton wipes the updates when any of the tracked build data
 * changes. This leaves the user in the same situation as a fresh install.
 *
 * So far we only know that `requestHeaders[expo-channel-name]` os dangerous to change, but have
 * included a few more that both seem unlikely to change (so we clear
 * the updates cache rarely) and likely to
 * cause bugs when they do. The tracked fields are:
 *
 *   UPDATES_CONFIGURATION_UPDATE_URL_KEY
 *
 * and all of the values in json
 *
 *   UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY
 */
object BuildData {
  fun ensureBuildDataIsConsistent(
    updatesConfiguration: UpdatesConfiguration,
    database: UpdatesDatabase
  ) {
    val scopeKey = updatesConfiguration.scopeKey
    val buildJSON = getBuildDataFromDatabase(database, scopeKey)
    if (buildJSON == null) {
      setBuildDataInDatabase(database, updatesConfiguration)
    } else if (!isBuildDataConsistent(updatesConfiguration, buildJSON)) {
      clearAllUpdatesFromDatabase(database)
      clearManifestMetadataFromDatabase(database)
      setBuildDataInDatabase(database, updatesConfiguration)
    }
  }

  fun clearAllUpdatesFromDatabase(database: UpdatesDatabase) {
    val allUpdates = database.updateDao().loadAllUpdates()
    database.updateDao().deleteUpdates(allUpdates)
  }

  fun clearManifestMetadataFromDatabase(database: UpdatesDatabase) {
    ManifestMetadata.clearMetadataForBuildDataClearOperation(database)
  }

  fun isBuildDataConsistent(
    updatesConfiguration: UpdatesConfiguration,
    databaseBuildData: JSONObject
  ): Boolean {
    val configBuildData = defaultBuildData + getBuildDataFromConfig(updatesConfiguration).toMap()
    val dbBuildData = defaultBuildData + databaseBuildData.toMap()
    return configBuildData == dbBuildData
  }

  fun setBuildDataInDatabase(
    database: UpdatesDatabase,
    updatesConfiguration: UpdatesConfiguration
  ) {
    val buildDataJSON = getBuildDataFromConfig(updatesConfiguration)
    database.jsonDataDao()?.setJSONStringForKey(
      JSONDataDao.JSONDataKey.STATIC_BUILD_DATA,
      buildDataJSON.toString(),
      updatesConfiguration.scopeKey
    )
  }

  fun getBuildDataFromDatabase(database: UpdatesDatabase, scopeKey: String): JSONObject? {
    val buildJSONString = database.jsonDataDao()?.loadJSONStringForKey(JSONDataDao.JSONDataKey.STATIC_BUILD_DATA, scopeKey)
    return if (buildJSONString == null) null else JSONObject(buildJSONString)
  }

  private fun getBuildDataFromConfig(updatesConfiguration: UpdatesConfiguration): JSONObject {
    val requestHeadersJSON = JSONObject().apply {
      for ((key, value) in updatesConfiguration.requestHeaders) put(key, value)
    }
    val buildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, updatesConfiguration.updateUrl.toString())
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, requestHeadersJSON)
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY, updatesConfiguration.hasEmbeddedUpdate)
    }
    return buildData
  }

  /**
   * Fallback data specifically for migration while database data doesn't have these keys
   */
  private val defaultBuildData = mapOf(
    UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY to true
  )
}
