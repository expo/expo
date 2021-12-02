package expo.modules.updates.launcher

import android.content.Context
import android.net.Uri
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderFiles
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File
import java.util.*

class DatabaseLauncher(
  private val configuration: UpdatesConfiguration,
  private val updatesDirectory: File?,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy
) : Launcher {
  private val loaderFiles: LoaderFiles = LoaderFiles()
  override var launchedUpdate: UpdateEntity? = null
    private set
  override var launchAssetFile: String? = null
    private set
  override var bundleAssetName: String? = null
    private set
  override var localAssetFiles: MutableMap<AssetEntity, String>? = null
    private set
  override val isUsingEmbeddedAssets: Boolean
    get() = localAssetFiles == null

  private var assetsToDownload = 0
  private var assetsToDownloadFinished = 0
  private var launchAssetException: Exception? = null

  suspend fun launch(database: UpdatesDatabase, context: Context) {
    launchedUpdate = getLaunchableUpdate(database, context)
    if (launchedUpdate == null) {
      throw Exception("No launchable update was found. If this is a bare workflow app, make sure you have configured expo-updates correctly in android/app/build.gradle.")
    }

    database.updateDao().markUpdateAccessed(launchedUpdate!!)

    if (launchedUpdate!!.status == UpdateStatus.EMBEDDED) {
      bundleAssetName = EmbeddedLoader.BARE_BUNDLE_FILENAME
      if (localAssetFiles != null) {
        throw AssertionError("mLocalAssetFiles should be null for embedded updates")
      }
      return
    } else if (launchedUpdate!!.status == UpdateStatus.DEVELOPMENT) {
      return
    }

    // verify that we have all assets on disk
    // according to the database, we should, but something could have gone wrong on disk
    val launchAsset = database.updateDao().loadLaunchAsset(launchedUpdate!!.id)
    if (launchAsset.relativePath == null) {
      throw AssertionError("Launch Asset relativePath should not be null")
    }

    val launchAssetFile = ensureAssetExists(launchAsset, database, context)
    if (launchAssetFile != null) {
      this.launchAssetFile = launchAssetFile.toString()
    }

    val assetEntities = database.assetDao().loadAssetsForUpdate(launchedUpdate!!.id)

    localAssetFiles = mutableMapOf<AssetEntity, String>().apply {
      for (asset in assetEntities) {
        val filename = asset.relativePath
        if (filename != null) {
          val assetFile = ensureAssetExists(asset, database, context)
          if (assetFile != null) {
            this[asset] = Uri.fromFile(assetFile).toString()
          }
        }
      }
    }

    if (assetsToDownload == 0) {
      if (this.launchAssetFile == null) {
        throw Exception("mLaunchAssetFile was immediately null; this should never happen")
      } else {
        return
      }
    }
  }

  fun getLaunchableUpdate(database: UpdatesDatabase, context: Context): UpdateEntity? {
    val launchableUpdates = database.updateDao().loadLaunchableUpdatesForScope(configuration.scopeKey)

    // We can only run an update marked as embedded if it's actually the update embedded in the
    // current binary. We might have an older update from a previous binary still listed as
    // "EMBEDDED" in the database so we need to do this check.
    val embeddedUpdateManifest = EmbeddedManifest.get(context, configuration)
    val filteredLaunchableUpdates = ArrayList<UpdateEntity>()
    for (update in launchableUpdates) {
      if (update.status == UpdateStatus.EMBEDDED) {
        if (embeddedUpdateManifest != null && embeddedUpdateManifest.updateEntity!!.id != update.id) {
          continue
        }
      }
      filteredLaunchableUpdates.add(update)
    }
    val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
    return selectionPolicy.selectUpdateToLaunch(filteredLaunchableUpdates, manifestFilters)
  }

  internal suspend fun ensureAssetExists(asset: AssetEntity, database: UpdatesDatabase, context: Context): File? {
    val assetFile = File(updatesDirectory, asset.relativePath)
    var assetFileExists = assetFile.exists()
    if (!assetFileExists) {
      // something has gone wrong, we're missing this asset
      // first we check to see if a copy is embedded in the binary
      val embeddedUpdateManifest = EmbeddedManifest.get(context, configuration)
      if (embeddedUpdateManifest != null) {
        val embeddedAssets = embeddedUpdateManifest.assetEntityList
        var matchingEmbeddedAsset: AssetEntity? = null
        for (embeddedAsset in embeddedAssets) {
          if (embeddedAsset.key != null && embeddedAsset.key == asset.key) {
            matchingEmbeddedAsset = embeddedAsset
            break
          }
        }

        if (matchingEmbeddedAsset != null) {
          try {
            val hash = loaderFiles.copyAssetAndGetHash(matchingEmbeddedAsset, assetFile, context)
            if (Arrays.equals(hash, asset.hash)) {
              assetFileExists = true
            }
          } catch (e: Exception) {
            // things are really not going our way...
            Log.e(TAG, "Failed to copy matching embedded asset", e)
          }
        }
      }
    }

    return if (!assetFileExists) {
      // we still don't have the asset locally, so try downloading it remotely
      assetsToDownload++
      try {
        val assetDownloadResult = fileDownloader.downloadAsset(
          asset,
          updatesDirectory,
          configuration,
        )
        database.assetDao().updateAsset(assetDownloadResult.assetEntity)
        val assetFileLocal = File(updatesDirectory, assetDownloadResult.assetEntity.relativePath)
        maybeFinish(assetDownloadResult.assetEntity, if (assetFileLocal.exists()) assetFileLocal else null)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to load asset from disk or network", e)
        if (asset.isLaunchAsset) {
          launchAssetException = e
        }
        maybeFinish(asset, null)
      }
      null
    } else {
      assetFile
    }
  }

  private fun maybeFinish(asset: AssetEntity, assetFile: File?) {
    assetsToDownloadFinished++
    if (asset.isLaunchAsset) {
      launchAssetFile = if (assetFile == null) {
        Log.e(TAG, "Could not launch; failed to load update from disk or network")
        null
      } else {
        assetFile.toString()
      }
    } else {
      if (assetFile != null) {
        localAssetFiles!![asset] = assetFile.toString()
      }
    }
    if (assetsToDownloadFinished == assetsToDownload) {
      if (launchAssetFile == null) {
        if (launchAssetException == null) {
          launchAssetException = Exception("Launcher mLaunchAssetFile is unexpectedly null")
        }
        throw launchAssetException!!
      } else {
        return
      }
    }
  }

  companion object {
    private val TAG = DatabaseLauncher::class.java.simpleName
  }
}
