package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.Deferred
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.Update
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.io.File
import java.io.IOException
import java.util.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Abstract class responsible for loading an update, enumerating the assets required for
 * it to launch, and loading them all onto disk and into SQLite.
 *
 * There are two sources from which an update can be loaded - a remote server given a URL, and the
 * application package. These correspond to the two loader subclasses.
 */
abstract class Loader protected constructor(
  protected val context: Context,
  private val configuration: UpdatesConfiguration,
  protected val logger: UpdatesLogger,
  private val database: UpdatesDatabase,
  private val updatesDirectory: File,
  private val loaderFiles: LoaderFiles,
  private var scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
) {
  private var updateResponse: UpdateResponse? = null
  private var updateEntity: UpdateEntity? = null
  private var assetTotal = 0
  private var erroredAssetList = mutableListOf<AssetEntity>()
  private var existingAssetList = mutableListOf<AssetEntity>()
  private var finishedAssetList = mutableListOf<AssetEntity>()
  private val _progressFlow = MutableSharedFlow<AssetLoadProgress>()
  private var assetProgressMap: MutableMap<AssetEntity, Double> = ConcurrentHashMap()

  internal var assetLoadProgressBlock: ((Double) -> Unit)? = null

  val progressFlow: Flow<AssetLoadProgress> = _progressFlow.asSharedFlow()

  data class LoaderResult(val updateEntity: UpdateEntity?, val updateDirective: UpdateDirective?)

  data class OnUpdateResponseLoadedResult(val shouldDownloadManifestIfPresentInResponse: Boolean)

  data class AssetLoadProgress(
    val asset: AssetEntity,
    val successfulAssetCount: Int,
    val failedAssetCount: Int,
    val totalAssetCount: Int
  )

  fun assetLoadProgressListener(asset: AssetEntity, progress: Double) {
    assetProgressMap[asset] = progress
    notifyAssetLoadProgress()
  }

  private fun notifyAssetLoadProgress() {
    if (assetTotal > 0) {
      val progress = assetProgressMap.values.sum() / assetTotal.toDouble()
      assetLoadProgressBlock?.invoke(progress)
    }
  }

  protected abstract suspend fun loadRemoteUpdate(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): UpdateResponse

  protected abstract suspend fun loadAsset(
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    requestedUpdate: UpdateEntity?,
    embeddedUpdate: UpdateEntity?
  ): FileDownloader.AssetDownloadResult

  suspend fun load(updateResponseDecision: (UpdateResponse) -> OnUpdateResponseLoadedResult): LoaderResult {
    try {
      val updateResponse = loadRemoteUpdate(database, configuration)
      this@Loader.updateResponse = updateResponse
      val update = updateResponse.manifestUpdateResponsePart?.update
      val onUpdateResponseLoadedResult = updateResponseDecision(updateResponse)

      if (update !== null && onUpdateResponseLoadedResult.shouldDownloadManifestIfPresentInResponse) {
        // if onUpdateResponseLoaded returns true that is a sign that the delegate wants the update manifest
        // to be processed/downloaded, and therefore the update needs to exist
        return processUpdate(update)
      } else {
        updateEntity = null
        return finish()
      }
    } catch (e: Exception) {
      logger.error("Load error", e, UpdatesErrorCode.UpdateFailedToLoad)
      throw e
    }
  }

  private fun reset() {
    updateResponse = null
    updateEntity = null
    assetTotal = 0
    erroredAssetList = mutableListOf()
    existingAssetList = mutableListOf()
    finishedAssetList = mutableListOf()
    assetProgressMap = ConcurrentHashMap()
    assetLoadProgressBlock = null
  }

  private fun finish(): LoaderResult {
    // store the header data even if only a message was included in the response
    updateResponse!!.responseHeaderData?.let {
      ManifestMetadata.saveMetadata(it, database, configuration)
    }

    val updateDirective = updateResponse!!.directiveUpdateResponsePart?.updateDirective

    val result = LoaderResult(
      updateEntity = this.updateEntity,
      updateDirective = updateDirective
    )
    reset()
    return result
  }

  // private helper methods
  private suspend fun processUpdate(update: Update): LoaderResult {
    if (update.isDevelopmentMode) {
      // insert into database but don't try to load any assets;
      // the RN runtime will take care of that and we don't want to cache anything
      val updateEntity = update.updateEntity
      database.updateDao().insertUpdate(updateEntity!!)
      database.updateDao().markUpdateFinished(updateEntity)
      this.updateEntity = updateEntity
      return finish()
    }

    val newUpdateEntity = update.updateEntity
    val existingUpdateEntity = database.updateDao().loadUpdateWithId(
      newUpdateEntity!!.id
    )

    // if something has gone wrong on the server and we have two updates with the same id
    // but different scope keys, we should try to launch something rather than show a cryptic
    // error to the user.
    if (existingUpdateEntity != null && existingUpdateEntity.scopeKey != newUpdateEntity.scopeKey) {
      logger.warn("Loaded an update with the same ID but a different scopeKey than one we already have on disk. This is a server error. Overwriting the scopeKey and loading the existing update.")
      database.updateDao().setUpdateScopeKey(existingUpdateEntity, newUpdateEntity.scopeKey)
    }

    if (existingUpdateEntity != null && existingUpdateEntity.status == UpdateStatus.READY) {
      // hooray, we already have this update downloaded and ready to go!
      updateEntity = existingUpdateEntity
      return finish()
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
      return downloadAllAssets(update)
    }
  }

  private enum class AssetLoadResult {
    FINISHED,
    ALREADY_EXISTS,
    ERRORED
  }

  private suspend fun downloadAllAssets(update: Update): LoaderResult {
    val assetList = update.assetEntityList
    assetTotal = assetList.size

    val embeddedUpdate = loaderFiles.readEmbeddedUpdate(context, configuration)
    val assetDownloadJobs = mutableListOf<Deferred<AssetLoadResult>>()

    for (assetEntityCur in assetList) {
      var assetEntity = assetEntityCur

      val matchingDbEntry = database.assetDao().loadAssetWithKey(assetEntity.key)
      if (matchingDbEntry != null) {
        // merge all fields not stored in the database onto matchingDbEntry,
        // in case we need them later on in this class
        database.assetDao().mergeAndUpdateAsset(matchingDbEntry, assetEntity)
        assetEntity = matchingDbEntry
      }

      // if we already have a local copy of this asset, don't try to download it again!
      if (assetEntity.relativePath != null &&
        loaderFiles.fileExists(context, updatesDirectory, assetEntity.relativePath)
      ) {
        handleAssetDownloadCompleted(assetEntity, AssetLoadResult.ALREADY_EXISTS)
        continue
      }

      val job = scope.async {
        val result = loadAsset(
          assetEntity,
          updatesDirectory,
          configuration,
          requestedUpdate = update.updateEntity,
          embeddedUpdate = embeddedUpdate?.updateEntity
        )

        handleAssetDownloadCompleted(
          result.assetEntity,
          if (result.isNew) AssetLoadResult.FINISHED else AssetLoadResult.ALREADY_EXISTS
        )
      }
      assetDownloadJobs.add(job)
    }

    // Wait for all asset downloads to complete - this will throw the first exception that occurs
    assetDownloadJobs.awaitAll()

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
          } catch (_: Exception) {
          }
          asset.downloadTime = Date()
          asset.hash = hash
          finishedAssetList.add(asset)
        }
      }

      database.assetDao().insertAssets(finishedAssetList, updateEntity!!)
      database.updateDao().markUpdateFinished(updateEntity!!)
    } catch (e: Exception) {
      throw IOException("Error while adding new update to database", e)
    }

    return finish()
  }

  private suspend fun handleAssetDownloadCompleted(assetEntity: AssetEntity, result: AssetLoadResult): AssetLoadResult {
    when (result) {
      AssetLoadResult.FINISHED -> finishedAssetList.add(assetEntity)
      AssetLoadResult.ALREADY_EXISTS -> existingAssetList.add(assetEntity)
      AssetLoadResult.ERRORED -> erroredAssetList.add(assetEntity)
    }

    // do not emit progress update for errored assets
    // let the progress bar stay at whatever the last successful progress was
    if (result == AssetLoadResult.FINISHED || result == AssetLoadResult.ALREADY_EXISTS) {
      assetProgressMap[assetEntity] = 1.0
      notifyAssetLoadProgress()
    }

    _progressFlow.emit(
      AssetLoadProgress(
        asset = assetEntity,
        successfulAssetCount = finishedAssetList.size + existingAssetList.size,
        failedAssetCount = erroredAssetList.size,
        totalAssetCount = assetTotal
      )
    )

    return result
  }

  companion object {
    private val TAG = Loader::class.java.simpleName
  }
}
