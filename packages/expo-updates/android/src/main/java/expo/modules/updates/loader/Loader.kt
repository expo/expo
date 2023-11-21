package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import java.io.File
import java.util.Date

data class LoaderResult(val updateEntity: UpdateEntity?, val updateDirective: UpdateDirective?)

data class OnUpdateResponseLoadedResult(val shouldDownloadManifestIfPresentInResponse: Boolean)

interface LoaderStatusCallbacks {
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
   * Called when a response has been downloaded. The calling class should determine whether or not
   * the RemoteLoader should continue to download the manifest in the manifest part of the update response,
   * based on (for example) whether or not it already has the update downloaded locally.
   *
   * @param updateResponse Response downloaded by Loader
   * @return true if Loader should download the manifest described in the manifest part of the update response,
   * false if not.
   */
  fun onUpdateResponseLoaded(updateResponse: UpdateResponse): OnUpdateResponseLoadedResult
}

/**
 * Abstract class responsible for loading an update, enumerating the assets required for
 * it to launch, and loading them all onto disk and into SQLite.
 *
 * There are two sources from which an update can be loaded - a remote server given a URL, and the
 * application package. These correspond to the two loader subclasses.
 */
abstract class Loader(
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  private val database: UpdatesDatabase,
  private val updatesDirectory: File,
  private val loaderFiles: LoaderFiles
) {
  protected abstract suspend fun loadRemoteUpdate(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
  ): UpdateResponse

  protected abstract suspend fun loadAsset(
    context: Context,
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
  ): FileDownloader.AssetDownloadResult

  suspend fun load(statusCallbacks: LoaderStatusCallbacks): LoaderResult {
    val updateResponse = loadRemoteUpdate(context, database, configuration)

    val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest
    val onUpdateResponseLoadedResult = statusCallbacks.onUpdateResponseLoaded(updateResponse)
    return if (updateManifest !== null && onUpdateResponseLoadedResult.shouldDownloadManifestIfPresentInResponse) {
      // if onUpdateResponseLoaded returns true that is a sign that the delegate wants the update manifest
      // to be processed/downloaded, and therefore the updateManifest needs to exist
      val updateEntity = processUpdateManifest(updateManifest, statusCallbacks)
      finishWithSuccess(updateEntity, updateResponse)
    } else {
      finishWithSuccess(null, updateResponse)
    }
  }

  private fun finishWithSuccess(updateEntity: UpdateEntity?, updateResponse: UpdateResponse): LoaderResult {
    // store the header data even if only a message was included in the response
    updateResponse.responseHeaderData?.let {
      ManifestMetadata.saveMetadata(it, database, configuration)
    }
    val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
    return LoaderResult(
      updateEntity = updateEntity,
      updateDirective = updateDirective
    )
  }

  private suspend fun processUpdateManifest(updateManifest: UpdateManifest, statusCallbacks: LoaderStatusCallbacks): UpdateEntity {
    if (updateManifest.isDevelopmentMode) {
      // insert into database but don't try to load any assets;
      // the RN runtime will take care of that and we don't want to cache anything
      val updateEntity = updateManifest.updateEntity
      database.updateDao().insertUpdate(updateEntity!!)
      database.updateDao().markUpdateFinished(updateEntity)
      return updateEntity
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

    return if (existingUpdateEntity != null && existingUpdateEntity.status == UpdateStatus.READY) {
      // hooray, we already have this update downloaded and ready to go!
      existingUpdateEntity
    } else {
      val updateEntity = if (existingUpdateEntity == null) {
        // no update already exists with this ID, so we need to insert it and download everything.
        database.updateDao().insertUpdate(newUpdateEntity)
        newUpdateEntity
      } else {
        // we've already partially downloaded the update, so we should use the existing entity.
        // however, it's not ready, so we should try to download all the assets again.
        existingUpdateEntity
      }
      downloadAllAssets(updateEntity, updateManifest.assetEntityList, statusCallbacks)
      return updateEntity
    }
  }

  private enum class AssetLoadResult {
    FINISHED, ALREADY_EXISTS, ERRORED
  }

  private suspend fun downloadAllAssets(updateEntity: UpdateEntity, assetList: List<AssetEntity>, statusCallbacks: LoaderStatusCallbacks) {
    coroutineScope {
      val erroredAssetList = mutableListOf<AssetEntity>()
      val existingAssetList = mutableListOf<AssetEntity>()
      val finishedAssetList = mutableListOf<AssetEntity>()
      val assetTotal = assetList.size

      val assetResults = assetList.map { assetEntityCur ->
        async {
          var assetEntity = assetEntityCur
          val matchingDbEntry = database.assetDao().loadAssetWithKey(assetEntity.key)
          if (matchingDbEntry != null) {
            // merge all fields not stored in the database onto matchingDbEntry,
            // in case we need them later on in this class
            database.assetDao().mergeAndUpdateAsset(matchingDbEntry, assetEntity)
            assetEntity = matchingDbEntry
          }

          // if we already have a local copy of this asset, don't try to download it again!
          if (assetEntity.relativePath != null && loaderFiles.fileExists(
              File(updatesDirectory, assetEntity.relativePath)
            )
          ) {
            existingAssetList.add(assetEntity)
            statusCallbacks.onAssetLoaded(
              assetEntity,
              finishedAssetList.size + existingAssetList.size,
              erroredAssetList.size,
              assetTotal
            )
            return@async Pair(assetEntity, Loader.AssetLoadResult.ALREADY_EXISTS)
          }

          val assetDownloadResult = try {
            loadAsset(context, assetEntity, updatesDirectory, configuration)
          } catch (e: Exception) {
            val identifier = if (assetEntity.hash != null) "hash " + UpdatesUtils.bytesToHex(
              assetEntity.hash!!
            ) else "key " + assetEntity.key
            Log.e(TAG, "Failed to download asset with $identifier", e)
            existingAssetList.add(assetEntity)
            statusCallbacks.onAssetLoaded(
              assetEntity,
              finishedAssetList.size + existingAssetList.size,
              erroredAssetList.size,
              assetTotal
            )
            return@async Pair(assetEntity, Loader.AssetLoadResult.ERRORED)
          }

          if (assetDownloadResult.isNew) {
            finishedAssetList.add(assetEntity)
          } else {
            existingAssetList.add(assetEntity)
          }
          statusCallbacks.onAssetLoaded(
            assetEntity,
            finishedAssetList.size + existingAssetList.size,
            erroredAssetList.size,
            assetTotal
          )
          return@async Pair(assetEntity, if (assetDownloadResult.isNew) Loader.AssetLoadResult.FINISHED else Loader.AssetLoadResult.ALREADY_EXISTS)
        }
      }

      assert(finishedAssetList.size + erroredAssetList.size + existingAssetList.size == assetTotal) { "incorrect asset count" }

      try {
        for (asset in existingAssetList) {
          val existingAssetFound = database.assetDao().addExistingAssetToUpdate(updateEntity, asset, asset.isLaunchAsset)
          if (!existingAssetFound) {
            // the database and filesystem have gotten out of sync
            // do our best to create a new entry for this file even though it already existed on disk
            // TODO: we should probably get rid of this assumption that if an asset exists on disk with the same filename, it's the same asset
            val hash = try {
              UpdatesUtils.sha256(File(updatesDirectory, asset.relativePath))
            } catch (e: Exception) {
              null
            }
            asset.downloadTime = Date()
            asset.hash = hash
            finishedAssetList.add(asset)
          }
        }

        database.assetDao().insertAssets(finishedAssetList, updateEntity)

        if (erroredAssetList.size == 0) {
          database.updateDao().markUpdateFinished(updateEntity)
        }
      } catch (e: Exception) {
        throw Exception("Error while adding new update to database", e)
      }

      if (erroredAssetList.size > 0) {
        throw Exception("Failed to load all assets")
      }
    }
  }

  companion object {
    private val TAG = Loader::class.java.simpleName
  }
}
