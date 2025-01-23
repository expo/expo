package expo.modules.updates

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.manifests.core.toMap
import org.json.JSONObject

/**
 * Runtime overridable config from build time [UpdatesConfiguration]
 */
data class UpdatesRuntimeOverrides(
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
    internal fun load(context: Context): UpdatesRuntimeOverrides? {
      val overrides =
        context.getSharedPreferences(UpdatesConfiguration.UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
          ?.getString(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_RUNTIME_OVERRIDES, null)
      return overrides?.let {
        fromJSONObject(JSONObject(it))
      }
    }

    internal fun save(context: Context, overrides: UpdatesRuntimeOverrides?) {
      val prefs = context.getSharedPreferences(UpdatesConfiguration.UPDATES_PREFS_FILE, Context.MODE_PRIVATE)
      with(prefs.edit()) {
        if (overrides != null) {
          putString(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_RUNTIME_OVERRIDES, overrides.toJSONObject().toString())
        } else {
          remove(UpdatesConfiguration.UPDATES_PREFS_KEY_UPDATES_RUNTIME_OVERRIDES)
        }
        apply()
      }
    }

    private fun fromJSONObject(json: JSONObject): UpdatesRuntimeOverrides {
      val requestHeaders = json.getJSONObject("requestHeaders")
        .toMap()
        .mapValues { it.value.toString() }
      return UpdatesRuntimeOverrides(
        url = Uri.parse(json.getString("url")),
        requestHeaders = requestHeaders
      )
    }
  }
}
