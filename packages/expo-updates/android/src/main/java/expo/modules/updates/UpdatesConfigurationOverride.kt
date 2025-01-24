package expo.modules.updates

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.manifests.core.toMap
import org.json.JSONObject

/**
 * [UpdatesConfiguration] values set at runtime that override build-time configuration.
 */
data class UpdatesConfigurationOverride(
  @Field val url: Uri,
  @Field val requestHeaders: Map<String, String>
) : Record {
  private fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("url", url.toString())
      put("requestHeaders", JSONObject(requestHeaders))
    }
  }

  companion object {
    internal fun load(context: Context): UpdatesConfigurationOverride? {
      val configOverride =
        context.getSharedPreferences(UpdatesConfiguration.UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
          ?.getString(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE, null)
      return configOverride?.let {
        fromJSONObject(JSONObject(it))
      }
    }

    internal fun save(context: Context, configOverride: UpdatesConfigurationOverride?) {
      val prefs = context.getSharedPreferences(UpdatesConfiguration.UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
      with(prefs.edit()) {
        if (configOverride != null) {
          putString(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE, configOverride.toJSONObject().toString())
        } else {
          remove(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_CONFIGURATION_OVERRIDE)
        }
        apply()
      }
    }

    private fun fromJSONObject(json: JSONObject): UpdatesConfigurationOverride {
      val requestHeaders = json.getJSONObject("requestHeaders")
        .toMap()
        .mapValues { it.value.toString() }
      return UpdatesConfigurationOverride(
        url = Uri.parse(json.getString("url")),
        requestHeaders = requestHeaders
      )
    }
  }
}
