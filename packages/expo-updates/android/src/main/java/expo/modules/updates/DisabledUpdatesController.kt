package expo.modules.updates

import android.content.Context
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactInstanceManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.updates.UpdatesConfiguration.Companion.UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE
import expo.modules.updates.launcher.LauncherResult
import expo.modules.updates.launcher.NoDatabaseLauncher
import expo.modules.updates.statemachine.UpdatesStateContext
import java.io.File

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
) : IUpdatesController {
  private var isStarted = false
  private var launcherResult: LauncherResult? = null
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
      return launcherResult?.launchAssetFile
    }

  override val bundleAssetName: String?
    get() = launcherResult?.bundleAssetName

  override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager) {}

  @Synchronized
  override fun start() {
    if (isStarted) {
      return
    }
    isStarted = true

    launcherResult = NoDatabaseLauncher(context, fatalException).launch()
    isEmergencyLaunch = fatalException != null
    notifyController()
    return
  }

  class UpdatesDisabledException(message: String) : CodedException(message)

  override fun getConstantsForModule(): IUpdatesController.UpdatesModuleConstants {
    return IUpdatesController.UpdatesModuleConstants(
      launchedUpdate = launcherResult?.launchedUpdate,
      embeddedUpdate = null,
      isEmergencyLaunch = isEmergencyLaunch,
      isEnabled = false,
      releaseChannel = UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE,
      isUsingEmbeddedAssets = launcherResult?.isUsingEmbeddedAssets ?: false,
      runtimeVersion = null,
      checkOnLaunch = UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER,
      requestHeaders = mapOf(),
      localAssetFiles = launcherResult?.localAssetFiles,
      isMissingRuntimeVersion = isMissingRuntimeVersion,
    )
  }

  override suspend fun relaunchReactApplicationForModule() {
    throw UpdatesDisabledException("You cannot reload when expo-updates is not enabled.")
  }

  override fun getNativeStateMachineContext(callback: IUpdatesController.ModuleCallback<UpdatesStateContext>) {
    callback.onFailure(UpdatesDisabledException("You cannot check for updates when expo-updates is not enabled."))
  }

  override suspend fun checkForUpdate(): IUpdatesController.CheckForUpdateResult {
    throw UpdatesDisabledException("You cannot check for updates when expo-updates is not enabled.")
  }

  override suspend fun fetchUpdate(): IUpdatesController.FetchUpdateResult {
    throw UpdatesDisabledException("You cannot fetch update when expo-updates is not enabled.")
  }

  override suspend fun getExtraParams(): Bundle {
    throw UpdatesDisabledException("You cannot use extra params when expo-updates is not enabled.")
  }

  override suspend fun setExtraParam(
    key: String,
    value: String?,
  ) {
    throw UpdatesDisabledException("You cannot use extra params when expo-updates is not enabled.")
  }

  @Synchronized
  private fun notifyController() {
    if (launcherResult == null) {
      throw AssertionError("UpdatesController.notifyController was called with a null launcher, which is an error. This method should only be called when an update is ready to launch.")
    }
    isLoaderTaskFinished = true
    (this as java.lang.Object).notify()
  }

  companion object {
    private val TAG = DisabledUpdatesController::class.java.simpleName
  }
}
