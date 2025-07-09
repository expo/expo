package expo.modules.plugin.gradle

import expo.modules.plugin.configuration.GradleAarProject
import expo.modules.plugin.configuration.GradlePlugin
import expo.modules.plugin.configuration.MavenRepo
import expo.modules.plugin.configuration.Publication
import org.gradle.api.Project
import java.io.File

internal fun Project.applyPlugin(plugin: GradlePlugin) {
  plugins.apply(plugin.id)
}

internal fun Project.applyAarProject(aarProject: GradleAarProject) {
  configurations.maybeCreate("default")
  artifacts.add("default", File(aarProject.aarFilePath))
}

internal fun Project.linkBuildDependence(plugin: GradlePlugin) {
  buildscript.dependencies.add("classpath", "${plugin.group}:${plugin.id}")
}

internal fun Project.linkLocalMavenRepository(path: String, publications: List<Publication>) {
  repositories.mavenLocal { maven ->
    maven.url = file(path).toURI()

    maven.content { content ->
      publications.forEach { publication ->
        content.includeVersion(publication.groupId, publication.artifactId, publication.version)
      }
    }
  }
}

internal fun Project.linkMavenRepository(mavenRepo: MavenRepo) {
  val (url, credentials, authentication) = mavenRepo

  repositories.maven { maven ->
    maven.setUrl(url)
    maven.applyCredentials(credentials)
    maven.applyAuthentication(authentication)
  }
}
