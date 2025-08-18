package expo.modules.updates.manifest

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import org.json.JSONObject

/**
 * Helper object for accessing and memoizing the manifest embedded in the application package.
 */
object EmbeddedManifestUtils {
  private val TAG = EmbeddedManifestUtils::class.java.simpleName

  private const val MANIFEST_FILENAME = "app.manifest"

  private var sEmbeddedUpdate: EmbeddedUpdate? = null

  /**
   * Gets the embedded update.
   * If the [UpdatesConfiguration.hasEmbeddedUpdate] is false, it returns null
   */
  fun getEmbeddedUpdate(context: Context, configuration: UpdatesConfiguration): EmbeddedUpdate? {
    if (!configuration.hasEmbeddedUpdate) {
      return null
    }
    return getCachedEmbeddedUpdate(context, configuration)
  }

  /**
   * Gets the embedded update.
   * If the [UpdatesConfiguration.originalHasEmbeddedUpdate] is false, it returns null
   */
  fun getOriginalEmbeddedUpdate(context: Context, configuration: UpdatesConfiguration): EmbeddedUpdate? {
    if (!configuration.originalHasEmbeddedUpdate) {
      return null
    }
    return getCachedEmbeddedUpdate(context, configuration)
  }

  private fun getCachedEmbeddedUpdate(context: Context, configuration: UpdatesConfiguration): EmbeddedUpdate =
    sEmbeddedUpdate ?: loadEmbeddedUpdate(context, configuration).also { sEmbeddedUpdate = it }

  private fun loadEmbeddedUpdate(context: Context, configuration: UpdatesConfiguration): EmbeddedUpdate =
    try {
      context.assets.open(MANIFEST_FILENAME).use { stream ->
        val manifestString = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        return JSONObject(manifestString)
          .apply {
            // automatically verify embedded manifest since it was already codesigned
            put("isVerified", true)
          }
          .let {
            UpdateFactory.getEmbeddedUpdate(it, configuration)
          }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Could not read embedded manifest", e)
      throw AssertionError("The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in android/app/build.gradle.", e)
    }
}
