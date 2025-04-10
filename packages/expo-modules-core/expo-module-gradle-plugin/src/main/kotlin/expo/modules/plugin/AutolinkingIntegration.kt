package expo.modules.plugin

import org.gradle.api.Project

interface AutolinkingIntegration {
  fun getExpoDependency(project: Project, name: String): Any
}
