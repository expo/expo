package expo.modules.plugin.utils

import org.gradle.api.initialization.Settings
import java.util.Properties

internal fun Properties.getPropertiesPrefixedBy(prefix: String): Map<String, String> {
  return entries
    .mapNotNull { (key, value) ->
      if (key !is String || value !is String) {
        return@mapNotNull null
      }

      if (key.startsWith(prefix)) {
        key.removePrefix(prefix) to value
      } else {
        null
      }
    }
    .toMap()
}

internal fun Settings.getPropertiesPrefixedBy(prefix: String): Map<String, String> {
  val prefixedProperty = providers.gradlePropertiesPrefixedBy(prefix).get()
  return prefixedProperty.mapKeys { (key, _) -> key.removePrefix(prefix) }
}
