package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

class ExpoBrownfieldPublishPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    project.plugins.apply("maven-publish")

    project.afterEvaluate { project ->
      if (project.shouldBeSkipped()) {
        project.logger.warn(
          "Skipping ${project.name} as it is not a project which should be published"
        )
        return@afterEvaluate
      }

      setupPublishing(project)
    }
  }
}
