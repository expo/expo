package expo.modules.updatesinterface

import android.net.Uri
import org.json.JSONObject
import java.lang.ref.WeakReference

/**
 * Interface for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton UpdatesController.
 */
interface UpdatesInterface {
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

  val runtimeVersion: String?
  val updateUrl: Uri?
}
