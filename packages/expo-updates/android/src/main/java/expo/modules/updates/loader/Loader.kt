package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.FileDownloader.ManifestDownloadCallback
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
import java.io.File
import java.util.*

/**
 * Abstract class responsible for loading an update's manifest, enumerating the assets required for
 * it to launch, and loading them all onto disk and into SQLite.
 *
 * There are two sources from which an update can be loaded - a remote server given a URL, and the
 * application package. These correspond to the two loader subclasses.
 */
abstract class Loader protected constructor(
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  private val database: UpdatesDatabase,
  private val updatesDirectory: File?,
  private val loaderFiles: LoaderFiles
) {
  private var updateManifest: UpdateManifest? = null
  private var updateEntity: UpdateEntity? = null
  private var callback: LoaderCallback? = null
  private var assetTotal = 0
  private var erroredAssetList = mutableListOf<AssetEntity>()
  private var skippedAssetList = mutableListOf<AssetEntity>()
  private var existingAssetList = mutableListOf<AssetEntity>()
  private var finishedAssetList = mutableListOf<AssetEntity>()

  interface LoaderCallback {
    fun onFailure(e: Exception)
    fun onSuccess(update: UpdateEntity?)

    /**
     * Called when an asset has either been successfully downloaded or failed to download.
     *
     * @param asset Entity representing the asset that was either just downloaded or failed
     * @param successfulAssetCount The number of assets that have so far been loaded successfully
     * (including any that were found to already exist on disk)
     * @param failedAssetCount The number of assets that have so far failed to load
     * @param totalAssetCount The total number of assets that comprise the update
     */
    fun onAssetLoaded(
      asset: AssetEntity,
      successfulAssetCount: Int,
      failedAssetCount: Int,
      totalAssetCount: Int
    )

    /**
     * Called when a manifest has been downloaded. The calling class should determine whether or not
     * the RemoteLoader should continue to download the update described by this manifest, based on
     * (for example) whether or not it already has the update downloaded locally.
     *
     * @param updateManifest Manifest downloaded by Loader
     * @return true if Loader should download the update described in the manifest,
     * false if not.
     */
    fun onUpdateManifestLoaded(updateManifest: UpdateManifest): Boolean
  }

  protected abstract fun loadManifest(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    callback: ManifestDownloadCallback
  )

  protected abstract fun loadAsset(
    context: Context,
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    callback: AssetDownloadCallback
  )

  protected abstract fun shouldSkipAsset(assetEntity: AssetEntity): Boolean

  // lifecycle methods for class
  fun start(callback: LoaderCallback) {
    if (this.callback != null) {
      callback.onFailure(Exception("RemoteLoader has already started. Create a new instance in order to load multiple URLs in parallel."))
      return
    }
    this.callback = callback

    loadManifest(
      context, database, configuration,
      object : ManifestDownloadCallback {
        override fun onFailure(message: String, e: Exception) {
          finishWithError(message, e)
        }

        override fun onSuccess(updateManifest: UpdateManifest) {
          this@Loader.updateManifest = updateManifest
          if (this@Loader.callback!!.onUpdateManifestLoaded(updateManifest)) {
            processUpdateManifest(updateManifest)
          } else {
            updateEntity = null
            finishWithSuccess()
          }
        }
      }
    )
  }

  private fun reset() {
    updateEntity = null
    callback = null
    assetTotal = 0
    erroredAssetList = mutableListOf()
    skippedAssetList = mutableListOf()
    existingAssetList = mutableListOf()
    finishedAssetList = mutableListOf()
  }

  private fun finishWithSuccess() {
    if (callback == null) {
      Log.e(
        TAG,
        this.javaClass.simpleName + " tried to finish but it already finished or was never initialized."
      )
      return
    }
    ManifestMetadata.saveMetadata(updateManifest!!, database, configuration)
    callback!!.onSuccess(updateEntity)
    reset()
  }

  private fun finishWithError(message: String, e: Exception) {
    Log.e(TAG, message, e)
    if (callback == null) {
      Log.e(
        TAG,
        this.javaClass.simpleName + " tried to finish but it already finished or was never initialized."
      )
      return
    }
    callback!!.onFailure(e)
    reset()
  }

  // private helper methods
  private fun processUpdateManifest(updateManifest: UpdateManifest) {
    if (updateManifest.isDevelopmentMode) {
      // insert into database but don't try to load any assets;
      // the RN runtime will take care of that and we don't want to cache anything
      val updateEntity = updateManifest.updateEntity
      database.updateDao().insertUpdate(updateEntity!!)
      database.updateDao().markUpdateFinished(updateEntity)
      finishWithSuccess()
      return
    }

    val newUpdateEntity = updateManifest.updateEntity
    val existingUpdateEntity = database.updateDao().loadUpdateWithId(
      newUpdateEntity!!.id
    )

    // if something has gone wrong on the server and we have two updates with the same id
    // but different scope keys, we should try to launch something rather than show a cryptic
    // error to the user.
    if (existingUpdateEntity != null && existingUpdateEntity.scopeKey != newUpdateEntity.scopeKey) {
      database.updateDao().setUpdateScopeKey(existingUpdateEntity, newUpdateEntity.scopeKey)
      Log.e(
        TAG,
        "Loaded an update with the same ID but a different scopeKey than one we already have on disk. This is a server error. Overwriting the scopeKey and loading the existing update."
      )
    }

    if (existingUpdateEntity != null && existingUpdateEntity.status == UpdateStatus.READY) {
      // hooray, we already have this update downloaded and ready to go!
      updateEntity = existingUpdateEntity
      finishWithSuccess()
    } else {
      if (existingUpdateEntity == null) {
        // no update already exists with this ID, so we need to insert it and download everything.
        updateEntity = newUpdateEntity
        database.updateDao().insertUpdate(updateEntity!!)
      } else {
        // we've already partially downloaded the update, so we should use the existing entity.
        // however, it's not ready, so we should try to download all the assets again.
        updateEntity = existingUpdateEntity
      }
      downloadAllAssets(updateManifest.assetEntityList)
    }
  }

  private enum class AssetLoadResult {
    FINISHED, ALREADY_EXISTS, ERRORED, SKIPPED
  }

  private fun downloadAllAssets(assetList: List<AssetEntity>) {
    assetTotal = assetList.size
    for (assetEntityCur in assetList) {
      var assetEntity = assetEntityCur
      if (shouldSkipAsset(assetEntity)) {
        handleAssetDownloadCompleted(assetEntity, AssetLoadResult.SKIPPED)
        continue
      }

      val matchingDbEntry = database.assetDao().loadAssetWithKey(assetEntity.key)
      if (matchingDbEntry != null) {
        // merge all fields not stored in the database onto matchingDbEntry,
        // in case we need them later on in this class
        database.assetDao().mergeAndUpdateAsset(matchingDbEntry, assetEntity)
        assetEntity = matchingDbEntry
      }

      // if we already have a local copy of this asset, don't try to download it again!
      if (assetEntity.relativePath != null && loaderFiles.fileExists(
          File(
              updatesDirectory,
              assetEntity.relativePath
            )
        )
      ) {
        handleAssetDownloadCompleted(assetEntity, AssetLoadResult.ALREADY_EXISTS)
        continue
      }

      loadAsset(
        context, assetEntity, updatesDirectory, configuration,
        object : AssetDownloadCallback {
          override fun onFailure(e: Exception, assetEntity: AssetEntity) {
            val identifier = if (assetEntity.hash != null) "hash " + UpdatesUtils.bytesToHex(
              assetEntity.hash!!
            ) else "key " + assetEntity.key
            Log.e(TAG, "Failed to download asset with $identifier", e)
            handleAssetDownloadCompleted(assetEntity, AssetLoadResult.ERRORED)
          }

          override fun onSuccess(assetEntity: AssetEntity, isNew: Boolean) {
            handleAssetDownloadCompleted(
              assetEntity,
              if (isNew) AssetLoadResult.FINISHED else AssetLoadResult.ALREADY_EXISTS
            )
          }
        }
      )
    }
  }

  @Synchronized
  private fun handleAssetDownloadCompleted(assetEntity: AssetEntity, result: AssetLoadResult) {
    when (result) {
      AssetLoadResult.FINISHED -> finishedAssetList.add(assetEntity)
      AssetLoadResult.ALREADY_EXISTS -> existingAssetList.add(assetEntity)
      AssetLoadResult.ERRORED -> erroredAssetList.add(assetEntity)
      AssetLoadResult.SKIPPED -> skippedAssetList.add(assetEntity)
      else -> throw AssertionError("Missing implementation for AssetLoadResult value")
    }

    callback!!.onAssetLoaded(
      assetEntity,
      finishedAssetList.size + existingAssetList.size,
      erroredAssetList.size,
      assetTotal
    )

    if (finishedAssetList.size + erroredAssetList.size + existingAssetList.size + skippedAssetList.size == assetTotal) {
      try {
        for (asset in existingAssetList) {
          val existingAssetFound = database.assetDao()
            .addExistingAssetToUpdate(updateEntity!!, asset, asset.isLaunchAsset)
          if (!existingAssetFound) {
            // the database and filesystem have gotten out of sync
            // do our best to create a new entry for this file even though it already existed on disk
            // TODO: we should probably get rid of this assumption that if an asset exists on disk with the same filename, it's the same asset
            var hash: ByteArray? = null
            try {
              hash = UpdatesUtils.sha256(File(updatesDirectory, asset.relativePath))
            } catch (e: Exception) {
            }
            asset.downloadTime = Date()
            asset.hash = hash
            finishedAssetList.add(asset)
          }
        }

        database.assetDao().insertAssets(finishedAssetList, updateEntity!!)

        if (erroredAssetList.size == 0) {
          database.updateDao().markUpdateFinished(updateEntity!!, skippedAssetList.size != 0)
        }
      } catch (e: Exception) {
        finishWithError("Error while adding new update to database", e)
        return
      }

      if (erroredAssetList.size > 0) {
        finishWithError("Failed to load all assets", Exception("Failed to load all assets"))
      } else {
        finishWithSuccess()
      }
    }
  }

  companion object {
    private val TAG = Loader::class.java.simpleName
  }
}
