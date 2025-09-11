package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File

data class ProcessSuccessLoaderResult(
  val availableUpdate: UpdateEntity?,
  val didRollBackToEmbedded: Boolean
)

/**
 * Subclass of [Loader] which handles downloading updates from a remote server.
 *
 * Unlike [EmbeddedLoader], it needs to manage file downloading. Currently, it does not skip
 * any assets, meaning all assets must be downloaded in order for the update to be considered
 * ready to launch.
 */
class RemoteLoader internal constructor(
  context: Context,
  configuration: UpdatesConfiguration,
  logger: UpdatesLogger,
  database: UpdatesDatabase,
  private val mFileDownloader: FileDownloader,
  updatesDirectory: File,
  private val launchedUpdate: UpdateEntity?,
  private val loaderFiles: LoaderFiles
) : Loader(context, configuration, logger, database, updatesDirectory, loaderFiles) {
  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    fileDownloader: FileDownloader,
    updatesDirectory: File,
    launchedUpdate: UpdateEntity?
  ) : this(context, configuration, logger, database, fileDownloader, updatesDirectory, launchedUpdate, LoaderFiles())

  override suspend fun loadRemoteUpdate(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): UpdateResponse {
    val embeddedUpdate = loaderFiles.readEmbeddedUpdate(context, configuration)?.updateEntity
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(database, configuration, launchedUpdate, embeddedUpdate)
    return mFileDownloader.downloadRemoteUpdate(extraHeaders)
  }

  override suspend fun loadAsset(
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    requestedUpdate: UpdateEntity?,
    embeddedUpdate: UpdateEntity?
  ): FileDownloader.AssetDownloadResult {
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteAssetRequest(launchedUpdate, embeddedUpdate, requestedUpdate)
    return mFileDownloader.downloadAsset(assetEntity, updatesDirectory, extraHeaders, { progress ->
      assetLoadProgressListener(assetEntity, progress)
    })
  }

  companion object {
    private val TAG = RemoteLoader::class.java.simpleName

    suspend fun processSuccessLoaderResult(
      context: Context,
      configuration: UpdatesConfiguration,
      logger: UpdatesLogger,
      database: UpdatesDatabase,
      selectionPolicy: SelectionPolicy,
      directory: File,
      launchedUpdate: UpdateEntity?,
      loaderResult: LoaderResult
    ): ProcessSuccessLoaderResult {
      val updateEntity = loaderResult.updateEntity
      val updateDirective = loaderResult.updateDirective

      return if (updateDirective != null && updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
        val didRollBackToEmbedded = processRollBackToEmbeddedDirective(context, configuration, logger, database, selectionPolicy, directory, launchedUpdate, updateDirective)
        ProcessSuccessLoaderResult(null, didRollBackToEmbedded)
      } else {
        ProcessSuccessLoaderResult(updateEntity, false)
      }
    }

    /**
     * If directive is to roll-back to the embedded update and there is an embedded update,
     * we need to update embedded update in the DB with the newer commitTime from the directive
     * so that the selection policy will choose it. That way future updates can continue to be applied
     * over this roll back, but older ones won't.
     */
    private suspend fun processRollBackToEmbeddedDirective(
      context: Context,
      configuration: UpdatesConfiguration,
      logger: UpdatesLogger,
      database: UpdatesDatabase,
      selectionPolicy: SelectionPolicy,
      directory: File,
      launchedUpdate: UpdateEntity?,
      updateDirective: UpdateDirective.RollBackToEmbeddedUpdateDirective
    ): Boolean {
      if (!configuration.hasEmbeddedUpdate) {
        return false
      }

      val embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, configuration)!!.updateEntity
      val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
      if (!selectionPolicy.shouldLoadRollBackToEmbeddedDirective(updateDirective, embeddedUpdate, launchedUpdate, manifestFilters)) {
        return false
      }

      // update the embedded update commit time in the in-memory embedded update since it is a singleton
      embeddedUpdate.commitTime = updateDirective.commitTime

      // update the embedded update commit time in the database (requires loading and then updating)
      return try {
        val embeddedLoader = EmbeddedLoader(context, configuration, logger, database, directory)
        val loaderResult = embeddedLoader.load {
          OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
        }
        val embeddedUpdateToLoad = loaderResult.updateEntity
        database.updateDao().setUpdateCommitTime(embeddedUpdateToLoad!!, updateDirective.commitTime)
        true
      } catch (e: Exception) {
        logger.error("Embedded update erroneously null when applying roll back to embedded directive", e, UpdatesErrorCode.UpdateFailedToLoad)
        false
      }
    }
  }
}
