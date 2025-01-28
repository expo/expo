package expo.modules.plugin.gradle

import org.gradle.api.Project
import org.gradle.api.invocation.Gradle

/**
 * Adds an action to be called immediately before a root project is evaluate.
 */
internal inline fun Gradle.beforeRootProject(crossinline action: (rootProject: Project) -> Unit) {
  beforeProject { project ->
    if (project !== project.rootProject) {
      return@beforeProject
    }
    action(project)
  }
}

/**
 * Adds an action to be called before the given project is evaluated.
 */
internal inline fun Gradle.beforeProject(projectName: String, crossinline action: (project: Project) -> Unit) {
  beforeProject { project ->
    if (project.name == projectName) {
      action(project)
    }
  }
}

/**
 * Adds an action to be called immediately after an Android application project is evaluated.
 */
internal inline fun Gradle.afterAndroidApplicationProject(crossinline action: (androidApplication: Project) -> Unit) {
  afterProject { project ->
    if (project.plugins.hasPlugin("com.android.application")) {
      action(project)
    }
  }
}
