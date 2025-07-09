package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.GradleProject
import org.gradle.api.Project

fun ExpoAutolinkingConfig.getConfigForProject(gradleProject: Project): GradleProject? {
  return allProjects.firstOrNull {
    it.name == gradleProject.name
  }
}
