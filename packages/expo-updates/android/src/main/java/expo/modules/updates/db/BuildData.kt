package expo.modules.updates.db

import android.net.Uri
import expo.modules.jsonutils.getNullable
import expo.modules.updates.UpdatesConfiguration
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
 * So far we only know that `releaseChannel` and
 * `requestHeaders[expo-channel-name]` are dangerous to change, but have
 * included a few more that both seem unlikely to change (so we clear
 * the updates cache rarely) and likely to
 * cause bugs when they do. The tracked fields are:
 *
 *   UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY
 *   UPDATES_CONFIGURATION_UPDATE_URL_KEY
 *
 * and all of the values in json
 *
 *   UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY
 */
object BuildData {
  private var staticBuildDataKey = "staticBuildData"

  fun ensureBuildDataIsConsistent(
    updatesConfiguration: UpdatesConfiguration,
    database: UpdatesDatabase,
  ) {
    val scopeKey = updatesConfiguration.scopeKey
      ?: throw AssertionError("expo-updates is enabled, but no valid URL is configured in AndroidManifest.xml. If you are making a release build for the first time, make sure you have run `expo publish` at least once.")
    val buildJSON = getBuildDataFromDatabase(database, scopeKey)
    if (buildJSON == null) {
      setBuildDataInDatabase(database, updatesConfiguration)
    } else if (!isBuildDataConsistent(updatesConfiguration, buildJSON)) {
      clearAllUpdatesFromDatabase(database)
      setBuildDataInDatabase(database, updatesConfiguration)
    }
  }

  fun clearAllUpdatesFromDatabase(database: UpdatesDatabase) {
    val allUpdates = database.updateDao().loadAllUpdates()
    database.updateDao().deleteUpdates(allUpdates)
  }

  fun isBuildDataConsistent(
    updatesConfiguration: UpdatesConfiguration,
    databaseBuildData: JSONObject
  ): Boolean {
    val configBuildData = getBuildDataFromConfig(updatesConfiguration)

    val releaseChannelKey = UpdatesConfiguration.UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY
    val updateUrlKey = UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY
    val requestHeadersKey = UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY

    // check equality of the two JSONObjects. The build data object is string valued with the
    // exception of "requestHeaders" which is a string valued object.
    return mutableListOf<Boolean>().apply {
      add(databaseBuildData.getNullable<String>(releaseChannelKey) == configBuildData.get(releaseChannelKey))
      add(databaseBuildData.get(updateUrlKey).let { Uri.parse(it.toString()) } == configBuildData.get(updateUrlKey))

      // loop through keys from both requestHeaders objects.
      for (key in configBuildData.getJSONObject(requestHeadersKey).keys()) {
        add(databaseBuildData.getJSONObject(requestHeadersKey).getNullable<String>(key) == configBuildData.getJSONObject(requestHeadersKey).getNullable(key))
      }
      for (key in databaseBuildData.getJSONObject(requestHeadersKey).keys()) {
        add(databaseBuildData.getJSONObject(requestHeadersKey).getNullable<String>(key) == configBuildData.getJSONObject(requestHeadersKey).getNullable(key))
      }
    }.all { it }
  }

  fun setBuildDataInDatabase(
    database: UpdatesDatabase,
    updatesConfiguration: UpdatesConfiguration,
  ) {
    val buildDataJSON = getBuildDataFromConfig(updatesConfiguration)
    database.jsonDataDao()?.setJSONStringForKey(staticBuildDataKey, buildDataJSON.toString(), updatesConfiguration.scopeKey as String)
  }

  fun getBuildDataFromDatabase(database: UpdatesDatabase, scopeKey: String): JSONObject? {
    val buildJSONString = database.jsonDataDao()?.loadJSONStringForKey(staticBuildDataKey, scopeKey)
    return if (buildJSONString == null) null else JSONObject(buildJSONString)
  }

  private fun getBuildDataFromConfig(updatesConfiguration: UpdatesConfiguration): JSONObject {
    val requestHeadersJSON = JSONObject().apply {
      for ((key, value) in updatesConfiguration.requestHeaders) put(key, value)
    }
    val buildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY, updatesConfiguration.releaseChannel)
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, updatesConfiguration.updateUrl)
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, requestHeadersJSON)
    }
    return buildData
  }
}
