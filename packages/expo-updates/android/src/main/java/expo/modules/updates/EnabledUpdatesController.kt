package expo.modules.updates

import android.app.Activity
import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.db.BuildData
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.events.UpdatesEventManager
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.procedures.CheckForUpdateProcedure
import expo.modules.updates.procedures.FetchUpdateProcedure
import expo.modules.updates.procedures.RelaunchProcedure
import expo.modules.updates.procedures.StartupProcedure
import expo.modules.updates.selectionpolicy.SelectionPolicyFactory
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import java.io.File
import java.lang.ref.WeakReference
import kotlin.time.DurationUnit
import kotlin.time.toDuration

/**
 * Updates controller for applications that have updates enabled and properly-configured.
 */
class EnabledUpdatesController(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  override val updatesDirectory: File
) : IUpdatesController {
  /** Keep the activity for [RelaunchProcedure] to relaunch the app. */
  private var weakActivity: WeakReference<Activity>? = null
  private val logger = UpdatesLogger(context)
  override val eventManager: IUpdatesEventManager = UpdatesEventManager(logger)

  private val fileDownloader = FileDownloader(context, updatesConfiguration, logger)
  private val selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy(
    updatesConfiguration.getRuntimeVersion()
  )
  private val stateMachine = UpdatesStateMachine(logger, eventManager, UpdatesStateValue.entries.toSet())
  private val databaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(context))

  private fun purgeUpdatesLogsOlderThanOneDay() {
    UpdatesLogReader(context).purgeLogEntries {
      if (it != null) {
        logger.error("UpdatesLogReader: error in purgeLogEntries", it, UpdatesErrorCode.Unknown)
      }
    }
  }

  private var isStarted = false
  private var isStartupFinished = false
  private var startupStartTimeMillis: Long? = null
  private var startupEndTimeMillis: Long? = null

  @Synchronized
  private fun onStartupProcedureFinished() {
    isStartupFinished = true
    startupEndTimeMillis = System.currentTimeMillis()
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

      override fun onRequestRelaunch(shouldRunReaper: Boolean, callback: LauncherCallback) {
        relaunchReactApplication(shouldRunReaper, callback)
      }
    }
  )

  private val launchedUpdate
    get() = startupProcedure.launchedUpdate
  private val launchDuration
    get() = startupStartTimeMillis?.let { start -> startupEndTimeMillis?.let { end -> (end - start).toDuration(DurationUnit.MILLISECONDS) } }
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
          logger.error("Interrupted while waiting for launch asset file", e, UpdatesErrorCode.InitializationError)
        }
      }
      return startupProcedure.launchAssetFile
    }
  override val bundleAssetName: String?
    get() = startupProcedure.bundleAssetName

  override fun onEventListenerStartObserving() {
    stateMachine.sendContextToJS()
  }

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
    startupStartTimeMillis = System.currentTimeMillis()

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
      logger,
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

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launchedUpdate,
      launchDuration = launchDuration,
      embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, updatesConfiguration)?.updateEntity,
      emergencyLaunchException = startupProcedure.emergencyLaunchException,
      isEnabled = true,
      isUsingEmbeddedAssets = isUsingEmbeddedAssets,
      runtimeVersion = updatesConfiguration.runtimeVersionRaw,
      checkOnLaunch = updatesConfiguration.checkOnLaunch,
      requestHeaders = updatesConfiguration.requestHeaders,
      localAssetFiles = localAssetFiles,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false,
      initialContext = stateMachine.context
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

  override fun checkForUpdate(callback: IUpdatesController.ModuleCallback<IUpdatesController.CheckForUpdateResult>) {
    val procedure = CheckForUpdateProcedure(context, updatesConfiguration, databaseHolder, logger, fileDownloader, selectionPolicy, launchedUpdate) {
      callback.onSuccess(it)
    }
    stateMachine.queueExecution(procedure)
  }

  override fun fetchUpdate(callback: IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult>) {
    val procedure = FetchUpdateProcedure(context, updatesConfiguration, logger, databaseHolder, updatesDirectory, fileDownloader, selectionPolicy, launchedUpdate) {
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
