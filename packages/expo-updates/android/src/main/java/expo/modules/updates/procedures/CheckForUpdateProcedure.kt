package expo.modules.updates.procedures

import android.content.Context
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent

class CheckForUpdateProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesLogger: UpdatesLogger,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val launchedUpdate: UpdateEntity?,
) : StateMachineProcedure<IUpdatesController.CheckForUpdateResult>() {
  override suspend fun run(procedureContext: ProcedureContext): IUpdatesController.CheckForUpdateResult {
    procedureContext.processStateEvent(UpdatesStateEvent.Check())

    val embeddedUpdate = EmbeddedManifest.get(context, updatesConfiguration)?.updateEntity
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(
      databaseHolder.database,
      updatesConfiguration,
      launchedUpdate,
      embeddedUpdate
    )
    databaseHolder.releaseDatabase()
    val updateResponse = try {
      fileDownloader.downloadRemoteUpdate(
        updatesConfiguration,
        extraHeaders,
        context,
      )
    } catch (e: Exception) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckError(e.message ?: ""))
      return IUpdatesController.CheckForUpdateResult.ErrorResult(e, e.message ?: "")
    }

    val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
    val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest

    if (updateDirective != null) {
      if (updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
        if (!updatesConfiguration.hasEmbeddedUpdate) {
          procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
          return IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
            LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
          )
        }

        if (embeddedUpdate == null) {
          procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
          return IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
            LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
          )
        }

        if (!selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
            updateDirective,
            embeddedUpdate,
            launchedUpdate,
            updateResponse.responseHeaderData?.manifestFilters
          )
        ) {
          procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
          return IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
            LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_REJECTED_BY_SELECTION_POLICY
          )
        }

        procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithRollback(updateDirective.commitTime))
        return IUpdatesController.CheckForUpdateResult.RollBackToEmbedded(updateDirective.commitTime)
      }
    }

    if (updateManifest == null) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
      return IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
        LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
      )
    }

    if (launchedUpdate == null) {
      // this shouldn't ever happen, but if we don't have anything to compare
      // the new manifest to, let the user know an update is available
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithUpdate(updateManifest.manifest.getRawJson()))
      return IUpdatesController.CheckForUpdateResult.UpdateAvailable(updateManifest)
    }

    var shouldLaunch = false
    var failedPreviously = false
    if (selectionPolicy.shouldLoadNewUpdate(
        updateManifest.updateEntity,
        launchedUpdate,
        updateResponse.responseHeaderData?.manifestFilters
      )
    ) {
      // If "update" has failed to launch previously, then
      // "launchedUpdate" will be an earlier update, and the test above
      // will return true (incorrectly).
      // We check to see if the new update is already in the DB, and if so,
      // only allow the update if it has had no launch failures.
      shouldLaunch = true
      updateManifest.updateEntity?.let { updateEntity ->
        val storedUpdateEntity = databaseHolder.database.updateDao().loadUpdateWithId(
          updateEntity.id
        )
        databaseHolder.releaseDatabase()
        storedUpdateEntity?.let {
          shouldLaunch = it.failedLaunchCount == 0
          updatesLogger.info("Stored update found: ID = ${updateEntity.id}, failureCount = ${it.failedLaunchCount}")
          failedPreviously = !shouldLaunch
        }
      }
    }
    if (shouldLaunch) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithUpdate(updateManifest.manifest.getRawJson()))
      return IUpdatesController.CheckForUpdateResult.UpdateAvailable(updateManifest)
    } else {
      val reason = when (failedPreviously) {
        true -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_PREVIOUSLY_FAILED
        else -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
      }
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
      return IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(reason)
    }
  }
}
