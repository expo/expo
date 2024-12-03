package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import java.security.MessageDigest

/**
 * Extension that will be added to the Gradle, making possible to access configuration in all projects.
 */
open class ExpoGradleExtension(
  val config: ExpoAutolinkingConfig
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
