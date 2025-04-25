package expo.modules.plugin

import org.gradle.api.Project
import java.io.File

interface AutolinkingIntegration {
  fun getExpoDependency(project: Project, name: String): Any

  fun getShouldUsePublicationScriptPath(project: Project): File?
}
