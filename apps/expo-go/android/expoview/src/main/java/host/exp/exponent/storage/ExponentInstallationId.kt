package host.exp.exponent.storage

import android.content.Context
import android.content.SharedPreferences
import host.exp.exponent.analytics.EXL
import java.io.*
import java.lang.IllegalArgumentException
import java.util.*

/**
 * An installation ID provider - it solves two purposes:
 * - in installations that have a legacy UUID persisted in shared-across-expo-modules SharedPreferences,
 *   migrates the UUID from there to a non-backed-up file,
 * - provides/creates a UUID unique per an installation.
 *
 * Similar class exists in expo-constants and expo-notifications.
 */
internal class ExponentInstallationId(
  private val context: Context, // We only remove the value from old storage once it's set and saved in the new storage.
  private val sharedPreferences: SharedPreferences
) {
  private var uuid: String? = null

  fun getUUID(): String? {
    // If it has already been cached, return the value.
    if (uuid != null) {
      return uuid
    }

    // Read from non-backed-up storage
    val uuidFile = nonBackedUpUuidFile
    try {
      uuidFile.bufferedReader().use { bufferedReader ->
        // Cache for future calls
        uuid = UUID.fromString(bufferedReader.readLine()).toString()
      }
    } catch (e: IOException) {
      // do nothing, try other sources
    } catch (e: IllegalArgumentException) {
      // do nothing, try other sources
    }

    // We could have returned inside try clause,
    // but putting it like this here makes it immediately
    // visible.
    if (uuid != null) {
      return uuid
    }

    // In November 2020 we decided to move installationID (backed by LEGACY_UUID_KEY value) from backed-up SharedPreferences
    // to a non-backed-up text file to fix issues where devices restored from backups have the same installation IDs
    // as the devices where the backup was created.
    val legacyUuid = sharedPreferences.getString(LEGACY_UUID_KEY, null)
    if (legacyUuid != null) {
      uuid = legacyUuid

      val uuidHasBeenSuccessfullyMigrated = try {
        uuidFile.writer().use { writer -> writer.write(legacyUuid) }
        true
      } catch (e: IOException) {
        EXL.e(TAG, "Error while migrating UUID from legacy storage. $e")
        false
      }

      // We only remove the value from old storage once it's set and saved in the new storage.
      if (uuidHasBeenSuccessfullyMigrated) {
        sharedPreferences.edit().remove(LEGACY_UUID_KEY).apply()
      }
    }

    // Return either value from legacy storage or null
    return uuid
  }

  fun getOrCreateUUID(): String {
    val uuid = getUUID()
    if (uuid != null) {
      return uuid
    }

    // We persist the new UUID in "session storage"
    // so that if writing to persistent storage
    // fails subsequent calls to get(orCreate)UUID
    // return the same value.
    this.uuid = UUID.randomUUID().toString()
    try {
      nonBackedUpUuidFile.writer().use { writer -> writer.write(this.uuid) }
    } catch (e: IOException) {
      EXL.e(TAG, "Error while writing new UUID. $e")
    }
    return this.uuid!!
  }

  private val nonBackedUpUuidFile: File
    get() = File(context.noBackupFilesDir, UUID_FILE_NAME)

  companion object {
    private val TAG = ExponentInstallationId::class.java.simpleName

    const val LEGACY_UUID_KEY = "uuid"
    const val UUID_FILE_NAME = "expo_installation_uuid.txt"
  }
}
