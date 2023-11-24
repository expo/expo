package expo.modules.updates.launcher

import android.content.Context
import android.net.Uri
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.LoaderFiles
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File
import java.util.*

/**
 * Implementation of [Launcher] that uses the SQLite database and expo-updates file store as the
 * source of updates.
 *
 * Uses the [SelectionPolicy] to choose an update from SQLite to launch, then ensures that the
 * update is safe and ready to launch (i.e. all the assets that SQLite expects to be stored on disk
 * are actually there).
 *
 * This class also includes failsafe code to attempt to re-download any assets unexpectedly missing
 * from disk (since it isn't necessarily safe to just revert to an older update in this case).
 * Distinct from the [Loader] classes, though, this class does *not* make any major modifications to
 * the database; its role is mostly to read the database and ensure integrity with the file system.
 *
 * It's important that the update to launch is selected *before* any other checks, e.g. the above
 * check for assets on disk. This is to preserve the invariant that no older update should ever be
 * launched after a newer one has been launched.
 */
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
  private var callback: LauncherCallback? = null
  private var logger: UpdatesLogger? = null

  @Synchronized
  fun launch(database: UpdatesDatabase, context: Context, callback: LauncherCallback?) {
    if (this.callback != null) {
      throw AssertionError("DatabaseLauncher has already started. Create a new instance in order to launch a new version.")
    }
    this.callback = callback
    this.logger = UpdatesLogger(context)

    launchedUpdate = getLaunchableUpdate(database, context)
    if (launchedUpdate == null) {
      this.callback!!.onFailure(Exception("No launchable update was found. If this is a bare workflow app, make sure you have configured expo-updates correctly in android/app/build.gradle."))
      return
    }

    database.updateDao().markUpdateAccessed(launchedUpdate!!)
    if (launchedUpdate!!.status == UpdateStatus.DEVELOPMENT) {
      this.callback!!.onSuccess()
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

    localAssetFiles = embeddedAssetFileMap(context).apply {
      for (asset in assetEntities) {
        if (asset.id == launchAsset.id) {
          // we took care of this one above
          continue
        }
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
        this.callback!!.onFailure(Exception("mLaunchAssetFile was immediately null; this should never happen"))
      } else {
        this.callback!!.onSuccess()
      }
    }
  }

  fun getLaunchableUpdate(database: UpdatesDatabase, context: Context): UpdateEntity? {
    val launchableUpdates = database.updateDao().loadLaunchableUpdatesForScope(configuration.scopeKey)

    // We can only run an update marked as embedded if it's actually the update embedded in the
    // current binary. We might have an older update from a previous binary still listed as
    // "EMBEDDED" in the database so we need to do this check.
    val embeddedUpdateManifest = EmbeddedManifest.get(context, configuration)
    val filteredLaunchableUpdates = mutableListOf<UpdateEntity>()
    for (update in launchableUpdates) {
      if (update.status == UpdateStatus.EMBEDDED) {
        if (embeddedUpdateManifest != null && embeddedUpdateManifest.updateEntity.id != update.id) {
          continue
        }
      }
      filteredLaunchableUpdates.add(update)
    }
    val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
    return selectionPolicy.selectUpdateToLaunch(filteredLaunchableUpdates, manifestFilters)
  }

  private fun embeddedAssetFileMap(context: Context): MutableMap<AssetEntity, String> {
    val embeddedManifest = EmbeddedManifest.get(context, configuration)
    val embeddedAssets = embeddedManifest?.assetEntityList ?: listOf()
    logger?.info("embeddedAssetFileMap: embeddedAssets count = ${embeddedAssets.count()}")
    return mutableMapOf<AssetEntity, String>().apply {
      for (asset in embeddedAssets) {
        if (asset.isLaunchAsset) {
          continue
        }
        val filename = UpdatesUtils.createFilenameForAsset(asset)
        asset.relativePath = filename
        val assetFile = File(updatesDirectory, filename)
        if (!assetFile.exists()) {
          loaderFiles.copyAssetAndGetHash(asset, assetFile, context)
        }
        if (assetFile.exists()) {
          this[asset] = Uri.fromFile(assetFile).toString()
          logger?.info("embeddedAssetFileMap: ${asset.key},${asset.type} => ${this[asset]}")
        } else {
          logger?.error("embeddedAssetFileMap: no file for ${asset.key},${asset.type}", UpdatesErrorCode.AssetsFailedToLoad)
        }
      }
    }
  }

  fun ensureAssetExists(asset: AssetEntity, database: UpdatesDatabase, context: Context): File? {
    val assetFile = File(updatesDirectory, asset.relativePath ?: "")
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
            logger?.error("Failed to copy matching embedded asset", UpdatesErrorCode.AssetsFailedToLoad, e)
          }
        }
      }
    }

    return if (!assetFileExists) {
      // we still don't have the asset locally, so try downloading it remotely
      assetsToDownload++
      fileDownloader.downloadAsset(
        asset,
        updatesDirectory,
        configuration,
        context,
        object : AssetDownloadCallback {
          override fun onFailure(e: Exception, assetEntity: AssetEntity) {
            logger?.error("Failed to load asset from disk or network", UpdatesErrorCode.AssetsFailedToLoad, e)
            if (assetEntity.isLaunchAsset) {
              launchAssetException = e
            }
            maybeFinish(assetEntity, null)
          }

          override fun onSuccess(assetEntity: AssetEntity, isNew: Boolean) {
            database.assetDao().updateAsset(assetEntity)
            val assetFileLocal = File(updatesDirectory, assetEntity.relativePath!!)
            maybeFinish(assetEntity, if (assetFileLocal.exists()) assetFileLocal else null)
          }
        }
      )
      null
    } else {
      assetFile
    }
  }

  @Synchronized
  private fun maybeFinish(asset: AssetEntity, assetFile: File?) {
    assetsToDownloadFinished++
    if (asset.isLaunchAsset) {
      launchAssetFile = if (assetFile == null) {
        logger?.error("Could not launch; failed to load update from disk or network", UpdatesErrorCode.UpdateFailedToLoad)
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
        callback!!.onFailure(launchAssetException!!)
      } else {
        callback!!.onSuccess()
      }
    }
  }

  companion object {
    private val TAG = DatabaseLauncher::class.java.simpleName
  }
}
