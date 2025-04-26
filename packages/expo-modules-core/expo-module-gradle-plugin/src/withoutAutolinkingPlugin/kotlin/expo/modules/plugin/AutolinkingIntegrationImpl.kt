package expo.modules.plugin

import org.gradle.api.Project
import java.io.File

class AutolinkingIntegrationImpl : AutolinkingIntegration {
  override fun getExpoDependency(project: Project, name: String): Any {
    return project.rootProject.findProject(":$name")
      ?: throw IllegalStateException("Couldn't find project with name $name.")
  }

  override fun getShouldUsePublicationScriptPath(project: Project): File? {
    return null
  }
}
