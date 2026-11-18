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
  // Null until the application start hook calls `load`. Not granted while null, so nothing is
  // collected if the hook never runs.
  @Volatile
  private var granted: Boolean? = null

  val isGranted: Boolean
    get() = granted == true

  internal val isLoaded: Boolean
    get() = granted != null

  /** Reads the saved consent value, else the manifest value that the `expo-observe` config plugin writes. */
  fun load(context: Context) {
    granted = resolve(AppMetricsPreferences.getObserveConsent(context), readManifestConsent(context))
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

  /** Consent from the saved value, else from the manifest `meta-data` value, granted when both are absent. */
  internal fun resolve(savedConsent: String?, consent: String?): Boolean {
    if (savedConsent != null) {
      return savedConsent == GRANTED
    }
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
    if (ObserveConsent.isGranted) {
      preferences(context).getString(key, null)
    } else {
      unsavedValues[key] as? String
    }

  fun getLong(context: Context, key: String, defaultValue: Long): Long =
    if (ObserveConsent.isGranted) {
      preferences(context).getLong(key, defaultValue)
    } else {
      unsavedValues[key] as? Long ?: defaultValue
    }

  /** With `commit`, the value is on disk when this returns. */
  fun putString(context: Context, key: String, value: String, commit: Boolean = true) {
    if (ObserveConsent.isGranted) {
      preferences(context).edit(commit) { putString(key, value) }
    } else {
      unsavedValues[key] = value
    }
  }

  fun putLong(context: Context, key: String, value: Long) {
    if (ObserveConsent.isGranted) {
      preferences(context).edit(commit = true) { putLong(key, value) }
    } else {
      unsavedValues[key] = value
    }
  }

  /** Deletes the settings file. Runs at a launch without consent. */
  fun delete(context: Context) {
    context.deleteSharedPreferences(name)
  }

  private fun preferences(context: Context) = context.getSharedPreferences(name, Context.MODE_PRIVATE)
}
