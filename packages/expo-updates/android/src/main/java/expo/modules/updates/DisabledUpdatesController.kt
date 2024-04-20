package expo.modules.updates

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.procedures.RecreateReactContextProcedure
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
import expo.modules.updates.statemachine.UpdatesStateValue
import java.io.File
import java.lang.ref.WeakReference

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
) : IUpdatesController, UpdatesStateChangeEventSender {
  override var appContext: WeakReference<AppContext>? = null

  /** Keep the activity for [RecreateReactContextProcedure] to relaunch the app. */
  private var weakActivity: WeakReference<Activity>? = null
  override var shouldEmitJsEvents = false
    set(value) {
      field = value
      UpdatesUtils.sendQueuedEventsToAppContext(value, appContext, logger)
    }

  private val logger = UpdatesLogger(context)

  // disabled controller state machine can only be idle or restarting
  private val stateMachine = UpdatesStateMachine(context, this, setOf(UpdatesStateValue.Idle, UpdatesStateValue.Restarting))

  private var isStarted = false
  private var launcher: Launcher? = null
  private var isLoaderTaskFinished = false
  override var updatesDirectory: File? = null

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

    launcher = NoDatabaseLauncher(context, fatalException)
    notifyController()
    return
  }

  class UpdatesDisabledException(message: String) : CodedException(message)

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launcher?.launchedUpdate,
      embeddedUpdate = null,
      emergencyLaunchException = fatalException,
      isEnabled = false,
      isUsingEmbeddedAssets = launcher?.isUsingEmbeddedAssets ?: false,
      runtimeVersion = null,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER,
      requestHeaders = mapOf(),
      localAssetFiles = launcher?.localAssetFiles,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false
    )
  }

  override fun relaunchReactApplicationForModule(callback: IUpdatesController.ModuleCallback<Unit>) {
    val procedure = RecreateReactContextProcedure(
      context,
      weakActivity,
      object : Launcher.LauncherCallback {
        override fun onFailure(e: Exception) {
          callback.onFailure(e.toCodedException())
        }

        override fun onSuccess() {
          callback.onSuccess(Unit)
        }
      }
    )
    stateMachine.queueExecution(procedure)
  }

  override fun getNativeStateMachineContext(callback: IUpdatesController.ModuleCallback<UpdatesStateContext>) {
    callback.onSuccess(stateMachine.context)
  }

  override fun checkForUpdate(
    callback: IUpdatesController.ModuleCallback<IUpdatesController.CheckForUpdateResult>
  ) {
    callback.onFailure(UpdatesDisabledException("Updates.checkForUpdateAsync() is not supported when expo-updates is not enabled."))
  }

  override fun fetchUpdate(
    callback: IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult>
  ) {
    callback.onFailure(UpdatesDisabledException("Updates.fetchUpdateAsync() is not supported when expo-updates is not enabled."))
  }

  override fun getExtraParams(callback: IUpdatesController.ModuleCallback<Bundle>) {
    callback.onFailure(UpdatesDisabledException("Updates.getExtraParamsAsync() is not supported when expo-updates is not enabled."))
  }

  override fun setExtraParam(
    key: String,
    value: String?,
    callback: IUpdatesController.ModuleCallback<Unit>
  ) {
    callback.onFailure(UpdatesDisabledException("Updates.setExtraParamAsync() is not supported when expo-updates is not enabled."))
  }

  @Synchronized
  private fun notifyController() {
    if (launcher == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }
    isLoaderTaskFinished = true
    (this as java.lang.Object).notify()
  }

  companion object {
    private val TAG = DisabledUpdatesController::class.java.simpleName
  }

  override fun sendUpdateStateChangeEventToAppContext(
    eventType: UpdatesStateEventType,
    context: UpdatesStateContext
  ) {
    sendEventToJS(UPDATES_STATE_CHANGE_EVENT_NAME, eventType.type, context.writableMap)
  }

  private fun sendEventToJS(eventName: String, eventType: String, params: WritableMap?) {
    UpdatesUtils.sendEventToAppContext(shouldEmitJsEvents, appContext, logger, eventName, eventType, params)
  }
}
