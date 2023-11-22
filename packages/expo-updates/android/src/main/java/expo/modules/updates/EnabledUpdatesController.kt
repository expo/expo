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
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
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
  private var reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
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

  private val startupProcedure = StartupProcedure(
    context,
    updatesConfiguration,
    databaseHolder,
    updatesDirectory,
    fileDownloader,
    selectionPolicy,
    logger,
    object : StartupProcedure.StartupProcedureCallback {
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

      override suspend fun onRequestRelaunch(shouldRunReaper: Boolean) {
        relaunchReactApplication(shouldRunReaper)
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

  override suspend fun start() {
    if (isStarted) {
      return
    }
    isStarted = true

    purgeUpdatesLogsOlderThanOneDay()

    BuildData.ensureBuildDataIsConsistent(updatesConfiguration, databaseHolder.database)
    databaseHolder.releaseDatabase()

    val startupProcedureResult = stateMachine.queueExecution(startupProcedure)

    if (startupProcedureResult.shouldPerformAdditionalBackgroundLoad) {
      GlobalScope.launch {
        fetchUpdate()
      }
    }

    isStartupFinished = true
    (this as java.lang.Object).notify()
  }

  private suspend fun relaunchReactApplication(shouldRunReaper: Boolean) {
    val procedure = RelaunchProcedure(
      context,
      updatesConfiguration,
      databaseHolder,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      reactNativeHost,
      getCurrentLauncherResult = { startupProcedure.launcherResult!! },
      setCurrentLauncherResult = { currentLauncherResult -> startupProcedure.setLauncherResult(currentLauncherResult) },
      shouldRunReaper = shouldRunReaper,
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
    )
  }

  override suspend fun relaunchReactApplicationForModule() {
    val canRelaunch = launchedUpdate != null
    if (!canRelaunch) {
      throw CodedException("ERR_UPDATES_RELOAD", "Cannot relaunch without a launched update.", null)
    }
    relaunchReactApplication(shouldRunReaper = true)
  }

  override fun getNativeStateMachineContext(callback: IUpdatesController.ModuleCallback<UpdatesStateContext>) {
    callback.onSuccess(stateMachine.context)
  }

  override suspend fun checkForUpdate(): IUpdatesController.CheckForUpdateResult {
    val procedure = CheckForUpdateProcedure(context, updatesConfiguration, databaseHolder, logger, fileDownloader, selectionPolicy, launchedUpdate)
    return stateMachine.queueExecution(procedure)
  }

  override suspend fun fetchUpdate(): IUpdatesController.FetchUpdateResult {
    val procedure = FetchUpdateProcedure(context, updatesConfiguration, databaseHolder, updatesDirectory, fileDownloader, selectionPolicy, launchedUpdate)
    return stateMachine.queueExecution(procedure)
  }

  override suspend fun getExtraParams(): Bundle {
    try {
      val result = ManifestMetadata.getExtraParams(
        databaseHolder.database,
        updatesConfiguration,
      )
      databaseHolder.releaseDatabase()
      return when (result) {
        null -> Bundle()
        else -> {
          Bundle().apply {
            result.forEach {
              putString(it.key, it.value)
            }
          }
        }
      }
    } catch (e: Exception) {
      databaseHolder.releaseDatabase()
      throw e
    }
  }

  override suspend fun setExtraParam(key: String, value: String?) {
    try {
      ManifestMetadata.setExtraParam(
        databaseHolder.database,
        updatesConfiguration,
        key,
        value
      )
      databaseHolder.releaseDatabase()
    } catch (e: Exception) {
      databaseHolder.releaseDatabase()
      throw e
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
