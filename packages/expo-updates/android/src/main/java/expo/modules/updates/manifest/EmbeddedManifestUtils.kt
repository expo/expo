package expo.modules.updates.manifest

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import org.apache.commons.io.IOUtils
import org.json.JSONObject
import java.nio.charset.StandardCharsets

/**
 * Helper object for accessing and memoizing the manifest embedded in the application package.
 */
object EmbeddedManifestUtils {
  private val TAG = EmbeddedManifestUtils::class.java.simpleName

  private const val MANIFEST_FILENAME = "app.manifest"

  private var sEmbeddedUpdate: EmbeddedUpdate? = null

  fun getEmbeddedUpdate(context: Context, configuration: UpdatesConfiguration): EmbeddedUpdate? {
    if (!configuration.hasEmbeddedUpdate) {
      return null
    }
    if (sEmbeddedUpdate == null) {
      try {
        context.assets.open(MANIFEST_FILENAME).use { stream ->
          val manifestString = IOUtils.toString(stream, StandardCharsets.UTF_8)
          val manifestJson = JSONObject(manifestString)
          // automatically verify embedded manifest since it was already codesigned
          manifestJson.put("isVerified", true)
          sEmbeddedUpdate = UpdateFactory.getEmbeddedUpdate(manifestJson, configuration)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Could not read embedded manifest", e)
        throw AssertionError("The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in android/app/build.gradle. " + e.message)
      }
    }
    return sEmbeddedUpdate!!
  }
}
