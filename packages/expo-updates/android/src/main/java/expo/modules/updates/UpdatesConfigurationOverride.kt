package expo.modules.updates

import android.content.Context
import android.net.Uri
import expo.modules.manifests.core.toMap
import org.json.JSONObject

/**
 * [UpdatesConfiguration] values set at runtime that override build-time configuration.
 */
data class UpdatesConfigurationOverride(
  val updateUrl: Uri,
  val requestHeaders: Map<String, String>
) {
  private fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("updateUrl", updateUrl.toString())
      put("requestHeaders", JSONObject(requestHeaders))
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
      with(prefs.edit()) {
        if (configOverride != null) {
          putString(UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE, configOverride.toJSONObject().toString())
        } else {
          remove(UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE)
        }
        apply()
      }
    }

    private fun fromJSONObject(json: JSONObject): UpdatesConfigurationOverride {
      val requestHeaders = json.getJSONObject("requestHeaders")
        .toMap()
        .mapValues { it.value.toString() }
      return UpdatesConfigurationOverride(
        updateUrl = Uri.parse(json.getString("updateUrl")),
        requestHeaders = requestHeaders
      )
    }
  }
}
