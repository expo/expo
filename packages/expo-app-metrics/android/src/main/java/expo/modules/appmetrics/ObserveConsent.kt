package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.edit
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import expo.modules.appmetrics.jserrors.PendingErrorStore
import expo.modules.appmetrics.storage.MetricsDatabase
import java.util.concurrent.ConcurrentHashMap

/**
 * Whether the user consented to Observe collecting data. While not granted, app metrics stores
 * nothing and Observe sends nothing.
 */
object ObserveConsent {
  // Not granted until the application start hook calls `load`, so nothing is collected if it never runs.
  @Volatile
  var isGranted: Boolean = false
    private set

  /** Reads the consent value that the `expo-observe` config plugin writes to the manifest. */
  fun load(context: Context) {
    isGranted = resolve(readManifestConsent(context))
  }

  // Null when the manifest has no value. An empty string, which is an unknown value, when the
  // value is not a string or the manifest cannot be read.
  private fun readManifestConsent(context: Context): String? =
    try {
      val metaData = context.packageManager
        .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        .metaData
      if (metaData?.containsKey(CONSENT_META_DATA) == true) {
        metaData.getString(CONSENT_META_DATA).orEmpty()
      } else {
        null
      }
    } catch (e: Exception) {
      Log.w(TAG, "[AppMetrics] Failed to read the Observe consent from `AndroidManifest.xml`", e)
      ""
    }

  /** Consent from the manifest `meta-data` value, granted when the value is absent. */
  internal fun resolve(consent: String?): Boolean {
    if (consent == null) {
      return true
    }
    if (consent != GRANTED && consent != NOT_GRANTED) {
      Log.w(
        TAG,
        "[AppMetrics] The `$CONSENT_META_DATA` meta-data in `AndroidManifest.xml` is '$consent', which is not " +
          "'granted' or 'not-granted', so Observe stays inactive. Set the `consent` option of the " +
          "`expo-observe` config plugin to 'granted' or 'not-granted', then run prebuild again."
      )
    }
    return consent == GRANTED
  }

  private const val CONSENT_META_DATA = "expo.modules.observe.CONSENT"
  private const val GRANTED = "granted"
  private const val NOT_GRANTED = "not-granted"
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
