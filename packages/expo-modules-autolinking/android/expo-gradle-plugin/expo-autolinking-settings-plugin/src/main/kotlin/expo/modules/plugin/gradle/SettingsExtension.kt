package expo.modules.plugin.gradle

import expo.modules.plugin.configuration.GradleAarProject
import expo.modules.plugin.configuration.GradlePlugin
import expo.modules.plugin.configuration.GradleProject
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import expo.modules.plugin.text.withColor
import expo.modules.plugin.utils.getPropertiesPrefixedBy
import org.gradle.api.initialization.Settings
import org.gradle.api.logging.Logging
import org.gradle.caching.http.HttpBuildCache
import java.io.File
import java.net.URI
import java.util.Properties

internal fun Settings.linkProject(project: GradleProject) {
  include(":${project.name}")
  project(":${project.name}").projectDir = File(project.sourceDir)
}

internal fun Settings.linkPlugin(plugin: GradlePlugin) {
  includeBuild(File(plugin.sourceDir))
}

internal fun Settings.linkAarProject(aarProject: GradleAarProject) {
  include(":${aarProject.name}")
  val projectDir = File(aarProject.projectDir)
  if (!projectDir.exists()) {
    projectDir.mkdirs()
  }
  project(":${aarProject.name}").projectDir = projectDir
}

internal fun Settings.loadLocalProperties(): Properties {
  return Properties().apply {
    val localPropertiesFile = File(settings.rootDir, "local.properties")
    if (localPropertiesFile.exists()) {
      localPropertiesFile.reader().use(::load)
    }
  }
}

internal fun Settings.addBuildCache() {
  val localProperties = settings
    .loadLocalProperties()

  val remoteCacheConfigPrefix = "expo.cache.remote."
  val remoteCacheConfig = settings.getPropertiesPrefixedBy(remoteCacheConfigPrefix) +
    localProperties.getPropertiesPrefixedBy(remoteCacheConfigPrefix)

  val url = remoteCacheConfig["url"] ?: return
  val username = remoteCacheConfig["username"]
  val password = remoteCacheConfig["password"]
  val readonly = remoteCacheConfig["read-only"]?.toBoolean() ?: false
  val isUnsafe = url.startsWith("http://")

  val logger = Logging.getLogger(Settings::class.java)

  logger.quiet("${Emojis.GEAR} Configuring remote build cache: ${url.withColor(Colors.GREEN)} (username: ${username.withColor(Colors.GREEN)}, read-only: ${readonly.toString().withColor(Colors.GREEN)})")

  settings.buildCache { configuration ->
    configuration.remote(HttpBuildCache::class.java) { cache ->
      cache.url = URI.create(url)

      if (username != null && password != null) {
        cache.credentials {
          it.username = username
          it.password = password
        }
      }

      cache.isPush = !readonly

      if (isUnsafe) {
        cache.isAllowInsecureProtocol = true
        cache.isAllowUntrustedServer = true
      }
    }
  }
}
