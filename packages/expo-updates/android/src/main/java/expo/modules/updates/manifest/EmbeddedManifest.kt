package expo.modules.updates.manifest

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import org.apache.commons.io.IOUtils
import org.json.JSONObject

/**
 * Helper object for accessing and memoizing the manifest embedded in the application package.
 */
object EmbeddedManifest {
  private val TAG = EmbeddedManifest::class.java.simpleName

  private const val MANIFEST_FILENAME = "app.manifest"

  private var sEmbeddedManifest: BareUpdateManifest? = null

  fun get(context: Context, configuration: UpdatesConfiguration): BareUpdateManifest? {
    if (!configuration.hasEmbeddedUpdate) {
      return null
    }
    if (sEmbeddedManifest == null) {
      try {
        context.assets.open(MANIFEST_FILENAME).use { stream ->
          val manifestString = IOUtils.toString(stream, "UTF-8")
          val manifestJson = JSONObject(manifestString)
          // automatically verify embedded manifest since it was already codesigned
          manifestJson.put("isVerified", true)
          sEmbeddedManifest = ManifestFactory.getEmbeddedManifest(manifestJson, configuration)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Could not read embedded manifest", e)
        throw AssertionError("The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in android/app/build.gradle. " + e.message)
      }
    }
    return sEmbeddedManifest!!
  }
}
