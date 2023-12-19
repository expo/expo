package expo.modules.updates

import android.os.Bundle
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.statemachine.UpdatesStateContext
import java.io.File
import java.util.Date

interface IUpdatesController {
  val isEmergencyLaunch: Boolean

  /**
   * The path on disk to the launch asset (JS bundle) file for the React Native host to use.
   * Blocks until the configured timeout runs out, or a new update has been downloaded and is ready
   * to use (whichever comes sooner). ReactNativeHost.getJSBundleFile() should call into this.
   *
   * If this returns null, something has gone wrong and expo-updates has not been able to launch or
   * find an update to use. In (and only in) this case, `getBundleAssetName()` will return a nonnull
   * fallback value to use.
   */
  val launchAssetFile: String?

  /**
   * Returns the filename of the launch asset (JS bundle) file embedded in the APK bundle, which can
   * be read using `context.getAssets()`. This is only nonnull if `getLaunchAssetFile` is null and
   * should only be used in such a situation. ReactNativeHost.getBundleAssetName() should call into
   * this.
   */
  val bundleAssetName: String?

  /**
   * Public for E2E tests.
   */
  val updatesDirectory: File?

  fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager)

  /**
   * Starts the update process to launch a previously-loaded update and (if configured to do so)
   * check for a new update from the server. This method should be called as early as possible in
   * the application's lifecycle.
   * @param context the base context of the application, ideally a [ReactApplication]
   */
  fun start()

  interface ModuleCallback<T> {
    fun onSuccess(result: T)
    fun onFailure(exception: CodedException)
  }

  data class UpdatesModuleConstants(
    val launchedUpdate: UpdateEntity?,
    val embeddedUpdate: UpdateEntity?,
    val isEmergencyLaunch: Boolean,
    val isEnabled: Boolean,
    val releaseChannel: String,
    val isUsingEmbeddedAssets: Boolean,
    val runtimeVersion: String?,
    val checkOnLaunch: UpdatesConfiguration.CheckAutomaticallyConfiguration,
    val requestHeaders: Map<String, String>,

    /**
     * Returns a map of the locally downloaded assets for the current update. Keys are the remote URLs
     * of the assets and values are local paths. This should be exported by the Updates JS module and
     * can be used by `expo-asset` or a similar module to override React Native's asset resolution and
     * use the locally downloaded assets.
     */
    val localAssetFiles: Map<AssetEntity, String>?,

    /**
     * Whether there is no runtime version (or sdkVersion) provided in configuration. If it is missing,
     * updates will be disabled and a warning will be logged.
     */
    val isMissingRuntimeVersion: Boolean,

    /**
     * Whether the JS API methods should allow calling the native module methods and thus the methods
     * on the controller in development. For non-expo development we want to throw
     * at the JS layer since there isn't a controller set up. But for development within Expo Go
     * or a Dev Client, which have their own controller/JS API implementations, we want the JS API
     * calls to go through.
     */
    val shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: Boolean
  )
  fun getConstantsForModule(): UpdatesModuleConstants

  fun relaunchReactApplicationForModule(callback: ModuleCallback<Unit>)

  fun getNativeStateMachineContext(callback: ModuleCallback<UpdatesStateContext>)

  sealed class CheckForUpdateResult(private val status: Status) {
    private enum class Status {
      NO_UPDATE_AVAILABLE,
      UPDATE_AVAILABLE,
      ROLL_BACK_TO_EMBEDDED,
      ERROR
    }

    class NoUpdateAvailable(val reason: LoaderTask.RemoteCheckResultNotAvailableReason) : CheckForUpdateResult(Status.NO_UPDATE_AVAILABLE)
    class UpdateAvailable(val updateManifest: UpdateManifest) : CheckForUpdateResult(Status.UPDATE_AVAILABLE)
    class RollBackToEmbedded(val commitTime: Date) : CheckForUpdateResult(Status.ROLL_BACK_TO_EMBEDDED)
    class ErrorResult(val error: Exception, val message: String) : CheckForUpdateResult(Status.ERROR)
  }
  fun checkForUpdate(callback: ModuleCallback<CheckForUpdateResult>)

  sealed class FetchUpdateResult(private val status: Status) {
    private enum class Status {
      SUCCESS,
      FAILURE,
      ROLL_BACK_TO_EMBEDDED,
      ERROR
    }

    class Success(val update: UpdateEntity) : FetchUpdateResult(Status.SUCCESS)
    class Failure : FetchUpdateResult(Status.FAILURE)
    class RollBackToEmbedded : FetchUpdateResult(Status.ROLL_BACK_TO_EMBEDDED)
    class ErrorResult(val error: Exception) : FetchUpdateResult(Status.ERROR)
  }
  fun fetchUpdate(callback: ModuleCallback<FetchUpdateResult>)

  fun getExtraParams(callback: ModuleCallback<Bundle>)

  fun setExtraParam(key: String, value: String?, callback: ModuleCallback<Unit>)
}
