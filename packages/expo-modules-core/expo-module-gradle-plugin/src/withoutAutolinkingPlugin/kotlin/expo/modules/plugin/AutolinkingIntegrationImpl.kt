package expo.modules.plugin

import org.gradle.api.Project

class AutolinkingIntegrationImpl : AutolinkingIntegration {
  override fun getExpoDependency(project: Project, name: String): Any {
    return project.rootProject.findProject(":$name")
      ?: throw IllegalStateException("Couldn't find project with name $name.")
  }
}
