package expo.modules.updates.launcher

import android.content.Context
import android.os.AsyncTask
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.logging.UpdatesLogger
import java.io.File

/**
 * Implementation of [Launcher] which always uses the update embedded in the application package,
 * avoiding SQLite and the expo-updates file store entirely.
 *
 * This is only used in rare cases when the database/file system is corrupt or otherwise
 * inaccessible, but we still want to avoid crashing. The exported property `isEmergencyLaunch`
 * on [UpdatesModule] should be `true` whenever this class is used.
 */
class NoDatabaseLauncher @JvmOverloads constructor(
  private val context: Context,
  private val logger: UpdatesLogger,
  fatalException: Exception? = null
) : Launcher {
  override val bundleAssetName = EmbeddedLoader.BARE_BUNDLE_FILENAME
  override val launchedUpdate = null
  override val launchAssetFile = null
  override val localAssetFiles = null
  override val isUsingEmbeddedAssets = true

  private fun writeErrorToLog(fatalException: Exception) {
    try {
      val errorLogFile = File(context.filesDir, ERROR_LOG_FILENAME)
      val exceptionString = fatalException.toString()
      errorLogFile.appendText(exceptionString, Charsets.UTF_8)
    } catch (e: Exception) {
      logger.error("Failed to write fatal error to log", e)
    }
  }

  companion object {
    private val TAG = NoDatabaseLauncher::class.java.simpleName

    private const val ERROR_LOG_FILENAME = "expo-error.log"

    fun consumeErrorLog(context: Context, logger: UpdatesLogger): String? {
      return try {
        val errorLogFile = File(context.filesDir, ERROR_LOG_FILENAME)
        if (!errorLogFile.exists()) {
          return null
        }
        val logContents = errorLogFile.readText(Charsets.UTF_8)
        errorLogFile.delete()
        logContents
      } catch (e: Exception) {
        logger.error("Failed to read error log", e)
        null
      }
    }
  }

  init {
    if (fatalException != null) {
      AsyncTask.execute { writeErrorToLog(fatalException) }
    }
  }
}
