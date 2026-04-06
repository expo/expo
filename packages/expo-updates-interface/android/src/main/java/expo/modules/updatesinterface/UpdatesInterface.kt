package expo.modules.updatesinterface

import android.net.Uri
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.UUID

/**
 * Interface for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton UpdatesController.
 *
 * All updates controllers implement this protocol
 */
interface UpdatesInterface {
  /**
   * Whether updates is enabled
   */
  val isEnabled: Boolean get() = false

  /**
   * These properties are set when updates is enabled, or the dev client is running
   */
  val runtimeVersion: String?
  val updateUrl: Uri?

  /**
   * These properties are only set when updates is enabled
   */
  val launchedUpdateId: UUID? get() = null
  val embeddedUpdateId: UUID? get() = null
  val launchAssetPath: String? get() = null

  /**
   * User code or third party modules can add a listener that will be called
   * on updates state machine transitions (only when updates is enabled)
   */
  fun subscribeToUpdatesStateChanges(listener: UpdatesStateChangeListener): UpdatesStateChangeSubscription
}

/**
 * Implemented only by the dev client updates controller.
 */
interface UpdatesDevLauncherInterface : UpdatesInterface {
  interface UpdateCallback {
    fun onFailure(e: Exception?)
    fun onSuccess(update: Update?)
    fun onProgress(successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int)

    /**
     * Called when a manifest has been downloaded. The return value indicates whether or not to
     * continue downloading the update described by this manifest. Returning `false` will abort the
     * load, and the `onSuccess` callback will be immediately called with a null `update`.
     */
    fun onManifestLoaded(manifest: JSONObject): Boolean
  }

  interface Update {
    val manifest: JSONObject
    val launchAssetPath: String
  }

  var updatesInterfaceCallbacks: WeakReference<UpdatesInterfaceCallbacks>?

  fun reset()
  fun fetchUpdateWithConfiguration(configuration: HashMap<String, Any>, callback: UpdateCallback)
  fun isValidUpdatesConfiguration(configuration: HashMap<String, Any>): Boolean
}

interface UpdatesInterfaceCallbacks {
  fun onRequestRelaunch()
}

interface UpdatesStateChangeListener {
  fun updatesStateDidChange(event: Map<String, Any>)
}

interface UpdatesStateChangeSubscription {
  /*
   * Call this to remove the subscription and stop receiving state change events
   */
  fun remove()

  /*
   * When updates is enabled, returns the current state context as an instance of UpdatesNativeInterfaceStateContext
   */
  fun getContext(): Any?
}

/**
 * Expose the state machine context to the native interface.
 */
data class UpdatesNativeInterfaceStateContext(
  val isUpdateAvailable: Boolean,
  val isUpdatePending: Boolean,
  val isChecking: Boolean,
  val isDownloading: Boolean,
  val isRestarting: Boolean,
  val restartCount: Int,
  val latestManifest: Map<String, Any>?,
  val downloadedManifest: Map<String, Any>?,
  val rollback: Rollback?,
  val checkError: Map<String, String>?,
  val downloadError: Map<String, String>?,
  val downloadProgress: Double,
  val lastCheckForUpdateTime: java.util.Date?,
  val sequenceNumber: Int,
  val downloadStartTime: java.util.Date?,
  val downloadFinishTime: java.util.Date?
) {
  data class Rollback(val commitTime: java.util.Date)
}
