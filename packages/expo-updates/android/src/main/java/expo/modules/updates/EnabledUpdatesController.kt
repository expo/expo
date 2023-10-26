package expo.modules.updates

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.errorrecovery.ErrorRecovery
import expo.modules.updates.errorrecovery.ErrorRecoveryDelegate
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.loader.LoaderTask.LoaderTaskCallback
import expo.modules.updates.loader.LoaderTask.RemoteUpdateStatus
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.loader.UpdateResponse
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import java.io.File
import java.lang.ref.WeakReference

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
class EnabledUpdatesController(
  context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  override val updatesDirectory: File
) : IUpdatesController, UpdatesStateChangeEventSender {
  private var reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference(context.reactNativeHost)
  } else {
    null
  }

  private val stateMachine = UpdatesStateMachine(context, this)

  private var launcher: Launcher? = null
  private val databaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(context))

  // TODO: move away from DatabaseHolder pattern to Handler thread
  private val databaseHandlerThread = HandlerThread("expo-updates-database")
  private lateinit var databaseHandler: Handler
  private fun initializeDatabaseHandler() {
    if (!::databaseHandler.isInitialized) {
      databaseHandlerThread.start()
      databaseHandler = Handler(databaseHandlerThread.looper)
    }
  }

  private fun purgeUpdatesLogsOlderThanOneDay(context: Context) {
    UpdatesLogReader(context).purgeLogEntries {
      if (it != null) {
        Log.e(TAG, "UpdatesLogReader: error in purgeLogEntries", it)
      }
    }
  }

  private val logger = UpdatesLogger(context)
  private var isStarted = false
  private var loaderTask: LoaderTask? = null
  private var remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE

  private val selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    updatesConfiguration.getRuntimeVersion()
  )
  private val fileDownloader = FileDownloader(context)
  private val errorRecovery = ErrorRecovery(context)

  private fun setRemoteLoadStatus(status: ErrorRecoveryDelegate.RemoteLoadStatus) {
    remoteLoadStatus = status
    errorRecovery.notifyNewRemoteLoadStatus(status)
  }

  // launch conditions
  private var isLoaderTaskFinished = false
  override var isEmergencyLaunch = false
    private set

  override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    if (isEmergencyLaunch) {
      return
    }
    errorRecovery.startMonitoring(reactInstanceManager)
  }

  @get:Synchronized
  override val launchAssetFile: String?
    get() {
      while (!isLoaderTaskFinished) {
        try {
          (this as java.lang.Object).wait()
        } catch (e: InterruptedException) {
          Log.e(TAG, "Interrupted while waiting for launch asset file", e)
        }
      }
      return launcher?.launchAssetFile
    }

  override val bundleAssetName: String?
    get() = launcher?.bundleAssetName

  private val localAssetFiles: Map<AssetEntity, String>?
    get() = launcher?.localAssetFiles

  private val isUsingEmbeddedAssets: Boolean
    get() = launcher?.isUsingEmbeddedAssets ?: false

  /**
   * Any process that calls this *must* manually release the lock by calling `releaseDatabase()` in
   * every possible case (success, error) as soon as it is finished.
   */
  private fun getDatabase(): UpdatesDatabase = databaseHolder.database

  private fun releaseDatabase() {
    databaseHolder.releaseDatabase()
  }

  val launchedUpdate: UpdateEntity?
    get() = launcher?.launchedUpdate

  @Synchronized
  override fun start(context: Context) {
    if (isStarted) {
      return
    }
    isStarted = true

    purgeUpdatesLogsOlderThanOneDay(context)

    initializeDatabaseHandler()
    initializeErrorRecovery(context)

    val databaseLocal = getDatabase()
    BuildData.ensureBuildDataIsConsistent(updatesConfiguration, databaseLocal)
    releaseDatabase()

    loaderTask = LoaderTask(
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      object : LoaderTaskCallback {
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
          this@EnabledUpdatesController.launcher = launcher
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
          status: RemoteUpdateStatus,
          update: UpdateEntity?,
          exception: Exception?
        ) {
          when (status) {
            RemoteUpdateStatus.ERROR -> {
              if (exception == null) {
                throw AssertionError("Background update with error status must have a nonnull exception object")
              }
              logger.error("UpdatesController onBackgroundUpdateFinished: Error: ${exception.localizedMessage}", UpdatesErrorCode.Unknown, exception)
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
              val params = Arguments.createMap()
              params.putString("message", exception.message)
              sendLegacyUpdateEventToJS(UPDATE_ERROR_EVENT, params)

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
            RemoteUpdateStatus.UPDATE_AVAILABLE -> {
              if (update == null) {
                throw AssertionError("Background update with error status must have a nonnull update object")
              }
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              logger.info("UpdatesController onBackgroundUpdateFinished: Update available", UpdatesErrorCode.None)
              val params = Arguments.createMap()
              params.putString("manifestString", update.manifest.toString())
              sendLegacyUpdateEventToJS(UPDATE_AVAILABLE_EVENT, params)
              stateMachine.processEvent(
                UpdatesStateEvent.DownloadCompleteWithUpdate(update.manifest)
              )
            }
            RemoteUpdateStatus.NO_UPDATE_AVAILABLE -> {
              remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
              logger.error("UpdatesController onBackgroundUpdateFinished: No update available", UpdatesErrorCode.NoUpdatesAvailable)
              sendLegacyUpdateEventToJS(UPDATE_NO_UPDATE_AVAILABLE_EVENT, null)
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
    loaderTask!!.start(context)
  }

  @Synchronized
  private fun notifyController() {
    if (launcher == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }
    isLoaderTaskFinished = true
    (this as java.lang.Object).notify()
  }

  private fun initializeErrorRecovery(context: Context) {
    errorRecovery.initialize(object : ErrorRecoveryDelegate {
      override fun loadRemoteUpdate() {
        if (loaderTask?.isRunning == true) {
          return
        }
        remoteLoadStatus = ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING
        val database = getDatabase()
        val remoteLoader = RemoteLoader(context, updatesConfiguration, database, fileDownloader, updatesDirectory, launchedUpdate)
        remoteLoader.start(object : Loader.LoaderCallback {
          override fun onFailure(e: Exception) {
            logger.error("UpdatesController loadRemoteUpdate onFailure: ${e.localizedMessage}", UpdatesErrorCode.UpdateFailedToLoad, launchedUpdate?.loggingId, null)
            setRemoteLoadStatus(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE)
            releaseDatabase()
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            setRemoteLoadStatus(
              if (loaderResult.updateEntity != null || loaderResult.updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED
              else ErrorRecoveryDelegate.RemoteLoadStatus.IDLE
            )
            releaseDatabase()
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

      override fun relaunch(callback: LauncherCallback) { relaunchReactApplication(context, false, callback) }
      override fun throwException(exception: Exception) { throw exception }

      override fun markFailedLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          val database = getDatabase()
          database.updateDao().incrementFailedLaunchCount(launchedUpdate)
          releaseDatabase()
        }
      }

      override fun markSuccessfulLaunchForLaunchedUpdate() {
        if (isEmergencyLaunch) {
          return
        }
        databaseHandler.post {
          val launchedUpdate = launchedUpdate ?: return@post
          val database = getDatabase()
          database.updateDao().incrementSuccessfulLaunchCount(launchedUpdate)
          releaseDatabase()
        }
      }

      override fun getRemoteLoadStatus() = remoteLoadStatus
      override fun getCheckAutomaticallyConfiguration() = updatesConfiguration.checkOnLaunch
      override fun getLaunchedUpdateSuccessfulLaunchCount() = launchedUpdate?.successfulLaunchCount ?: 0
    })
  }

  private fun runReaper() {
    AsyncTask.execute {
      val databaseLocal = getDatabase()
      Reaper.reapUnusedUpdates(
        updatesConfiguration,
        databaseLocal,
        updatesDirectory,
        launchedUpdate,
        selectionPolicy
      )
      releaseDatabase()
    }
  }

  private fun relaunchReactApplication(context: Context, callback: LauncherCallback) {
    relaunchReactApplication(context, true, callback)
  }

  private fun relaunchReactApplication(context: Context, shouldRunReaper: Boolean, callback: LauncherCallback) {
    val host = reactNativeHost?.get()
    if (host == null) {
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    stateMachine.processEvent(UpdatesStateEvent.Restart())

    val oldLaunchAssetFile = launcher!!.launchAssetFile

    val databaseLocal = getDatabase()
    val newLauncher = DatabaseLauncher(
      updatesConfiguration,
      updatesDirectory,
      fileDownloader,
      selectionPolicy
    )
    newLauncher.launch(
      databaseLocal, context,
      object : LauncherCallback {
        override fun onFailure(e: Exception) {
          callback.onFailure(e)
        }

        override fun onSuccess() {
          launcher = newLauncher
          releaseDatabase()

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

  override fun sendUpdateStateChangeEventToBridge(eventType: UpdatesStateEventType, context: UpdatesStateContext) {
    sendEventToJS(UPDATES_STATE_CHANGE_EVENT_NAME, eventType.type, context.writableMap)
  }

  private fun sendLegacyUpdateEventToJS(eventType: String, params: WritableMap?) {
    sendEventToJS(UPDATES_EVENT_NAME, eventType, params)
  }

  private fun sendEventToJS(eventName: String, eventType: String, params: WritableMap?) {
    UpdatesUtils.sendEventToReactNative(reactNativeHost, logger, eventName, eventType, params)
  }

  override fun getConstantsForModule(context: Context): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launchedUpdate,
      embeddedUpdate = EmbeddedManifest.get(context, updatesConfiguration)?.updateEntity,
      isEmergencyLaunch = isEmergencyLaunch,
      isEnabled = true,
      releaseChannel = updatesConfiguration.releaseChannel,
      isUsingEmbeddedAssets = isUsingEmbeddedAssets,
      runtimeVersion = updatesConfiguration.runtimeVersionRaw,
      checkOnLaunch = updatesConfiguration.checkOnLaunch,
      requestHeaders = updatesConfiguration.requestHeaders,
      localAssetFiles = localAssetFiles,
      isMissingRuntimeVersion = false,
    )
  }

  override fun relaunchReactApplicationForModule(context: Context, callback: IUpdatesController.ModuleCallback<Unit>) {
    val canRelaunch = launchedUpdate != null
    if (!canRelaunch) {
      callback.onFailure(object : CodedException("ERR_UPDATES_RELOAD", "Cannot relaunch without a launched update.", null) {})
    } else {
      relaunchReactApplication(
        context,
        object : LauncherCallback {
          override fun onFailure(e: Exception) {
            callback.onFailure(e.toCodedException())
          }

          override fun onSuccess() {
            callback.onSuccess(Unit)
          }
        }
      )
    }
  }

  override fun getNativeStateMachineContext(callback: IUpdatesController.ModuleCallback<UpdatesStateContext>) {
    callback.onSuccess(stateMachine.context)
  }

  override fun checkForUpdate(context: Context, callback: IUpdatesController.ModuleCallback<IUpdatesController.CheckForUpdateResult>) {
    stateMachine.processEvent(UpdatesStateEvent.Check())

    AsyncTask.execute {
      val embeddedUpdate = EmbeddedManifest.get(context, updatesConfiguration)?.updateEntity
      val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(
        databaseHolder.database,
        updatesConfiguration,
        launchedUpdate,
        embeddedUpdate
      )
      databaseHolder.releaseDatabase()
      fileDownloader.downloadRemoteUpdate(
        updatesConfiguration,
        extraHeaders,
        context,
        object : FileDownloader.RemoteUpdateDownloadCallback {
          override fun onFailure(message: String, e: Exception) {
            stateMachine.processEvent(UpdatesStateEvent.CheckError(message))
            callback.onSuccess(IUpdatesController.CheckForUpdateResult.ErrorResult(e, message))
          }

          override fun onSuccess(updateResponse: UpdateResponse) {
            val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
            val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest

            if (updateDirective != null) {
              if (updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                if (!updatesConfiguration.hasEmbeddedUpdate) {
                  callback.onSuccess(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED))
                  stateMachine.processEvent(UpdatesStateEvent.CheckCompleteUnavailable())
                  return
                }

                if (embeddedUpdate == null) {
                  callback.onSuccess(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED))
                  stateMachine.processEvent(UpdatesStateEvent.CheckCompleteUnavailable())
                  return
                }

                if (!selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
                    updateDirective,
                    embeddedUpdate,
                    launchedUpdate,
                    updateResponse.responseHeaderData?.manifestFilters
                  )
                ) {
                  callback.onSuccess(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_REJECTED_BY_SELECTION_POLICY))
                  stateMachine.processEvent(UpdatesStateEvent.CheckCompleteUnavailable())
                  return
                }

                callback.onSuccess(IUpdatesController.CheckForUpdateResult.RollBackToEmbedded(updateDirective.commitTime))
                stateMachine.processEvent(UpdatesStateEvent.CheckCompleteWithRollback(updateDirective.commitTime))
                return
              }
            }

            if (updateManifest == null) {
              callback.onSuccess(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER))
              UpdatesStateEvent.CheckCompleteUnavailable()
              return
            }

            if (launchedUpdate == null) {
              // this shouldn't ever happen, but if we don't have anything to compare
              // the new manifest to, let the user know an update is available
              callback.onSuccess(IUpdatesController.CheckForUpdateResult.UpdateAvailable(updateManifest))
              stateMachine.processEvent(UpdatesStateEvent.CheckCompleteWithUpdate(updateManifest.manifest.getRawJson()))
              return
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
                  logger.info("Stored update found: ID = ${updateEntity.id}, failureCount = ${it.failedLaunchCount}")
                  failedPreviously = !shouldLaunch
                }
              }
            }
            if (shouldLaunch) {
              callback.onSuccess(IUpdatesController.CheckForUpdateResult.UpdateAvailable(updateManifest))
              stateMachine.processEvent(UpdatesStateEvent.CheckCompleteWithUpdate(updateManifest.manifest.getRawJson()))
              return
            } else {
              val reason = when (failedPreviously) {
                true -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_PREVIOUSLY_FAILED
                else -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
              }
              callback.onSuccess(IUpdatesController.CheckForUpdateResult.NoUpdateAvailable(reason))
              stateMachine.processEvent(UpdatesStateEvent.CheckCompleteUnavailable())
              return
            }
          }
        }
      )
    }
  }

  override fun fetchUpdate(context: Context, callback: IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult>) {
    stateMachine.processEvent(UpdatesStateEvent.Download())

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
              callback.onSuccess(IUpdatesController.FetchUpdateResult.ErrorResult(e))
              stateMachine.processEvent(
                UpdatesStateEvent.DownloadError("Failed to download new update: ${e.message}")
              )
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
                  callback.onSuccess(IUpdatesController.FetchUpdateResult.RollBackToEmbedded())
                  stateMachine.processEvent(UpdatesStateEvent.DownloadCompleteWithRollback())
                } else {
                  if (availableUpdate == null) {
                    callback.onSuccess(IUpdatesController.FetchUpdateResult.Failure())
                    stateMachine.processEvent(UpdatesStateEvent.DownloadComplete())
                  } else {
                    // We need the explicit casting here because when in versioned expo-updates,
                    // the UpdateEntity and UpdatesModule are in different package namespace,
                    // Kotlin cannot do the smart casting for that case.
                    val updateEntity = loaderResult.updateEntity as UpdateEntity

                    callback.onSuccess(IUpdatesController.FetchUpdateResult.Success(updateEntity))
                    stateMachine.processEvent(UpdatesStateEvent.DownloadCompleteWithUpdate(updateEntity.manifest))
                  }
                }
              }
            }
          }
        )
    }
  }

  override fun getExtraParams(callback: IUpdatesController.ModuleCallback<Bundle>) {
    AsyncTask.execute {
      try {
        val result = ManifestMetadata.getExtraParams(
          databaseHolder.database,
          updatesConfiguration,
        )
        databaseHolder.releaseDatabase()
        val resultMap = when (result) {
          null -> Bundle()
          else -> {
            Bundle().apply {
              result.forEach {
                putString(it.key, it.value)
              }
            }
          }
        }
        callback.onSuccess(resultMap)
      } catch (e: Exception) {
        databaseHolder.releaseDatabase()
        callback.onFailure(e.toCodedException())
      }
    }
  }

  override fun setExtraParam(key: String, value: String?, callback: IUpdatesController.ModuleCallback<Unit>) {
    AsyncTask.execute {
      try {
        ManifestMetadata.setExtraParam(
          databaseHolder.database,
          updatesConfiguration,
          key,
          value
        )
        databaseHolder.releaseDatabase()
        callback.onSuccess(Unit)
      } catch (e: Exception) {
        databaseHolder.releaseDatabase()
        callback.onFailure(e.toCodedException())
      }
    }
  }

  companion object {
    private val TAG = EnabledUpdatesController::class.java.simpleName

    private const val UPDATE_AVAILABLE_EVENT = "updateAvailable"
    private const val UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable"
    private const val UPDATE_ERROR_EVENT = "error"

    private const val UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent"
    private const val UPDATES_STATE_CHANGE_EVENT_NAME = "Expo.nativeUpdatesStateChangeEvent"
  }
}
