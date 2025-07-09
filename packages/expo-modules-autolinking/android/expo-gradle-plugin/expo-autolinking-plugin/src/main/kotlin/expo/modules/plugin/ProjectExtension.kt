package expo.modules.plugin

import expo.modules.plugin.configuration.GradleProject
import org.gradle.api.Project

internal fun Project.withSubproject(subprojectConfig: GradleProject, action: (subproject: Project) -> Unit) {
  val subprojectPath = ":${subprojectConfig.name}"
  val subproject = findProject(subprojectPath)
  if (subproject == null) {
    logger.warn("Couldn't find project ${subprojectConfig.name}. Please, make sure that `expo-autolinking-settings` plugin was applied in `settings.gradle`.")
    return
  }

  // Prevent circular dependencies
  if (subproject == this) {
    return
  }

  action(subproject)
}

internal fun Project.withSubprojects(subprojectsConfig: List<GradleProject>, action: (subproject: Project) -> Unit) {
  subprojectsConfig.forEach { subprojectConfig ->
    withSubproject(subprojectConfig, action)
  }
}
