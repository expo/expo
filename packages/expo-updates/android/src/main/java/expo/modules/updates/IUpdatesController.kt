package expo.modules.updates

import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.loader.LoaderTask
import expo.modules.updates.manifest.Update
import expo.modules.updates.statemachine.UpdatesStateContext
import java.io.File
import java.util.Date
import kotlin.time.Duration
import kotlin.time.DurationUnit

interface IUpdatesController {
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

  val eventManager: IUpdatesEventManager

  fun onEventListenerStartObserving()

  fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager)

  fun onDidCreateReactInstance(reactContext: ReactContext)

  fun onReactInstanceException(exception: java.lang.Exception)

  /**
   * Indicates that the controller is in active state.
   * Currently it's only active for [EnabledUpdatesController].
   */
  val isActiveController: Boolean

  /**
   * Starts the update process to launch a previously-loaded update and (if configured to do so)
   * check for a new update from the server. This method should be called as early as possible in
   * the application's lifecycle.
   */
  fun start()

  interface ModuleCallback<T> {
    fun onSuccess(result: T)
    fun onFailure(exception: CodedException)
  }

  data class UpdatesModuleConstants(
    val launchedUpdate: UpdateEntity?,
    val launchDuration: Duration?,
    val embeddedUpdate: UpdateEntity?,
    val emergencyLaunchException: Exception?,
    val isEnabled: Boolean,
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
     * Whether the JS API methods should allow calling the native module methods and thus the methods
     * on the controller in development. For non-expo development we want to throw
     * at the JS layer since there isn't a controller set up. But for development within Expo Go
     * or a Dev Client, which have their own controller/JS API implementations, we want the JS API
     * calls to go through.
     */
    val shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: Boolean,

    val initialContext: UpdatesStateContext
  ) {
    fun toModuleConstantsMap(): Map<String, Any?> = mutableMapOf<String, Any?>().apply {
      this["isEmergencyLaunch"] = emergencyLaunchException != null
      this["emergencyLaunchReason"] = emergencyLaunchException?.message
      this["isEmbeddedLaunch"] = embeddedUpdate !== null && launchedUpdate?.id?.equals(embeddedUpdate.id) ?: false
      this["isEnabled"] = isEnabled
      this["launchDuration"] = launchDuration?.toLong(DurationUnit.MILLISECONDS)
      this["isUsingEmbeddedAssets"] = isUsingEmbeddedAssets
      this["runtimeVersion"] = runtimeVersion ?: ""
      this["checkAutomatically"] = checkOnLaunch.toJSString()
      this["channel"] = requestHeaders["expo-channel-name"] ?: ""
      this["shouldDeferToNativeForAPIMethodAvailabilityInDevelopment"] = shouldDeferToNativeForAPIMethodAvailabilityInDevelopment || UpdatesPackage.isUsingNativeDebug
      this["initialContext"] = initialContext.bundle

      if (launchedUpdate != null) {
        this["updateId"] = launchedUpdate.id.toString()
        this["commitTime"] = launchedUpdate.commitTime.time
        this["manifestString"] = launchedUpdate.manifest.toString()
      }
      val localAssetFiles = localAssetFiles
      if (localAssetFiles != null) {
        val localAssets = mutableMapOf<String, String>()
        for (asset in localAssetFiles.keys) {
          if (asset.key != null) {
            localAssets[asset.key!!] = localAssetFiles[asset]!!
          }
        }
        this["localAssets"] = localAssets
      }
    }
  }
  fun getConstantsForModule(): UpdatesModuleConstants

  fun relaunchReactApplicationForModule(callback: ModuleCallback<Unit>)

  sealed class CheckForUpdateResult(private val status: Status) {
    private enum class Status {
      NO_UPDATE_AVAILABLE,
      UPDATE_AVAILABLE,
      ROLL_BACK_TO_EMBEDDED,
      ERROR
    }

    class NoUpdateAvailable(val reason: LoaderTask.RemoteCheckResultNotAvailableReason) : CheckForUpdateResult(Status.NO_UPDATE_AVAILABLE)
    class UpdateAvailable(val update: Update) : CheckForUpdateResult(Status.UPDATE_AVAILABLE)
    class RollBackToEmbedded(val commitTime: Date) : CheckForUpdateResult(Status.ROLL_BACK_TO_EMBEDDED)
    class ErrorResult(val error: Exception) : CheckForUpdateResult(Status.ERROR)
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

  fun setUpdateURLAndRequestHeadersOverride(configOverride: UpdatesConfigurationOverride?)
}
