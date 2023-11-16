package expo.modules.updates.procedures

import android.content.Context
import android.os.AsyncTask
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.io.File

class FetchUpdateProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val launchedUpdate: UpdateEntity?,
  private val callback: (IUpdatesController.FetchUpdateResult) -> Unit
) : StateMachineProcedure() {
  override fun run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(UpdatesStateEvent.Download())

    AsyncTask.execute {
      val database = databaseHolder.database
      RemoteLoader(
        context,
        updatesConfiguration,
        database,
        fileDownloader,
        updatesDirectory,
        launchedUpdate
      )
        .start(
          object : Loader.LoaderCallback {
            override fun onFailure(e: Exception) {
              databaseHolder.releaseDatabase()
              callback(IUpdatesController.FetchUpdateResult.ErrorResult(e))
              procedureContext.processStateEvent(
                UpdatesStateEvent.DownloadError("Failed to download new update: ${e.message}")
              )
              procedureContext.onComplete()
            }

            override fun onAssetLoaded(
              asset: AssetEntity,
              successfulAssetCount: Int,
              failedAssetCount: Int,
              totalAssetCount: Int
            ) {
            }

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

              val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest
                ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)

              return Loader.OnUpdateResponseLoadedResult(
                shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(
                  updateManifest.updateEntity,
                  launchedUpdate,
                  updateResponse.responseHeaderData?.manifestFilters
                )
              )
            }

            override fun onSuccess(loaderResult: Loader.LoaderResult) {
              RemoteLoader.processSuccessLoaderResult(
                context,
                updatesConfiguration,
                database,
                selectionPolicy,
                updatesDirectory,
                launchedUpdate,
                loaderResult
              ) { availableUpdate, didRollBackToEmbedded ->
                databaseHolder.releaseDatabase()

                if (didRollBackToEmbedded) {
                  callback(IUpdatesController.FetchUpdateResult.RollBackToEmbedded())
                  procedureContext.processStateEvent(UpdatesStateEvent.DownloadCompleteWithRollback())
                  procedureContext.onComplete()
                } else {
                  if (availableUpdate == null) {
                    callback(IUpdatesController.FetchUpdateResult.Failure())
                    procedureContext.processStateEvent(UpdatesStateEvent.DownloadComplete())
                    procedureContext.onComplete()
                  } else {
                    callback(IUpdatesController.FetchUpdateResult.Success(availableUpdate))
                    procedureContext.processStateEvent(UpdatesStateEvent.DownloadCompleteWithUpdate(availableUpdate.manifest))
                    procedureContext.onComplete()
                  }
                }
              }
            }
          }
        )
    }
  }
}
