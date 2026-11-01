package expo.modules.devlauncher.helpers

import org.json.JSONArray
import org.json.JSONException

internal object DevLauncherAppIdentifiers {
  const val METADATA_KEY = "EXDevLauncherDevServerApplicationIds"

  fun fromMetadata(applicationId: String, metadata: String): Set<String> {
    val installedApplicationIds = setOf(applicationId)
    if (metadata.isBlank()) {
      return installedApplicationIds
    }

    try {
      val values = JSONArray(metadata)
      val applicationIds = installedApplicationIds.toMutableSet()
      for (index in 0 until values.length()) {
        val value = values.get(index) as? String ?: return installedApplicationIds
        if (value.isBlank()) {
          return installedApplicationIds
        }
        applicationIds.add(value)
      }
      return applicationIds
    } catch (_: JSONException) {
      return installedApplicationIds
    }
  }
}
