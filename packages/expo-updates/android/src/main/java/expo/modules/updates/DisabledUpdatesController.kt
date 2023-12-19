@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package expo.modules.updates

import android.content.Context
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.updates.UpdatesConfiguration.Companion.UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.procedures.RecreateReactContextProcedure
import expo.modules.updates.statemachine.UpdatesStateChangeEventSender
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEventType
import expo.modules.updates.statemachine.UpdatesStateMachine
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
  private val fatalException: Exception?,
  private val isMissingRuntimeVersion: Boolean
) : IUpdatesController, UpdatesStateChangeEventSender {
  private val reactNativeHost: WeakReference<ReactNativeHost>? = if (context is ReactApplication) {
    WeakReference(context.reactNativeHost)
  } else {
    null
  }
  private val logger = UpdatesLogger(context)
  private val stateMachine = UpdatesStateMachine(context, this)

  private var isStarted = false
  private var launcher: Launcher? = null
  private var isLoaderTaskFinished = false
  override var updatesDirectory: File? = null

  override var isEmergencyLaunch = false
    private set

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

  override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {}

  @Synchronized
  override fun start() {
    if (isStarted) {
      return
    }
    isStarted = true

    launcher = NoDatabaseLauncher(context, fatalException)
    isEmergencyLaunch = fatalException != null
    notifyController()
    return
  }

  class UpdatesDisabledException(message: String) : CodedException(message)

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launcher?.launchedUpdate,
      embeddedUpdate = null,
      isEmergencyLaunch = isEmergencyLaunch,
      isEnabled = false,
      releaseChannel = UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE,
      isUsingEmbeddedAssets = launcher?.isUsingEmbeddedAssets ?: false,
      runtimeVersion = null,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER,
      requestHeaders = mapOf(),
      localAssetFiles = launcher?.localAssetFiles,
      isMissingRuntimeVersion = isMissingRuntimeVersion,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false
    )
  }

  override fun relaunchReactApplicationForModule(callback: IUpdatesController.ModuleCallback<Unit>) {
    val procedure = RecreateReactContextProcedure(
      reactNativeHost,
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
    callback.onFailure(UpdatesDisabledException("You cannot check for updates when expo-updates is not enabled."))
  }

  override fun fetchUpdate(
    callback: IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult>
  ) {
    callback.onFailure(UpdatesDisabledException("You cannot fetch update when expo-updates is not enabled."))
  }

  override fun getExtraParams(callback: IUpdatesController.ModuleCallback<Bundle>) {
    callback.onFailure(UpdatesDisabledException("You cannot use extra params when expo-updates is not enabled."))
  }

  override fun setExtraParam(
    key: String,
    value: String?,
    callback: IUpdatesController.ModuleCallback<Unit>
  ) {
    callback.onFailure(UpdatesDisabledException("You cannot use extra params when expo-updates is not enabled."))
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

  override fun sendUpdateStateChangeEventToBridge(
    eventType: UpdatesStateEventType,
    context: UpdatesStateContext
  ) {
    sendEventToJS(EnabledUpdatesController.UPDATES_STATE_CHANGE_EVENT_NAME, eventType.type, context.writableMap)
  }

  private fun sendEventToJS(eventName: String, eventType: String, params: WritableMap?) {
    UpdatesUtils.sendEventToReactNative(reactNativeHost, logger, eventName, eventType, params)
  }
}
