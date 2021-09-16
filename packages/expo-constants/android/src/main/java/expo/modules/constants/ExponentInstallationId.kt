package expo.modules.constants

import android.util.Log
import android.content.Context
import android.content.SharedPreferences

import java.util.UUID as JUUID
import java.io.File
import java.io.FileReader
import java.io.FileWriter
import java.io.IOException
import java.io.BufferedReader
import kotlin.IllegalArgumentException

private val TAG = ExponentInstallationId::class.java.simpleName
private const val PREFERENCES_FILE_NAME = "host.exp.exponent.SharedPreferences"

/**
 * An installation ID provider - it solves two purposes:
 * - in installations that have a legacy UUID persisted
 * in shared-across-expo-modules SharedPreferences,
 * migrates the UUID from there to a non-backed-up file,
 * - provides/creates a UUID unique per an installation.
 *
 * Similar class exists in expoview and expo-notifications.
 */
class ExponentInstallationId internal constructor(private val context: Context) {
  private var _uuid: String? = null

  private val mSharedPreferences: SharedPreferences = context.getSharedPreferences(PREFERENCES_FILE_NAME, Context.MODE_PRIVATE)

  val UUID: String?
    get() {
      // If it has already been cached, return the value.
      if (_uuid != null) {
        return _uuid
      }

      // Read from non-backed-up storage
      val uuidFile = nonBackedUpUuidFile
      try {
        FileReader(uuidFile).use { fileReader ->
          BufferedReader(fileReader).use { bufferedReader ->
            // Cache for future calls
            _uuid = JUUID.fromString(bufferedReader.readLine()).toString()
          }
        }
      } catch (e: Exception) {
        when (e) {
          is IOException, is IllegalArgumentException -> { /* do nothing, try other sources */ }
          else -> throw e
        }
      }

      // We could have returned inside try clause,
      // but putting it like this here makes it immediately
      // visible.
      if (_uuid != null) {
        return _uuid
      }

      // In November 2020 we decided to move installationID (backed by LEGACY_UUID_KEY value) from
      // backed-up SharedPreferences to a non-backed-up text file to fix issues where devices restored
      // from backups have the same installation IDs as the devices where the backup was created.
      val legacyUuid = mSharedPreferences.getString(LEGACY_UUID_KEY, null)
      if (legacyUuid != null) {
        _uuid = legacyUuid
        var uuidHasBeenSuccessfullyMigrated = true
        try {
          FileWriter(uuidFile).use { writer -> writer.write(legacyUuid) }
        } catch (e: IOException) {
          uuidHasBeenSuccessfullyMigrated = false
          Log.e(TAG, "Error while migrating UUID from legacy storage. $e")
        }

        // We only remove the value from old storage once it's set and saved in the new storage.
        if (uuidHasBeenSuccessfullyMigrated) {
          mSharedPreferences.edit().remove(LEGACY_UUID_KEY).apply()
        }
      }

      // Return either value from legacy storage or null
      return _uuid
    }

  val orCreateUUID: String
    get() {
      val uuid = UUID
      if (uuid != null) {
        return uuid
      }

      // We persist the new UUID in "session storage"
      // so that if writing to persistent storage
      // fails subsequent calls to get(orCreate)UUID
      // return the same value.
      _uuid = JUUID.randomUUID().toString()
      try {
        FileWriter(nonBackedUpUuidFile).use { writer -> writer.write(_uuid) }
      } catch (e: IOException) {
        Log.e(TAG, "Error while writing new UUID. $e")
      }
      return _uuid!!
    }

  private val nonBackedUpUuidFile: File
    get() = File(context.noBackupFilesDir, UUID_FILE_NAME)

  companion object {
    const val LEGACY_UUID_KEY = "uuid"
    const val UUID_FILE_NAME = "expo_installation_uuid.txt"
  }
}
