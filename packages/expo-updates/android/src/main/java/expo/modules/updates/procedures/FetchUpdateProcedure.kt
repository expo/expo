package expo.modules.updates.procedures

import android.content.Context
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class FetchUpdateProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val logger: UpdatesLogger,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val launchedUpdate: UpdateEntity?,
  private val callback: (IUpdatesController.FetchUpdateResult) -> Unit
) : StateMachineProcedure() {
  override val loggerTimerLabel = "timer-fetch-update"

  override suspend fun run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(UpdatesStateEvent.Download())

    val database = databaseHolder.database
    try {
      val loaderResult = startRemoteLoader(database)
      processSuccessLoaderResult(loaderResult, procedureContext)
    } catch (e: Exception) {
      logger.error("Failed to download new update", e)
      procedureContext.processStateEvent(
        UpdatesStateEvent.DownloadError("Failed to download new update: ${e.message}")
      )
      callback(IUpdatesController.FetchUpdateResult.ErrorResult(e))
    } finally {
      procedureContext.onComplete()
    }
  }

  private suspend fun startRemoteLoader(database: UpdatesDatabase): Loader.LoaderResult =
    suspendCancellableCoroutine { continuation ->
      RemoteLoader(
        context,
        updatesConfiguration,
        logger,
        database,
        fileDownloader,
        updatesDirectory,
        launchedUpdate
      )
        .start(
          object : Loader.LoaderCallback {
            override fun onFailure(e: Exception) {
              if (continuation.isActive) {
                continuation.resumeWithException(e)
              }
            }

            override fun onAssetLoaded(
              asset: AssetEntity,
              successfulAssetCount: Int,
              failedAssetCount: Int,
              totalAssetCount: Int
            ) = Unit

            override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): Loader.OnUpdateResponseLoadedResult {
              val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
              if (updateDirective != null) {
                return Loader.OnUpdateResponseLoadedResult(
                  shouldDownloadManifestIfPresentInResponse = when (updateDirective) {
                    is UpdateDirective.RollBackToEmbeddedUpdateDirective -> false
                    is UpdateDirective.NoUpdateAvailableUpdateDirective -> false
                  }
                )
              }

              val update = updateResponse.manifestUpdateResponsePart?.update
                ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)

              return Loader.OnUpdateResponseLoadedResult(
                shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(
                  update.updateEntity,
                  launchedUpdate,
                  updateResponse.responseHeaderData?.manifestFilters
                )
              )
            }

            override fun onSuccess(loaderResult: Loader.LoaderResult) {
              if (continuation.isActive) {
                continuation.resume(loaderResult)
              }
            }
          }
        )
    }

  private fun processSuccessLoaderResult(loaderResult: Loader.LoaderResult, procedureContext: ProcedureContext) {
    RemoteLoader.processSuccessLoaderResult(
      context,
      updatesConfiguration,
      logger,
      databaseHolder.database,
      selectionPolicy,
      updatesDirectory,
      launchedUpdate,
      loaderResult
    ) { availableUpdate, didRollBackToEmbedded ->
      if (didRollBackToEmbedded) {
        procedureContext.processStateEvent(UpdatesStateEvent.DownloadCompleteWithRollback())
        callback(IUpdatesController.FetchUpdateResult.RollBackToEmbedded())
      } else {
        if (availableUpdate == null) {
          procedureContext.processStateEvent(UpdatesStateEvent.DownloadComplete())
          callback(IUpdatesController.FetchUpdateResult.Failure())
        } else {
          procedureContext.processStateEvent(UpdatesStateEvent.DownloadCompleteWithUpdate(availableUpdate.manifest))
          callback(IUpdatesController.FetchUpdateResult.Success(availableUpdate))
        }
      }
    }
  }
}
