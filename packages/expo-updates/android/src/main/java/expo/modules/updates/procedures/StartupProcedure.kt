package expo.modules.updates.procedures

import android.content.Context
import android.os.AsyncTask
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JSBundleLoader
import expo.modules.updates.EnabledUpdatesController
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.errorrecovery.ErrorRecovery
import expo.modules.updates.errorrecovery.ErrorRecoveryDelegate
import expo.modules.updates.launcher.DatabaseLauncher
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
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import org.json.JSONObject
import java.io.File
import java.lang.ref.WeakReference

class StartupProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val stateMachine: UpdatesStateMachine,
  private val logger: UpdatesLogger,
  private val callback: StartupProcedureCallback
) {
  interface StartupProcedureCallback {
    fun onFinished()

    sealed class LegacyJSEvent(private val type: Type) {
      private enum class Type {
        ERROR,
        UPDATE_AVAILABLE,
        NO_UPDATE_AVAILABLE
      }

      class NoUpdateAvailable : LegacyJSEvent(Type.NO_UPDATE_AVAILABLE)
      class UpdateAvailable(val manifest: JSONObject) : LegacyJSEvent(Type.UPDATE_AVAILABLE)
      class Error(val exception: Exception) : LegacyJSEvent(Type.ERROR)
    }
    fun onLegacyJSEvent(event: LegacyJSEvent)
  }

  private var reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference(context.reactNativeHost)
  } else {
    null
  }

  private var launcher: Launcher? = null

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

  var isEmergencyLaunch = false
    private set
  private val errorRecovery = ErrorRecovery(context)
  private var remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

  // TODO: move away from DatabaseHolder pattern to Handler thread
  private val databaseHandlerThread = HandlerThread("expo-updates-database")
  private lateinit var databaseHandler: Handler
  private fun initializeDatabaseHandler() {
    if (!::databaseHandler.isInitialized) {
      databaseHandlerThread.start()
      databaseHandler = Handler(databaseHandlerThread.looper)
    }
  }

  private val loaderTask = LoaderTask(
    updatesConfiguration,
    databaseHolder,
    updatesDirectory,
    fileDownloader,
    selectionPolicy,
    object : LoaderTask.LoaderTaskCallback {
      override fun onFailure(e: Exception) {
        logger.error("UpdatesController loaderTask onFailure: ${e.localizedMessage}", UpdatesErrorCode.None)
        launcher = NoDatabaseLauncher(context, e)
        isEmergencyLaunch = true
        notifyController()
      }

      override fun onCachedUpdateLoaded(update: UpdateEntity): Boolean {
        return true
      }

      override fun onRemoteCheckForUpdateStarted() {
        stateMachine.processEvent(UpdatesStateEvent.Check())
      }

      override fun onRemoteCheckForUpdateFinished(result: LoaderTask.RemoteCheckResult) {
        val event = when (result) {
          is LoaderTask.RemoteCheckResult.NoUpdateAvailable -> UpdatesStateEvent.CheckCompleteUnavailable()
          is LoaderTask.RemoteCheckResult.UpdateAvailable -> UpdatesStateEvent.CheckCompleteWithUpdate(result.manifest)
          is LoaderTask.RemoteCheckResult.RollBackToEmbedded -> UpdatesStateEvent.CheckCompleteWithRollback(result.commitTime)
        }
        stateMachine.processEvent(event)
      }

      override fun onRemoteUpdateManifestResponseManifestLoaded(updateManifest: UpdateManifest) {
        remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
      }

      override fun onSuccess(launcher: Launcher, isUpToDate: Boolean) {
        if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING && isUpToDate) {
          remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
        }
        this@StartupProcedure.launcher = launcher
        notifyController()
      }

      override fun onRemoteUpdateLoadStarted() {
        stateMachine.processEvent(UpdatesStateEvent.Download())
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
            logger.error("UpdatesController onBackgroundUpdateFinished: Error: ${exception.localizedMessage}", UpdatesErrorCode.Unknown, exception)
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            callback.onLegacyJSEvent(StartupProcedureCallback.LegacyJSEvent.Error(exception))

            // Since errors can happen through a number of paths, we do these checks
            // to make sure the state machine is valid
            when (stateMachine.state) {
              UpdatesStateValue.Idle -> {
                stateMachine.processEvent(UpdatesStateEvent.Download())
                stateMachine.processEvent(
                  UpdatesStateEvent.DownloadError(exception.message ?: "")
                )
              }
              UpdatesStateValue.Checking -> {
                stateMachine.processEvent(
                  UpdatesStateEvent.CheckError(exception.message ?: "")
                )
              }
              else -> {
                // .downloading
                stateMachine.processEvent(
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
            callback.onLegacyJSEvent(StartupProcedureCallback.LegacyJSEvent.UpdateAvailable(update.manifest))
            stateMachine.processEvent(
              UpdatesStateEvent.DownloadCompleteWithUpdate(update.manifest)
            )
          }
          LoaderTask.RemoteUpdateStatus.NO_UPDATE_AVAILABLE -> {
            remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            logger.error("UpdatesController onBackgroundUpdateFinished: No update available", UpdatesErrorCode.NoUpdatesAvailable)
            callback.onLegacyJSEvent(StartupProcedureCallback.LegacyJSEvent.NoUpdateAvailable())
            // TODO: handle rollbacks properly, but this works for now
            if (stateMachine.state == UpdatesStateValue.Downloading) {
              stateMachine.processEvent(UpdatesStateEvent.DownloadComplete())
            }
          }
        }
        errorRecovery.notifyNewRemoteLoadStatus(remoteLoadStatus)
      }
    }
  )

  fun run() {
    initializeDatabaseHandler()
    initializeErrorRecovery()
    loaderTask.start(context)
  }

  @Synchronized
  private fun notifyController() {
    if (launcher == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }

    callback.onFinished()
  }

  fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    if (isEmergencyLaunch) {
      return
    }
    errorRecovery.startMonitoring(reactInstanceManager)
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
        val remoteLoader = RemoteLoader(context, updatesConfiguration, databaseHolder.database, fileDownloader, updatesDirectory, launchedUpdate)
        remoteLoader.start(object : Loader.LoaderCallback {
          override fun onFailure(e: Exception) {
            logger.error("UpdatesController loadRemoteUpdate onFailure: ${e.localizedMessage}", UpdatesErrorCode.UpdateFailedToLoad, launchedUpdate?.loggingId, null)
            setRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
            databaseHolder.releaseDatabase()
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            setRemoteLoadStatus(
              if (loaderResult.updateEntity != null || loaderResult.updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              else ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            )
            databaseHolder.releaseDatabase()
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

            val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
            return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = selectionPolicy.shouldLoadNewUpdate(updateManifest.updateEntity, launchedUpdate, updateResponse.responseHeaderData?.manifestFilters))
          }
        })
      }

      override fun relaunch(callback: Launcher.LauncherCallback) { relaunchReactApplication(false, callback) }
      override fun throwException(exception: Exception) { throw exception }

      override fun markFailedLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          databaseHolder.database.updateDao().incrementFailedLaunchCount(launchedUpdate)
          databaseHolder.releaseDatabase()
        }
      }

      override fun markSuccessfulLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          databaseHolder.database.updateDao().incrementSuccessfulLaunchCount(launchedUpdate)
          databaseHolder.releaseDatabase()
        }
      }

      override fun getRemoteLoadStatus() = remoteLoadStatus
      override fun getCheckAutomaticallyConfiguration() = updatesConfiguration.checkOnLaunch
      override fun getLaunchedUpdateSuccessfulLaunchCount() = launchedUpdate?.successfulLaunchCount ?: 0
    })
  }

  fun relaunchReactApplication(shouldRunReaper: Boolean, callback: Launcher.LauncherCallback) {
    val host = reactNativeHost?.get()
    if (host == null) {
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    stateMachine.processEvent(UpdatesStateEvent.Restart())

    val oldLaunchAssetFile = launcher!!.launchAssetFile

    val newLauncher = DatabaseLauncher(
      updatesConfiguration,
      updatesDirectory,
      fileDownloader,
      selectionPolicy
    )
    newLauncher.launch(
      databaseHolder.database,
      context,
      object : Launcher.LauncherCallback {
        override fun onFailure(e: Exception) {
          callback.onFailure(e)
        }

        override fun onSuccess() {
          launcher = newLauncher
          databaseHolder.releaseDatabase()

          val instanceManager = host.reactInstanceManager

          val newLaunchAssetFile = launcher!!.launchAssetFile
          if (newLaunchAssetFile != null && newLaunchAssetFile != oldLaunchAssetFile) {
            // Unfortunately, even though RN exposes a way to reload an application,
            // it assumes that the JS bundle will stay at the same location throughout
            // the entire lifecycle of the app. Since we need to change the location of
            // the bundle, we need to use reflection to set an otherwise inaccessible
            // field of the ReactInstanceManager.
            try {
              val newJSBundleLoader = JSBundleLoader.createFileLoader(newLaunchAssetFile)
              val jsBundleLoaderField = instanceManager.javaClass.getDeclaredField("mBundleLoader")
              jsBundleLoaderField.isAccessible = true
              jsBundleLoaderField[instanceManager] = newJSBundleLoader
            } catch (e: Exception) {
              Log.e(TAG, "Could not reset JSBundleLoader in ReactInstanceManager", e)
            }
          }
          callback.onSuccess()
          val handler = Handler(Looper.getMainLooper())
          handler.post { instanceManager.recreateReactContextInBackground() }
          if (shouldRunReaper) {
            runReaper()
          }
          stateMachine.reset()
        }
      }
    )
  }

  private fun runReaper() {
    AsyncTask.execute {
      Reaper.reapUnusedUpdates(
        updatesConfiguration,
        databaseHolder.database,
        updatesDirectory,
        launchedUpdate,
        selectionPolicy
      )
      databaseHolder.releaseDatabase()
    }
  }

  companion object {
    private val TAG = EnabledUpdatesController::class.java.simpleName
  }
}
