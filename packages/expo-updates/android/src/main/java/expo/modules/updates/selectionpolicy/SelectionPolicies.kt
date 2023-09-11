package expo.modules.updates.selectionpolicy

import android.util.Log
import expo.modules.manifests.core.Manifest
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import java.lang.Exception

/**
 * Utility methods used by multiple [SelectionPolicy] subclasses.
 */
object SelectionPolicies {
  val TAG = SelectionPolicies::class.java.simpleName

  fun matchesFilters(update: UpdateEntity, manifestFilters: JSONObject?): Boolean {
    if (manifestFilters == null) {
      // empty matches all
      return true
    }

    val manifest = Manifest.fromManifestJson(update.manifest)
    val metadata = manifest.getMetadata() ?: return true // empty matches all

    try {
      // create lowercase copy for case-insensitive search
      val metadataLCKeys = JSONObject()
      val metadataKeySet = metadata.keys()
      while (metadataKeySet.hasNext()) {
        val key = metadataKeySet.next()
        metadataLCKeys.put(key.lowercase(), metadata[key])
      }
      val filterKeySet = manifestFilters.keys()
      while (filterKeySet.hasNext()) {
        val key = filterKeySet.next()
        // once an update fails one filter, break early; we don't need to check the rest
        if (metadataLCKeys.has(key) && manifestFilters[key] != metadataLCKeys[key]) {
          return false
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error filtering manifest using server data", e)
      return true
    }
    // as long as the update doesn't violate a filter, it passes
    return true
  }
}
