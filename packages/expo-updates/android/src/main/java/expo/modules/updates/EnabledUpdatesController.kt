@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package expo.modules.updates

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.procedures.CheckForUpdateProcedure
import expo.modules.updates.procedures.FetchUpdateProcedure
import expo.modules.updates.procedures.RelaunchProcedure
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.procedures.StartupProcedure
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import java.io.File
import java.lang.ref.WeakReference

// this needs to stay for versioning to work

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
class EnabledUpdatesController(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  override val updatesDirectory: File
) : IUpdatesController, UpdatesStateChangeEventSender {
  private val reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference(context.reactNativeHost)
  } else {
    null
  }
  private val logger = UpdatesLogger(context)
  private val fileDownloader = FileDownloader(context)
  private val selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    updatesConfiguration.getRuntimeVersion()
  )
  private val stateMachine = UpdatesStateMachine(context, this)
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

  @Synchronized
  private fun onStartupProcedureFinished() {
    isStartupFinished = true
    (this@EnabledUpdatesController as java.lang.Object).notify()
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

      override fun onLegacyJSEvent(event: StartupProcedure.StartupProcedureCallback.LegacyJSEvent) {
        when (event) {
          is StartupProcedure.StartupProcedureCallback.LegacyJSEvent.Error -> sendLegacyUpdateEventToJS(
            UPDATE_ERROR_EVENT,
            Arguments.createMap().apply {
              putString("message", event.exception.message)
            }
          )
          is StartupProcedure.StartupProcedureCallback.LegacyJSEvent.NoUpdateAvailable -> sendLegacyUpdateEventToJS(UPDATE_NO_UPDATE_AVAILABLE_EVENT, null)
          is StartupProcedure.StartupProcedureCallback.LegacyJSEvent.UpdateAvailable -> sendLegacyUpdateEventToJS(
            UPDATE_AVAILABLE_EVENT,
            Arguments.createMap().apply {
              putString("manifestString", event.manifest.toString())
            }
          )
        }
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
  override val isEmergencyLaunch: Boolean
    get() = startupProcedure.isEmergencyLaunch

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

  override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    startupProcedure.onDidCreateReactInstanceManager(reactInstanceManager)
  }

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
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      reactNativeHost,
      getCurrentLauncher = { startupProcedure.launcher!! },
      setCurrentLauncher = { currentLauncher -> startupProcedure.setLauncher(currentLauncher) },
      shouldRunReaper = shouldRunReaper,
      callback
    )
    stateMachine.queueExecution(procedure)
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

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
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

    private const val UPDATE_AVAILABLE_EVENT = "updateAvailable"
    private const val UPDATE_NO_UPDATE_AVAILABLE_EVENT = "noUpdateAvailable"
    private const val UPDATE_ERROR_EVENT = "error"

    const val UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent"
    const val UPDATES_STATE_CHANGE_EVENT_NAME = "Expo.nativeUpdatesStateChangeEvent"
  }
}
