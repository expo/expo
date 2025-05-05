package expo.modules.updates.procedures

import android.content.Context
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.updates.IUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class CheckForUpdateProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesLogger: UpdatesLogger,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val launchedUpdate: UpdateEntity?,
  private val callback: (IUpdatesController.CheckForUpdateResult) -> Unit
) : StateMachineProcedure() {
  override val loggerTimerLabel = "timer-check-for-update"

  override suspend fun run(procedureContext: ProcedureContext) {
    procedureContext.processStateEvent(UpdatesStateEvent.Check())

    val embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, updatesConfiguration)?.updateEntity
    val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(
      databaseHolder.database,
      updatesConfiguration,
      launchedUpdate,
      embeddedUpdate
    )

    try {
      val updateResponse = downloadRemoteUpdate(extraHeaders)
      processUpdatesResponse(updateResponse, procedureContext, embeddedUpdate)
    } catch (e: Exception) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckError(e.localizedMessageWithCauseLocalizedMessage()))
      callback(IUpdatesController.CheckForUpdateResult.ErrorResult(e))
      procedureContext.onComplete()
    }
  }

  private suspend fun downloadRemoteUpdate(extraHeaders: JSONObject) = suspendCancellableCoroutine { continuation ->
    fileDownloader.downloadRemoteUpdate(
      extraHeaders,
      object : FileDownloader.RemoteUpdateDownloadCallback {
        override fun onFailure(e: Exception) {
          if (continuation.isActive) {
            continuation.resumeWithException(e)
          }
        }

        override fun onSuccess(updateResponse: UpdateResponse) {
          if (continuation.isActive) {
            continuation.resume(updateResponse)
          }
        }
      }
    )
  }

  private fun processUpdatesResponse(updateResponse: UpdateResponse, procedureContext: ProcedureContext, embeddedUpdate: UpdateEntity?) {
    val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
    val update = updateResponse.manifestUpdateResponsePart?.update

    updateDirective?.let { directive ->
      when (directive) {
        is UpdateDirective.NoUpdateAvailableUpdateDirective -> {
          procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
          callback(
            IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
              LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
            )
          )
          procedureContext.onComplete()
          return
        }

        is UpdateDirective.RollBackToEmbeddedUpdateDirective -> {
          if (!updatesConfiguration.hasEmbeddedUpdate) {
            procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
            callback(
              IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
                LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
              )
            )
            procedureContext.onComplete()
            return
          }

          if (embeddedUpdate == null) {
            procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
            callback(
              IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
                LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
              )
            )
            procedureContext.onComplete()
            return
          }

          if (!selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
              directive,
              embeddedUpdate,
              launchedUpdate,
              updateResponse.responseHeaderData?.manifestFilters
            )
          ) {
            procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
            callback(
              IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
                LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_REJECTED_BY_SELECTION_POLICY
              )
            )
            procedureContext.onComplete()
            return
          }

          procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithRollback(directive.commitTime))
          callback(IUpdatesController.CheckForUpdateResult.RollBackToEmbedded(directive.commitTime))
          procedureContext.onComplete()
          return
        }
      }
    }

    if (update == null) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
      callback(
        IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(
          LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
        )
      )
      procedureContext.onComplete()
      return
    }

    if (launchedUpdate == null) {
      // this shouldn't ever happen, but if we don't have anything to compare
      // the new manifest to, let the user know an update is available
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithUpdate(update.manifest.getRawJson()))
      callback(IUpdatesController.CheckForUpdateResult.UpdateAvailable(update))
      procedureContext.onComplete()
      return
    }

    var shouldLaunch = false
    var failedPreviously = false
    if (selectionPolicy.shouldLoadNewUpdate(
        update.updateEntity,
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
      update.updateEntity?.let { updateEntity ->
        val storedUpdateEntity = databaseHolder.database.updateDao().loadUpdateWithId(
          updateEntity.id
        )
        storedUpdateEntity?.let {
          shouldLaunch = it.failedLaunchCount == 0
          updatesLogger.info("Stored update found: ID = ${updateEntity.id}, failureCount = ${it.failedLaunchCount}")
          failedPreviously = !shouldLaunch
        }
      }
    }

    if (shouldLaunch) {
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteWithUpdate(update.manifest.getRawJson()))
      callback(IUpdatesController.CheckForUpdateResult.UpdateAvailable(update))
      procedureContext.onComplete()
    } else {
      val reason = when (failedPreviously) {
        true -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_PREVIOUSLY_FAILED
        else -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
      }
      procedureContext.processStateEvent(UpdatesStateEvent.CheckCompleteUnavailable())
      callback(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(reason))
      procedureContext.onComplete()
    }
  }
}
