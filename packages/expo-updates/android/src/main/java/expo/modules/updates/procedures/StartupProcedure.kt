package expo.modules.updates.procedures

import android.content.Context
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.rncompatibility.ReactNativeFeatureFlags
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.errorrecovery.ErrorRecovery
import expo.modules.updates.errorrecovery.ErrorRecoveryDelegate
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.Update
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

class StartupProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val logger: UpdatesLogger,
  private val callback: StartupProcedureCallback,
  private val procedureScope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : StateMachineProcedure() {
  override val loggerTimerLabel = "timer-startup"

  interface StartupProcedureCallback {
    fun onFinished()
    fun onRequestRelaunch(shouldRunReaper: Boolean, callback: Launcher.LauncherCallback)
  }

  private lateinit var procedureContext: ProcedureContext

  var launcher: Launcher? = null
    private set
  fun setLauncher(launcher: Launcher) {
    this.launcher = launcher
  }

  val launchAssetFile
    get() = launcher?.launchAssetFile
  val bundleAssetName: String?
    get() = launcher?.bundleAssetName
  val localAssetFiles: Map<AssetEntity, String>?
    get() = launcher?.localAssetFiles
  val isUsingEmbeddedAssets: Boolean
    get() = launcher?.isUsingEmbeddedAssets ?: false
  val launchedUpdate: UpdateEntity?
    get() = launcher?.launchedUpdate

  var emergencyLaunchException: Exception? = null
    private set
  private val errorRecovery = ErrorRecovery(logger, ReactNativeFeatureFlags.enableBridgelessArchitecture)
  private var remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

  private val loaderTask = LoaderTask(
    context,
    updatesConfiguration,
    databaseHolder,
    updatesDirectory,
    fileDownloader,
    selectionPolicy,
    logger,
    object : LoaderTask.LoaderTaskCallback {
      override fun onFailure(e: Exception) {
        logger.error("UpdatesController loaderTask onFailure", e, UpdatesErrorCode.None)
        launcher = NoDatabaseLauncher(context, logger, e)
        emergencyLaunchException = e
        notifyController()
      }

      override fun onSuccess(launcher: Launcher, isUpToDate: Boolean) {
        if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING && isUpToDate) {
          remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
        }
        this@StartupProcedure.launcher = launcher
        notifyController()
      }

      override fun onFinishedAllLoading() {
        procedureContext.processStateEvent(UpdatesStateEvent.EndStartup())
        procedureContext.onComplete()
      }

      override fun onCachedUpdateLoaded(update: UpdateEntity): Boolean {
        return true
      }

      override fun onRemoteCheckForUpdateStarted() {
        procedureContext.processStateEvent(UpdatesStateEvent.Check())
      }

      override fun onRemoteCheckForUpdateFinished(result: LoaderTask.RemoteCheckResult) {
        val event = when (result) {
          is LoaderTask.RemoteCheckResult.NoUpdateAvailable -> UpdatesStateEvent.CheckCompleteUnavailable()
          is LoaderTask.RemoteCheckResult.UpdateAvailable -> UpdatesStateEvent.CheckCompleteWithUpdate(result.manifest)
          is LoaderTask.RemoteCheckResult.RollBackToEmbedded -> UpdatesStateEvent.CheckCompleteWithRollback(result.commitTime)
        }
        procedureContext.processStateEvent(event)
      }

      override fun onRemoteUpdateManifestResponseUpdateLoaded(update: Update) {
        remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
      }

      override fun onRemoteUpdateLoadStarted() {
        procedureContext.processStateEvent(UpdatesStateEvent.Download())
      }

      override fun onRemoteUpdateAssetLoaded(
        asset: AssetEntity,
        successfulAssetCount: Int,
        failedAssetCount: Int,
        totalAssetCount: Int
      ) {
        val body = mapOf(
          "assetInfo" to mapOf(
            "name" to asset.embeddedAssetFilename,
            "successfulAssetCount" to successfulAssetCount,
            "failedAssetCount" to failedAssetCount,
            "totalAssetCount" to totalAssetCount
          )
        )
        logger.info("AppController appLoaderTask didLoadAsset: $body", UpdatesErrorCode.None, null, asset.expectedHash)
      }

      override fun onRemoteUpdateFinished(
        status: LoaderTask.RemoteUpdateStatus,
        update: UpdateEntity?,
        exception: Exception?
      ) {
        when (status) {
          LoaderTask.RemoteUpdateStatus.ERROR -> {
            if (exception == null) {
              throw AssertionError("Background update with error status must have a nonnull exception object")
            }
            logger.error("UpdatesController onBackgroundUpdateFinished", exception, UpdatesErrorCode.Unknown)
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

            // Since errors can happen through a number of paths, we do these checks
            // to make sure the state machine is valid
            when (procedureContext.getCurrentState()) {
              UpdatesStateValue.Idle -> {
                procedureContext.processStateEvent(UpdatesStateEvent.Download())
                procedureContext.processStateEvent(
                  UpdatesStateEvent.DownloadError(exception.message ?: "")
                )
              }
              UpdatesStateValue.Checking -> {
                procedureContext.processStateEvent(
                  UpdatesStateEvent.CheckError(exception.message ?: "")
                )
              }
              else -> {
                // .downloading
                procedureContext.processStateEvent(
                  UpdatesStateEvent.DownloadError(exception.message ?: "")
                )
              }
            }
          }
          LoaderTask.RemoteUpdateStatus.UPDATE_AVAILABLE -> {
            if (update == null) {
              throw AssertionError("Background update with error status must have a nonnull update object")
            }
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
            logger.info("UpdatesController onBackgroundUpdateFinished: Update available", UpdatesErrorCode.None)
            procedureContext.processStateEvent(
              UpdatesStateEvent.DownloadCompleteWithUpdate(update.manifest)
            )
          }
          LoaderTask.RemoteUpdateStatus.NO_UPDATE_AVAILABLE -> {
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            logger.info("UpdatesController onBackgroundUpdateFinished: No update available", UpdatesErrorCode.NoUpdatesAvailable)
            // TODO: handle rollbacks properly, but this works for now
            if (procedureContext.getCurrentState() == UpdatesStateValue.Downloading) {
              procedureContext.processStateEvent(UpdatesStateEvent.DownloadComplete())
            }
          }
        }
        errorRecovery.notifyNewRemoteLoadStatus(remoteLoadStatus)
      }
    }
  )

  override suspend fun run(procedureContext: ProcedureContext) {
    this.procedureContext = procedureContext
    procedureContext.processStateEvent(UpdatesStateEvent.StartStartup())
    initializeErrorRecovery()
    loaderTask.start()
  }

  @Synchronized
  private fun notifyController() {
    if (launcher == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }

    callback.onFinished()
  }

  fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {
    if (emergencyLaunchException != null) {
      return
    }
    errorRecovery.startMonitoring(devSupportManager)
  }

  fun onReactInstanceException(exception: Exception) {
    errorRecovery.onReactInstanceException(exception)
  }

  private fun setRemoteLoadStatus(status: ErrorRecoveryDelegate.RemoteLoadStatus) {
    remoteLoadStatus = status
    errorRecovery.notifyNewRemoteLoadStatus(status)
  }

  private fun initializeErrorRecovery() {
    errorRecovery.initialize(object : ErrorRecoveryDelegate {
      override fun loadRemoteUpdate() {
        if (loaderTask.isRunning) {
          return
        }
        remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
        val remoteLoader = RemoteLoader(context, updatesConfiguration, logger, databaseHolder.database, fileDownloader, updatesDirectory, launchedUpdate)
        remoteLoader.start(object : Loader.LoaderCallback {
          override fun onFailure(e: Exception) {
            logger.error("UpdatesController loadRemoteUpdate onFailure", e, UpdatesErrorCode.UpdateFailedToLoad, launchedUpdate?.loggingId, null)
            setRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            setRemoteLoadStatus(
              if (loaderResult.updateEntity != null || loaderResult.updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              } else {
                ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
              }
            )
          }

          override fun onAssetLoaded(asset: AssetEntity, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) { }

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

            val update = updateResponse.manifestUpdateResponsePart?.update ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
            return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(update.updateEntity, launchedUpdate, updateResponse.responseHeaderData?.manifestFilters))
          }
        })
      }

      override fun relaunch(callback: Launcher.LauncherCallback) {
        this@StartupProcedure.callback.onRequestRelaunch(shouldRunReaper = false, callback)
      }
      override fun throwException(exception: Exception) {
        throw exception
      }

      override fun markFailedLaunchForLaunchedUpdate() {
        if (emergencyLaunchException != null) {
          return
        }
        procedureScope.launch {
          val launchedUpdate = launchedUpdate ?: return@launch
          databaseHolder.withDatabase { it.updateDao().incrementFailedLaunchCount(launchedUpdate) }
        }
      }

      override fun markSuccessfulLaunchForLaunchedUpdate() {
        if (emergencyLaunchException != null) {
          return
        }
        procedureScope.launch {
          val launchedUpdate = launchedUpdate ?: return@launch
          databaseHolder.withDatabase { it.updateDao().incrementSuccessfulLaunchCount(launchedUpdate) }
        }
      }

      override fun getRemoteLoadStatus() = remoteLoadStatus
      override fun getCheckAutomaticallyConfiguration() = updatesConfiguration.checkOnLaunch
      override fun getLaunchedUpdateSuccessfulLaunchCount() = launchedUpdate?.successfulLaunchCount ?: 0
    })
  }
}
