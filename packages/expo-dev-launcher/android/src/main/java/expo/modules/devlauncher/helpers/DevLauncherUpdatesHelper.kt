package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import expo.modules.updatesinterface.UpdatesInterface
import org.json.JSONObject
import java.lang.Exception
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

suspend fun UpdatesInterface.loadUpdate(
  configuration: HashMap<String, Any>,
  context: Context,
  shouldContinue: (manifest: JSONObject) -> Boolean
): UpdatesInterface.Update =
  suspendCoroutine { cont ->
    this.fetchUpdateWithConfiguration(configuration, context, object : UpdatesInterface.UpdateCallback {
      override fun onSuccess(update: UpdatesInterface.Update) = cont.resume(update)
      override fun onFailure(e: Exception?) {
        e?.let { cont.resumeWithException(it) }
      }
      override fun onProgress(successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) {
        // do nothing for now
      }
      override fun onManifestLoaded(manifest: JSONObject): Boolean {
        return if (shouldContinue(manifest)) {
          true
        } else {
          cont.resume(object : UpdatesInterface.Update {
            override fun getLaunchAssetPath(): String {
              throw Exception("Tried to access launch asset path for a manifest that was not loaded")
            }
            override fun getManifest(): JSONObject = manifest
          })
          false
        }
      }
    })
  }

fun createUpdatesConfigurationWithUrl(url: Uri): HashMap<String, Any> {
  val configuration: HashMap<String, Any> = HashMap()
  configuration["updateUrl"] = url
  configuration["hasEmbeddedUpdate"] = false
  configuration["launchWaitMs"] = 60000
  configuration["checkOnLaunch"] = "ALWAYS"
  configuration["enabled"] = true
  return configuration
}