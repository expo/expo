package expo.modules.updates.launcher

import android.content.Context
import android.os.AsyncTask
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.manifest.BareUpdateManifest
import expo.modules.updates.manifest.EmbeddedManifest
import org.apache.commons.io.FileUtils
import java.io.File

class NoDatabaseLauncher @JvmOverloads constructor(
  context: Context,
  configuration: UpdatesConfiguration,
  fatalException: Exception? = null
) : Launcher {
  override var bundleAssetName: String? = null
  override val launchedUpdate: UpdateEntity?
    get() = null
  override val launchAssetFile: String?
    get() = null
  override var localAssetFiles: Map<AssetEntity, String>? = null
    private set
  override val isUsingEmbeddedAssets: Boolean
    get() = localAssetFiles == null

  private fun writeErrorToLog(context: Context, fatalException: Exception) {
    try {
      val errorLogFile = File(context.filesDir, ERROR_LOG_FILENAME)
      val exceptionString = fatalException.toString()
      FileUtils.writeStringToFile(errorLogFile, exceptionString, "UTF-8", true)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to write fatal error to log", e)
    }
  }

  companion object {
    private val TAG = NoDatabaseLauncher::class.java.simpleName

    private const val ERROR_LOG_FILENAME = "expo-error.log"

    fun consumeErrorLog(context: Context): String? {
      return try {
        val errorLogFile = File(context.filesDir, ERROR_LOG_FILENAME)
        if (!errorLogFile.exists()) {
          return null
        }
        val logContents = FileUtils.readFileToString(errorLogFile, "UTF-8")
        errorLogFile.delete()
        logContents
      } catch (e: Exception) {
        Log.e(TAG, "Failed to read error log", e)
        null
      }
    }
  }

  init {
    val embeddedUpdateManifest = EmbeddedManifest.get(context, configuration)
      ?: throw RuntimeException("Failed to launch with embedded update because the embedded manifest was null")

    if (embeddedUpdateManifest is BareUpdateManifest) {
      bundleAssetName = EmbeddedLoader.BARE_BUNDLE_FILENAME
      localAssetFiles = null
    } else {
      bundleAssetName = EmbeddedLoader.BUNDLE_FILENAME
      localAssetFiles = mutableMapOf<AssetEntity, String>().apply {
        for (asset in embeddedUpdateManifest.assetEntityList) {
          this[asset] = "asset:///" + asset.embeddedAssetFilename
        }
      }
    }

    if (fatalException != null) {
      AsyncTask.execute { writeErrorToLog(context, fatalException) }
    }
  }
}
