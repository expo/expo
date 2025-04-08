package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import org.gradle.api.Project

class AutolinkingIntegrationImpl : AutolinkingIntegration {
  override fun getExpoDependency(project: Project, name: String): Any {
    val config = getConfig(project)
    val dependency = config.allProjects.find { it.name == name }

    if (dependency == null) {
      throw IllegalStateException("Couldn't find project with name $name in `expo-autolinking-settings` configuration.")
    }

    if (dependency.usePublication) {
      val publication = requireNotNull(dependency.publication)
      return "${publication.groupId}:${publication.artifactId}:${publication.version}"
    }

    return project.rootProject.findProject(":$name")
      ?: throw IllegalStateException("Couldn't find project with name $name.")
  }

  private fun getConfig(project: Project): ExpoAutolinkingConfig {
    val gradleExtension = project.gradle.extensions.findByType(ExpoGradleExtension::class.java)
      ?: throw IllegalStateException("`ExpoGradleExtension` not found. Please, make sure that `useExpoModules` was called in `settings.gradle`.")
    return gradleExtension.config
  }
}
