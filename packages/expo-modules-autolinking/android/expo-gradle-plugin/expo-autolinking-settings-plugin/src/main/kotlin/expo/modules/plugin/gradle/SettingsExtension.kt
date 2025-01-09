package expo.modules.plugin.gradle

import expo.modules.plugin.configuration.GradleAarProject
import expo.modules.plugin.configuration.GradlePlugin
import expo.modules.plugin.configuration.GradleProject
import org.gradle.api.initialization.Settings
import java.io.File

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
