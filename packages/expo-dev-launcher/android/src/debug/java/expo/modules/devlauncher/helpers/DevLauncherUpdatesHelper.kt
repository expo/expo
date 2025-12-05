package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import expo.modules.updatesinterface.UpdatesInterface
import org.json.JSONObject
import java.lang.Exception
import java.util.*
import kotlin.collections.HashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend fun UpdatesInterface.loadUpdate(
  configuration: HashMap<String, Any>,
  context: Context,
  shouldContinue: (manifest: JSONObject) -> Boolean
): UpdatesInterface.Update =
  suspendCoroutine { cont ->
    this.fetchUpdateWithConfiguration(
      configuration,
      object : UpdatesInterface.UpdateCallback {
        override fun onSuccess(update: UpdatesInterface.Update?) {
          // if the update is null, we previously aborted the fetch, so we've already resumed
          update?.let { cont.resume(update) }
        }
        override fun onFailure(e: Exception?) {
          cont.resumeWithException(e ?: Exception("There was an unexpected error loading the update."))
        }
        override fun onProgress(successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) = Unit
        override fun onManifestLoaded(manifest: JSONObject): Boolean {
          return if (shouldContinue(manifest)) {
            true
          } else {
            cont.resume(object : UpdatesInterface.Update {
              override val manifest: JSONObject = manifest
              override val launchAssetPath: String
                get() = throw Exception("Tried to access launch asset path for a manifest that was not loaded")
            })
            false
          }
        }
      }
    )
  }

fun createUpdatesConfigurationWithUrl(url: Uri, projectUrl: Uri, runtimeVersion: String, installationID: String?): HashMap<String, Any> {
  val requestHeaders = hashMapOf(
    "Expo-Updates-Environment" to "DEVELOPMENT"
  )
  if (installationID != null) {
    requestHeaders["Expo-Dev-Client-ID"] = installationID
  }
  return hashMapOf(
    "updateUrl" to url,
    "scopeKey" to projectUrl.toString(),
    "hasEmbeddedUpdate" to false,
    "launchWaitMs" to 60000,
    "checkOnLaunch" to "ALWAYS",
    "enabled" to true,
    "requestHeaders" to requestHeaders,
    "runtimeVersion" to runtimeVersion
  )
}
