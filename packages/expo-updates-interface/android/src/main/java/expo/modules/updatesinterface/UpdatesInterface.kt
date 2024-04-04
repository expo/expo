package expo.modules.updatesinterface

import android.content.Context
import org.json.JSONObject

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

  fun reset()
  fun fetchUpdateWithConfiguration(configuration: HashMap<String, Any>, context: Context, callback: UpdateCallback)
}
