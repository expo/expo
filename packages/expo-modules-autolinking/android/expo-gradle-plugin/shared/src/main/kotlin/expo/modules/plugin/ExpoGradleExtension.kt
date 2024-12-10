package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.security.MessageDigest

@Serializable
data class AutolinkingOptions(
  val searchPaths: List<String>? = null,
  val ignorePaths: List<String>? = null,
  val exclude: List<String>? = null
) {
  fun toJson(): String {
    return Json.encodeToString(AutolinkingOptions.serializer(), this)
  }

  companion object {
    fun fromJson(jsonString: String): AutolinkingOptions {
      return Json.decodeFromString(jsonString)
    }
  }
}

/**
 * Extension that will be added to Gradle, making it possible to access the configuration in all projects.
 */
open class ExpoGradleExtension(
  val config: ExpoAutolinkingConfig,
  val options: AutolinkingOptions = AutolinkingOptions()
) {
  /**
   * MD5 hash of the configuration.
   * It can be used to determine if the configuration has changed.
   */
  val hash: String
    get() {
      val stringifyConfig = config.toString()
      val md = MessageDigest.getInstance("MD5")
      return md.digest(stringifyConfig.toByteArray()).contentToString()
    }
}
