package expo.modules.updates.procedures

import android.content.Context
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderStatusCallbacks
import expo.modules.updates.loader.OnUpdateResponseLoadedResult
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
) : StateMachineProcedure<IUpdatesController.FetchUpdateResult>() {
  override suspend fun run(procedureContext: ProcedureContext): IUpdatesController.FetchUpdateResult {
    procedureContext.processStateEvent(UpdatesStateEvent.Download())

    val database = databaseHolder.database
    val loaderResult = try {
      RemoteLoader(
        context,
        updatesConfiguration,
        database,
        fileDownloader,
        updatesDirectory,
        launchedUpdate
      ).load(object : LoaderStatusCallbacks {
        override fun onAssetLoaded(
          asset: AssetEntity,
          successfulAssetCount: Int,
          failedAssetCount: Int,
          totalAssetCount: Int
        ) {
        }

        override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): OnUpdateResponseLoadedResult {
          val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
          if (updateDirective != null) {
            return OnUpdateResponseLoadedResult(
              shouldDownloadManifestIfPresentInResponse = when (updateDirective) {
                is UpdateDirective.RollBackToEmbeddedUpdateDirective -> false
                is UpdateDirective.NoUpdateAvailableUpdateDirective -> false
              }
            )
          }

          val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest
            ?: return OnUpdateResponseLoadedResult(
              shouldDownloadManifestIfPresentInResponse = false
            )

          return OnUpdateResponseLoadedResult(
            shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(
              updateManifest.updateEntity,
              launchedUpdate,
              updateResponse.responseHeaderData?.manifestFilters
            )
          )
        }
      })
    } catch (e: Exception) {
      databaseHolder.releaseDatabase()
      procedureContext.processStateEvent(
        UpdatesStateEvent.DownloadError("Failed to download new update: ${e.message}")
      )
      return IUpdatesController.FetchUpdateResult.ErrorResult(e)
    }

    val processSuccessLoaderResultResult = RemoteLoader.processSuccessLoaderResult(
      context,
      updatesConfiguration,
      database,
      selectionPolicy,
      updatesDirectory,
      launchedUpdate,
      loaderResult
    )

    databaseHolder.releaseDatabase()

    if (processSuccessLoaderResultResult.didRollBackToEmbedded) {
      procedureContext.processStateEvent(UpdatesStateEvent.DownloadCompleteWithRollback())
      return IUpdatesController.FetchUpdateResult.RollBackToEmbedded()
    } else {
      return if (processSuccessLoaderResultResult.availableUpdate == null) {
        procedureContext.processStateEvent(UpdatesStateEvent.DownloadComplete())
        IUpdatesController.FetchUpdateResult.Failure()
      } else {
        procedureContext.processStateEvent(
          UpdatesStateEvent.DownloadCompleteWithUpdate(
            processSuccessLoaderResultResult.availableUpdate.manifest
          )
        )
        IUpdatesController.FetchUpdateResult.Success(processSuccessLoaderResultResult.availableUpdate)
      }
    }
  }
}
