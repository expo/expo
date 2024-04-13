package expo.modules.updates

import android.app.Activity
import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.procedures.CheckForUpdateProcedure
import expo.modules.updates.procedures.FetchUpdateProcedure
import expo.modules.updates.procedures.RelaunchProcedure
import expo.modules.updates.procedures.StartupProcedure
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import java.io.File
import java.lang.ref.WeakReference

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
class EnabledUpdatesController(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  override val updatesDirectory: File
) : IUpdatesController, UpdatesStateChangeEventSender {
  override var appContext: WeakReference<AppContext>? = null

  /** Keep the activity for [RelaunchProcedure] to relaunch the app. */
  private var weakActivity: WeakReference<Activity>? = null
  private val logger = UpdatesLogger(context)
  private val fileDownloader = FileDownloader(context, updatesConfiguration)
  private val selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    updatesConfiguration.getRuntimeVersion()
  )
  private val stateMachine = UpdatesStateMachine(context, this, UpdatesStateValue.values().toSet())
  private val databaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(context))

  private fun purgeUpdatesLogsOlderThanOneDay() {
    UpdatesLogReader(context).purgeLogEntries {
      if (it != null) {
        Log.e(TAG, "UpdatesLogReader: error in purgeLogEntries", it)
      }
    }
  }

  private var isStarted = false

  private var isStartupFinished = false

  override var shouldEmitJsEvents = false
    set(value) {
      field = value
      UpdatesUtils.sendQueuedEventsToAppContext(value, appContext, logger)
    }

  @Synchronized
  private fun onStartupProcedureFinished() {
    isStartupFinished = true
    (this@EnabledUpdatesController as java.lang.Object).notify()
    UpdatesUtils.sendQueuedEventsToAppContext(shouldEmitJsEvents, appContext, logger)
  }

  private val startupProcedure = StartupProcedure(
    context,
    updatesConfiguration,
    databaseHolder,
    updatesDirectory,
    fileDownloader,
    selectionPolicy,
    logger,
    object : StartupProcedure.StartupProcedureCallback {
      override fun onFinished() {
        onStartupProcedureFinished()
      }

      override fun onRequestRelaunch(shouldRunReaper: Boolean, callback: LauncherCallback) {
        relaunchReactApplication(shouldRunReaper, callback)
      }
    }
  )

  private val launchedUpdate
    get() = startupProcedure.launchedUpdate
  private val isUsingEmbeddedAssets
    get() = startupProcedure.isUsingEmbeddedAssets
  private val localAssetFiles
    get() = startupProcedure.localAssetFiles

  @get:Synchronized
  override val launchAssetFile: String?
    get() {
      while (!isStartupFinished) {
        try {
          (this as java.lang.Object).wait()
        } catch (e: InterruptedException) {
          Log.e(TAG, "Interrupted while waiting for launch asset file", e)
        }
      }
      return startupProcedure.launchAssetFile
    }
  override val bundleAssetName: String?
    get() = startupProcedure.bundleAssetName

  override fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {
    startupProcedure.onDidCreateDevSupportManager(devSupportManager)
  }

  override fun onDidCreateReactInstance(reactContext: ReactContext) {
    weakActivity = WeakReference(reactContext.currentActivity)
  }

  override fun onReactInstanceException(exception: Exception) {
    startupProcedure.onReactInstanceException(exception)
  }

  override val isActiveController = true

  @Synchronized
  override fun start() {
    if (isStarted) {
      return
    }
    isStarted = true

    purgeUpdatesLogsOlderThanOneDay()

    BuildData.ensureBuildDataIsConsistent(updatesConfiguration, databaseHolder.database)
    databaseHolder.releaseDatabase()

    stateMachine.queueExecution(startupProcedure)
  }

  private fun relaunchReactApplication(shouldRunReaper: Boolean, callback: LauncherCallback) {
    val procedure = RelaunchProcedure(
      context,
      weakActivity,
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      getCurrentLauncher = { startupProcedure.launcher!! },
      setCurrentLauncher = { currentLauncher -> startupProcedure.setLauncher(currentLauncher) },
      shouldRunReaper = shouldRunReaper,
      callback
    )
    stateMachine.queueExecution(procedure)
  }

  override fun sendUpdateStateChangeEventToAppContext(eventType: UpdatesStateEventType, context: UpdatesStateContext) {
    sendEventToJS(UPDATES_STATE_CHANGE_EVENT_NAME, eventType.type, context.writableMap)
  }

  private fun sendEventToJS(eventName: String, eventType: String, params: WritableMap?) {
    UpdatesUtils.sendEventToAppContext(shouldEmitJsEvents, appContext, logger, eventName, eventType, params)
  }

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launchedUpdate,
      embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, updatesConfiguration)?.updateEntity,
      emergencyLaunchException = startupProcedure.emergencyLaunchException,
      isEnabled = true,
      isUsingEmbeddedAssets = isUsingEmbeddedAssets,
      runtimeVersion = updatesConfiguration.runtimeVersionRaw,
      checkOnLaunch = updatesConfiguration.checkOnLaunch,
      requestHeaders = updatesConfiguration.requestHeaders,
      localAssetFiles = localAssetFiles,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false
    )
  }

  override fun relaunchReactApplicationForModule(callback: IUpdatesController.ModuleCallback<Unit>) {
    val canRelaunch = launchedUpdate != null
    if (!canRelaunch) {
      callback.onFailure(object : CodedException("ERR_UPDATES_RELOAD", "Cannot relaunch without a launched update.", null) {})
    } else {
      relaunchReactApplication(
        shouldRunReaper = true,
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

  override fun checkForUpdate(callback: IUpdatesController.ModuleCallback<IUpdatesController.CheckForUpdateResult>) {
    val procedure = CheckForUpdateProcedure(context, updatesConfiguration, databaseHolder, logger, fileDownloader, selectionPolicy, launchedUpdate) {
      callback.onSuccess(it)
    }
    stateMachine.queueExecution(procedure)
  }

  override fun fetchUpdate(callback: IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult>) {
    val procedure = FetchUpdateProcedure(context, updatesConfiguration, databaseHolder, updatesDirectory, fileDownloader, selectionPolicy, launchedUpdate) {
      callback.onSuccess(it)
    }
    stateMachine.queueExecution(procedure)
  }

  override fun getExtraParams(callback: IUpdatesController.ModuleCallback<Bundle>) {
    AsyncTask.execute {
      try {
        val result = ManifestMetadata.getExtraParams(
          databaseHolder.database,
          updatesConfiguration
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
  }
}
