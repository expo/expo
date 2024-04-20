package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.FileDownloader.RemoteUpdateDownloadCallback
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File

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
  database: UpdatesDatabase,
  private val mFileDownloader: FileDownloader,
  updatesDirectory: File,
  private val launchedUpdate: UpdateEntity?,
  private val loaderFiles: LoaderFiles
) : Loader(context, configuration, database, updatesDirectory, loaderFiles) {
  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    fileDownloader: FileDownloader,
    updatesDirectory: File,
    launchedUpdate: UpdateEntity?
  ) : this(context, configuration, database, fileDownloader, updatesDirectory, launchedUpdate, LoaderFiles())

  override fun loadRemoteUpdate(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    callback: RemoteUpdateDownloadCallback
  ) {
    val embeddedUpdate = loaderFiles.readEmbeddedUpdate(context, configuration)?.updateEntity
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(database, configuration, launchedUpdate, embeddedUpdate)
    mFileDownloader.downloadRemoteUpdate(extraHeaders, context, callback)
  }

  override fun loadAsset(
    context: Context,
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    callback: AssetDownloadCallback
  ) {
    mFileDownloader.downloadAsset(assetEntity, updatesDirectory, context, callback)
  }

  companion object {
    private val TAG = RemoteLoader::class.java.simpleName

    fun processSuccessLoaderResult(
      context: Context,
      configuration: UpdatesConfiguration,
      database: UpdatesDatabase,
      selectionPolicy: SelectionPolicy,
      directory: File,
      launchedUpdate: UpdateEntity?,
      loaderResult: LoaderResult,
      onComplete: (availableUpdate: UpdateEntity?, didRollBackToEmbedded: Boolean) -> Unit
    ) {
      val updateEntity = loaderResult.updateEntity
      val updateDirective = loaderResult.updateDirective

      if (updateDirective != null && updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
        processRollBackToEmbeddedDirective(context, configuration, database, selectionPolicy, directory, launchedUpdate, updateDirective) { didRollBackToEmbedded ->
          onComplete(null, didRollBackToEmbedded)
        }
      } else {
        onComplete(updateEntity, false)
      }
    }

    /**
     * If directive is to roll-back to the embedded update and there is an embedded update,
     * we need to update embedded update in the DB with the newer commitTime from the directive
     * so that the selection policy will choose it. That way future updates can continue to be applied
     * over this roll back, but older ones won't.
     */
    private fun processRollBackToEmbeddedDirective(
      context: Context,
      configuration: UpdatesConfiguration,
      database: UpdatesDatabase,
      selectionPolicy: SelectionPolicy,
      directory: File,
      launchedUpdate: UpdateEntity?,
      updateDirective: UpdateDirective.RollBackToEmbeddedUpdateDirective,
      onComplete: (didRollBackToEmbedded: Boolean) -> Unit
    ) {
      if (!configuration.hasEmbeddedUpdate) {
        onComplete(false)
        return
      }

      val embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, configuration)!!.updateEntity
      val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
      if (!selectionPolicy.shouldLoadRollBackToEmbeddedDirective(updateDirective, embeddedUpdate, launchedUpdate, manifestFilters)) {
        onComplete(false)
        return
      }

      // update the embedded update commit time in the in-memory embedded update since it is a singleton
      embeddedUpdate.commitTime = updateDirective.commitTime

      // update the embedded update commit time in the database (requires loading and then updating)
      EmbeddedLoader(context, configuration, database, directory).start(object : LoaderCallback {
        /**
         * This should never happen since we check for the embedded update above
         */
        override fun onFailure(e: Exception) {
          Log.e(TAG, "Embedded update erroneously null when applying roll back to embedded directive", e)
          onComplete(false)
        }

        override fun onSuccess(loaderResult: Loader.LoaderResult) {
          val embeddedUpdateToLoad = loaderResult.updateEntity
          database.updateDao().setUpdateCommitTime(embeddedUpdateToLoad!!, updateDirective.commitTime)
          onComplete(true)
        }

        override fun onAssetLoaded(
          asset: AssetEntity,
          successfulAssetCount: Int,
          failedAssetCount: Int,
          totalAssetCount: Int
        ) {
        }

        override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): OnUpdateResponseLoadedResult {
          return OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
        }
      })
    }
  }
}
