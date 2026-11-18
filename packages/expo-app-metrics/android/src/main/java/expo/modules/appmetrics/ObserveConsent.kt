package expo.modules.appmetrics

import android.content.Context
import android.util.Log
import java.io.FileNotFoundException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Whether the user consented to Observe collecting data. While not granted, app metrics stores
 * nothing and Observe sends nothing.
 */
object ObserveConsent {
  // Granted until the application start hook calls `load`.
  @Volatile
  var isGranted: Boolean = true
    private set

  /** Reads the consent value from the app config embedded in the app. */
  fun load(context: Context) {
    isGranted = resolve(readEmbeddedAppConfig(context))
  }

  // TODO(ENG-29293): Take the already parsed config when expo-constants has a public reader.
  /** Consent from the `extra.eas.observe.consent` key of the app config JSON, granted when the key is missing. */
  internal fun resolve(appConfig: String?): Boolean {
    val consent = (appConfig?.let { runCatching { Json.parseToJsonElement(it) }.getOrNull() } as? JsonObject)
      ?.let { it["extra"] as? JsonObject }
      ?.let { it["eas"] as? JsonObject }
      ?.let { it["observe"] as? JsonObject }
      ?.get("consent")
      ?: return true
    val value = (consent as? JsonPrimitive)?.takeIf { it.isString }?.content
    if (value != GRANTED && value != NOT_GRANTED) {
      Log.w(
        TAG,
        "[AppMetrics] The app config value `extra.eas.observe.consent` is $consent, which is not " +
          "'granted' or 'not-granted', so Observe stays inactive. Set it to 'granted' or 'not-granted'."
      )
    }
    return value == GRANTED
  }

  private const val GRANTED = "granted"
  private const val NOT_GRANTED = "not-granted"

  // TODO(ENG-29293): Use a public reader from expo-constants when it exists.
  // `load` runs before the Expo modules start, so read the asset that expo-constants reads.
  private fun readEmbeddedAppConfig(context: Context): String? =
    try {
      context.assets.open("app.config").bufferedReader().use { it.readText() }
    } catch (_: FileNotFoundException) {
      null
    } catch (e: Exception) {
      Log.w(TAG, "[AppMetrics] Failed to read the embedded app config", e)
      null
    }
}
