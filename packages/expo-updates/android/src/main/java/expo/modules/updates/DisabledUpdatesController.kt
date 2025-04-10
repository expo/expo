package expo.modules.updates

import android.app.Activity
import android.content.Context
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.events.UpdatesEventManager
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.procedures.RecreateReactContextProcedure
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.File
import java.lang.ref.WeakReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.DurationUnit
import kotlin.time.toDuration

/**
 * Updates controller for applications that either disable updates explicitly or have an error
 * during initialization. Errors that may occur include but are not limited to:
 * - Disk access errors
 * - Internal database initialization errors
 * - Configuration errors (missing required configuration)
 */
class DisabledUpdatesController(
  private val context: Context,
  private val fatalException: Exception?
) : IUpdatesController {
  /** Keep the activity for [RecreateReactContextProcedure] to relaunch the app. */
  private var weakActivity: WeakReference<Activity>? = null
  private val controllerScope = CoroutineScope(Dispatchers.IO)

  private val logger = UpdatesLogger(context.filesDir)
  override val eventManager: IUpdatesEventManager = UpdatesEventManager(logger)

  // disabled controller state machine can only be idle or restarting
  private val stateMachine = UpdatesStateMachine(logger, eventManager, setOf(UpdatesStateValue.Idle, UpdatesStateValue.Restarting))

  private var isStarted = false
  private var startupStartTimeMillis: Long? = null
  private var startupEndTimeMillis: Long? = null

  private val launchDuration
    get() = startupStartTimeMillis?.let { start ->
      startupEndTimeMillis?.let { end ->
        (end - start).toDuration(
          DurationUnit.MILLISECONDS
        )
      }
    }

  private var launcher: Launcher? = null
  override var updatesDirectory: File? = null
  private val loaderTaskFinishedDeferred = CompletableDeferred<Unit>()
  private val loaderTaskFinishedMutex = Mutex()

  override val launchAssetFile: String?
    get() {
      runBlocking {
        loaderTaskFinishedDeferred.await()
      }
      return launcher?.launchAssetFile
    }

  override val bundleAssetName: String?
    get() = launcher?.bundleAssetName

  override fun onEventListenerStartObserving() {
    stateMachine.sendContextToJS()
  }

  override fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {}

  override fun onDidCreateReactInstance(reactContext: ReactContext) {
    weakActivity = WeakReference(reactContext.currentActivity)
  }

  override fun onReactInstanceException(exception: java.lang.Exception) {}

  override val isActiveController = false

  @Synchronized
  override fun start() {
    if (isStarted) {
      return
    }
    isStarted = true
    startupStartTimeMillis = System.currentTimeMillis()

    launcher = NoDatabaseLauncher(context, logger, fatalException)

    startupEndTimeMillis = System.currentTimeMillis()
    notifyController()
  }

  class UpdatesDisabledException(message: String) : CodedException(message)

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launcher?.launchedUpdate,
      launchDuration = launchDuration,
      embeddedUpdate = null,
      emergencyLaunchException = fatalException,
      isEnabled = false,
      isUsingEmbeddedAssets = launcher?.isUsingEmbeddedAssets ?: false,
      runtimeVersion = null,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER,
      requestHeaders = mapOf(),
      localAssetFiles = launcher?.localAssetFiles,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false,
      initialContext = stateMachine.context
    )
  }

  override suspend fun relaunchReactApplicationForModule() = suspendCancellableCoroutine { continuation ->
    val procedure = RecreateReactContextProcedure(
      context,
      weakActivity,
      object : Launcher.LauncherCallback {
        override fun onFailure(e: Exception) {
          continuation.resumeWithException(e.toCodedException())
        }

        override fun onSuccess() {
          continuation.resume(Unit)
        }
      }
    )
    stateMachine.queueExecution(procedure)
  }

  override suspend fun checkForUpdate(): IUpdatesController.CheckForUpdateResult {
    throw UpdatesDisabledException("Updates.checkForUpdateAsync() is not supported when expo-updates is not enabled.")
  }

  override suspend fun fetchUpdate(): IUpdatesController.FetchUpdateResult {
    throw UpdatesDisabledException("Updates.fetchUpdateAsync() is not supported when expo-updates is not enabled.")
  }

  override suspend fun getExtraParams(): Bundle {
    throw UpdatesDisabledException("Updates.getExtraParamsAsync() is not supported when expo-updates is not enabled.")
  }

  override suspend fun setExtraParam(
    key: String,
    value: String?
  ) {
    throw UpdatesDisabledException("Updates.setExtraParamAsync() is not supported when expo-updates is not enabled.")
  }

  override fun setUpdateURLAndRequestHeadersOverride(configOverride: UpdatesConfigurationOverride?) {
    throw UpdatesDisabledException("Updates.setUpdateURLAndRequestHeadersOverride() is not supported when expo-updates is not enabled.")
  }

  @Synchronized
  private fun notifyController() {
    controllerScope.launch {
      loaderTaskFinishedMutex.withLock {
        if (!loaderTaskFinishedDeferred.isCompleted) {
          if (launcher == null) {
            throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
          }
          loaderTaskFinishedDeferred.complete(Unit)
        }
      }
    }
  }

  companion object {
    private val TAG = DisabledUpdatesController::class.java.simpleName
  }
}
