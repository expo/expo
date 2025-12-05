package expo.modules.devlauncher.helpers

import android.content.Context
import android.util.Log
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import java.io.FileWriter
import java.lang.Exception
import java.util.*

class DevLauncherInstallationIDHelper {
  private var installationID: String? = null

  fun getOrCreateInstallationID(context: Context): String {
    val savedID = getInstallationID(context)
    if (savedID != null) {
      return savedID
    }

    val newID = UUID.randomUUID().toString()
    setInstallationID(newID, context)
    return newID
  }

  private fun getInstallationID(context: Context): String? {
    if (installationID != null) {
      return installationID
    }

    val installationIDFile = getInstallationIDFile(context)
    try {
      if (installationIDFile.exists()) {
        FileReader(installationIDFile).use { fileReader ->
          BufferedReader(fileReader).use { bufferedReader ->
            installationID = bufferedReader.readLine()
          }
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to read stored installation ID", e)
    }

    // return either persisted value or nil
    return installationID
  }

  private fun setInstallationID(newID: String, context: Context) {
    // store in memory, in case there's a problem writing to persistent storage
    // then at least subsequent calls during this session will return the same value
    installationID = newID

    val installationIDFile = getInstallationIDFile(context)
    try {
      FileWriter(installationIDFile).use { it.write(installationID) }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to write or set resource values to installation ID file", e)
    }
  }

  internal fun getInstallationIDFile(context: Context): File {
    return File(context.noBackupFilesDir, INSTALLATION_ID_FILENAME)
  }

  companion object {
    private val TAG = DevLauncherInstallationIDHelper::class.java.simpleName
    internal const val INSTALLATION_ID_FILENAME = "expo-dev-launcher-installation-id.txt"
  }
}
