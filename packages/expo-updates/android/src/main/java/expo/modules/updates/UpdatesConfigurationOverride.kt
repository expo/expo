package expo.modules.updates

import android.content.Context
import android.net.Uri
import androidx.core.content.edit
import androidx.core.net.toUri
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.toMap
import org.json.JSONObject

/**
 * [UpdatesConfiguration] values set at runtime that override build-time configuration.
 */
data class UpdatesConfigurationOverride(
  val updateUrl: Uri?,
  val requestHeaders: Map<String, String>?
) {
  internal fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      updateUrl?.let {
        put("updateUrl", it.toString())
      }
      requestHeaders?.let {
        put("requestHeaders", JSONObject(it))
      }
    }
  }

  companion object {
    private const val UPDATES_PREFS_FILE = "dev.expo.updates.prefs"
    private const val UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE = "updatesConfigOverride"

    internal fun load(context: Context): UpdatesConfigurationOverride? {
      val configOverride =
        context.getSharedPreferences(UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
          ?.getString(UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE, null)
      return configOverride?.let {
        fromJSONObject(JSONObject(it))
      }
    }

    internal fun save(context: Context, configOverride: UpdatesConfigurationOverride?) {
      val prefs = context.getSharedPreferences(UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
      prefs.edit {
        if (configOverride != null) {
          putString(UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE, configOverride.toJSONObject().toString())
        } else {
          remove(UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE)
        }
      }
    }

    internal fun saveRequestHeaders(context: Context, requestHeaders: Map<String, String>?): UpdatesConfigurationOverride? {
      val newOverride = (load(context) ?: UpdatesConfigurationOverride(null, null))
        .copy(requestHeaders = requestHeaders)
        .takeIf { it.updateUrl != null || it.requestHeaders != null }
      save(context, newOverride)
      return newOverride
    }

    internal fun fromJSONObject(json: JSONObject): UpdatesConfigurationOverride =
      UpdatesConfigurationOverride(
        updateUrl = json.getNullable<String>("updateUrl")
          ?.toUri(),

        requestHeaders = json.getNullable<JSONObject>("requestHeaders")
          ?.toMap()
          ?.mapValues { it.value.toString() }
      )
  }
}
