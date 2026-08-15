package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project

class ExpoPublishPlugin : Plugin<Project> {
  override fun apply(rootProject: Project) {
    rootProject.extensions.create("expoBrownfieldPublishPlugin", ExpoPublishExtension::class.java)

    rootProject.subprojects { project ->
      project.plugins.apply(ExpoBrownfieldPublishPlugin::class.java)
    }

    setupPrebuiltsCopying(rootProject)
  }
}
