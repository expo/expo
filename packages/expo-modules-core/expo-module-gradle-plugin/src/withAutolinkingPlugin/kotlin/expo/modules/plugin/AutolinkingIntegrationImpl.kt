package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.GradleProject
import org.gradle.api.Project
import java.io.File

class AutolinkingIntegrationImpl : AutolinkingIntegration {
  override fun getExpoDependency(project: Project, name: String): Any {
    val config = getProjectConfig(project, name)

    if (config.usePublication) {
      val publication = requireNotNull(config.publication)
      return "${publication.groupId}:${publication.artifactId}:${publication.version}"
    }

    return project.rootProject.findProject(":$name")
      ?: throw IllegalStateException("Couldn't find project with name $name.")
  }

  override fun getShouldUsePublicationScriptPath(project: Project): File? {
    val config = getProjectConfig(project)
    val scriptPath = config.shouldUsePublicationScriptPath
      ?: return null
    val scriptFile = File(scriptPath)

    if (!scriptFile.exists()) {
      project.logger.warn("[ExpoAutolinkingPlugin] The script file does not exist: $scriptFile")
      return null
    }

    return scriptFile
  }

  private fun getProjectConfig(project: Project, projectName: String): GradleProject {
    val config = getConfig(project)
    val dependency = config.allProjects.find { it.name == projectName }

    if (dependency == null) {
      throw IllegalStateException("Couldn't find project with name $projectName in `expo-autolinking-settings` configuration.")
    }

    return dependency
  }

  private fun getProjectConfig(project: Project) = getProjectConfig(project, project.name)

  private fun getConfig(project: Project): ExpoAutolinkingConfig {
    val gradleExtension = project.gradle.extensions.findByType(ExpoGradleExtension::class.java)
      ?: throw IllegalStateException("`ExpoGradleExtension` not found. Please, make sure that `useExpoModules` was called in `settings.gradle`.")
    return gradleExtension.config
  }
}
