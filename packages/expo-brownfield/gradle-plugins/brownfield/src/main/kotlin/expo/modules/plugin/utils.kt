package expo.modules.plugin

import org.gradle.api.Project

/**
 * Find the app project in the root project.
 *
 * @param project The project to find the app project in.
 * @return The app project.
 * @throws IllegalStateException if the app project is not found.
 */
internal fun findAppProject(project: Project): Project {
  return project.rootProject.subprojects.firstOrNull {
    it.plugins.hasPlugin("com.android.application")
  } ?: throw IllegalStateException("App project not found in the root project")
}
