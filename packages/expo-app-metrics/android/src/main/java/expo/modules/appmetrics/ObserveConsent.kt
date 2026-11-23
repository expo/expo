package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.edit
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import expo.modules.appmetrics.crashreporting.ExitInfoProvider
import expo.modules.appmetrics.crashreporting.ExitInfoProviderImpl
import expo.modules.appmetrics.jserrors.PendingErrorStore
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.kotlin.exception.CodedException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

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

  // After a revoke, a grant in the same process only saves the value.
  private var hasRevoked = false

  /** Reads the saved consent value, else the manifest value that the `expo-observe` config plugin writes. */
  @Synchronized
  fun load(context: Context) {
    var savedConsent = AppMetricsPreferences.getObserveConsent(context)
    if (savedConsent == GRANTED_AT_NEXT_LAUNCH) {
      // Exit records from before this launch are from processes without consent, so the crash
      // cursor skips them. Without that cursor, consent stays not granted until a later launch.
      val isSaved = AppMetricsPreferences.saveObserveConsent(context, GRANTED, lastProcessedExitMillis = System.currentTimeMillis())
      savedConsent = if (isSaved) {
        GRANTED
      } else {
        NOT_GRANTED
      }
    }
    granted = resolve(savedConsent, readManifestConsent(context))
    hasRevoked = false
  }

  internal data class Update(val changed: Boolean, val isSaved: Boolean)

  /**
   * Saves the value and changes the gate. A grant after a revoke changes it only at the next launch.
   * When the save fails, a revoke still closes the gate, but a grant changes nothing: the next
   * launch would read the earlier value. A first grant that cannot read the exit records throws
   * and saves nothing.
   */
  @Synchronized
  internal fun update(
    context: Context,
    granted: Boolean,
    exitInfoProvider: ExitInfoProvider = ExitInfoProvider(ExitInfoProviderImpl(context)::readExitRecords)
  ): Update {
    val isSaved = when {
      // A failed revoke keeps its value in memory, so a later write of the file saves it.
      !granted -> AppMetricsPreferences.saveObserveConsent(context, NOT_GRANTED, keepOnFailure = true)
      isGranted -> AppMetricsPreferences.saveObserveConsent(context, GRANTED)
      hasRevoked -> AppMetricsPreferences.saveObserveConsent(context, GRANTED_AT_NEXT_LAUNCH)
      // The exit records that exist now are from before the grant, so the crash cursor skips them.
      // In the same write as the consent, so no launch reads `granted` without the cursor.
      else -> AppMetricsPreferences.saveObserveConsent(
        context,
        GRANTED,
        lastProcessedExitMillis = readExitRecords(exitInfoProvider).maxOfOrNull { it.timestampMillis } ?: 0L
      )
    }
    if (granted == isGranted || (granted && (hasRevoked || !isSaved))) {
      return Update(changed = false, isSaved = isSaved)
    }
    if (granted) {
      // Before the gate opens, so no reader sees the stored settings without them.
      ConsentGatedPreferences.saveUnsavedValues(context)
    }
    this.granted = granted
    hasRevoked = hasRevoked || !granted
    return Update(changed = true, isSaved = isSaved)
  }

  private fun readExitRecords(exitInfoProvider: ExitInfoProvider) =
    try {
      exitInfoProvider.getExitRecords()
    } catch (e: Exception) {
      throw ExitRecordsUnavailableException(e)
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

  // Saved by a grant after a revoke. The next launch saves `GRANTED` in its place.
  private const val GRANTED_AT_NEXT_LAUNCH = "granted-at-next-launch"
}

internal class ExitRecordsUnavailableException(cause: Exception) : CodedException(
  "Observe could not read the app exit records from the system, so collection did not start. Observe needs them " +
    "to skip crashes from before the grant. Call setConsent('granted') again.",
  cause
)

/** Deletes the metrics database, the crash files, the pending-error files, and the settings. */
internal fun deleteStoredData(context: Context) {
  context.deleteDatabase(MetricsDatabase.NAME)
  CrashFileFormat.crashesDir(context).deleteRecursively()
  PendingErrorStore.directory(context).deleteRecursively()
  AppMetricsPreferences.deleteStoredSettings(context)
}

/** Shared preferences that save nothing while consent is not granted. */
class ConsentGatedPreferences(private val name: String) {
  // Values set without consent. The app sends its config at startup, before the user can grant
  // consent. The first grant saves these values, so Observe does not send with the defaults.
  private val unsavedValues = ConcurrentHashMap<String, Any>()

  init {
    stores.add(this)
  }

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

  // `update` changes the gate under the same lock. So a write cannot land in memory after the first
  // grant saved those values, or in storage after a revoke closed the gate and deleted the settings.
  private inline fun write(inMemory: () -> Unit, stored: () -> Unit) {
    synchronized(ObserveConsent) {
      if (ObserveConsent.isGranted) {
        stored()
      } else {
        inMemory()
      }
    }
  }

  // Like `write`, but a read with consent does not wait for the lock: a stale value read during a
  // transition changes nothing on disk.
  private inline fun <T> read(inMemory: () -> T, stored: () -> T): T {
    if (!ObserveConsent.isGranted) {
      synchronized(ObserveConsent) {
        if (!ObserveConsent.isGranted) {
          return inMemory()
        }
      }
    }
    return stored()
  }

  /** Deletes the settings file. Runs at a launch without consent and at a revoke. */
  fun delete(context: Context) {
    context.deleteSharedPreferences(name)
  }

  private fun preferences(context: Context) = context.getSharedPreferences(name, Context.MODE_PRIVATE)

  companion object {
    // A store that was never created holds no values in memory, so this list has every such value.
    private val stores = CopyOnWriteArrayList<ConsentGatedPreferences>()

    /** Saves the values kept in memory, then forgets them. Runs at the first grant. */
    internal fun saveUnsavedValues(context: Context) {
      for (store in stores) {
        if (store.unsavedValues.isEmpty()) {
          continue
        }
        store.preferences(context).edit(commit = true) {
          for ((key, value) in store.unsavedValues) {
            when (value) {
              is String -> putString(key, value)
              is Long -> putLong(key, value)
            }
          }
        }
        store.unsavedValues.clear()
      }
    }
  }
}
