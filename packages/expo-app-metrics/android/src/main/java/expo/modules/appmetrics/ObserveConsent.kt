package expo.modules.appmetrics

import android.content.Context
import android.util.Log
import androidx.core.content.edit
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import expo.modules.appmetrics.jserrors.PendingErrorStore
import expo.modules.appmetrics.storage.MetricsDatabase
import java.io.FileNotFoundException
import java.util.concurrent.ConcurrentHashMap
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Whether the user consented to Observe collecting data. While not granted, app metrics stores
 * nothing and Observe sends nothing.
 */
object ObserveConsent {
  // Not granted until the application start hook calls `load`, so nothing is collected if it never runs.
  @Volatile
  var isGranted: Boolean = false
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

/** Deletes the metrics database, the crash files, the pending-error files, and the settings. */
internal fun deleteStoredData(context: Context) {
  context.deleteDatabase(MetricsDatabase.NAME)
  CrashFileFormat.crashesDir(context).deleteRecursively()
  PendingErrorStore.directory(context).deleteRecursively()
  AppMetricsPreferences.deleteStoredSettings(context)
}

/** Shared preferences that save nothing while consent is not granted. */
class ConsentGatedPreferences(private val name: String) {
  // Values set without consent. They are kept only in memory, and reads return them.
  private val unsavedValues = ConcurrentHashMap<String, Any>()

  fun getString(context: Context, key: String): String? =
    read(inMemory = { unsavedValues[key] as? String }, stored = { preferences(context).getString(key, null) })

  fun getLong(context: Context, key: String, defaultValue: Long): Long =
    read(
      inMemory = { unsavedValues[key] as? Long ?: defaultValue },
      stored = { preferences(context).getLong(key, defaultValue) }
    )

  /** With `commit`, the value is on disk when this returns. */
  fun putString(context: Context, key: String, value: String, commit: Boolean = true) {
    write(inMemory = { unsavedValues[key] = value }, stored = { preferences(context).edit(commit) { putString(key, value) } })
  }

  fun putLong(context: Context, key: String, value: Long) {
    write(inMemory = { unsavedValues[key] = value }, stored = { preferences(context).edit(commit = true) { putLong(key, value) } })
  }

  private inline fun write(inMemory: () -> Unit, stored: () -> Unit) {
    if (ObserveConsent.isGranted) {
      stored()
    } else {
      inMemory()
    }
  }

  private inline fun <T> read(inMemory: () -> T, stored: () -> T): T =
    if (ObserveConsent.isGranted) {
      stored()
    } else {
      inMemory()
    }

  /** Deletes the settings file. Runs at a launch without consent. */
  fun delete(context: Context) {
    context.deleteSharedPreferences(name)
  }

  private fun preferences(context: Context) = context.getSharedPreferences(name, Context.MODE_PRIVATE)
}
