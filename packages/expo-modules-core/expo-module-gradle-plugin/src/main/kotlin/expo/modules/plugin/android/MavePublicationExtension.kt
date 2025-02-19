package expo.modules.plugin.android

import expo.modules.plugin.androidLibraryExtension
import org.gradle.api.Project
import org.gradle.api.publish.PublicationContainer
import org.gradle.api.publish.maven.MavenPublication

internal fun PublicationContainer.createReleasePublication(project: Project) {
  create("release", MavenPublication::class.java) { mavenPublication->
    with(mavenPublication) {
      from(project.components.getByName("release"))
      groupId = project.group.toString()
      artifactId = requireNotNull(project.androidLibraryExtension().namespace) {
        "'android.namespace' is not defined"
      }
      version = requireNotNull(project.androidLibraryExtension().defaultConfig.versionName) {
        "'android.defaultConfig.versionName' is not defined"
      }
    }
  }
}
