// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import com.android.build.gradle.LibraryExtension
import expo.modules.plugin.android.PublicationInfo
import expo.modules.plugin.android.applyLinterOptions
import expo.modules.plugin.android.applyPublishingVariant
import expo.modules.plugin.android.applySDKVersions
import expo.modules.plugin.android.createEmptyExpoPublishTask
import expo.modules.plugin.android.createEmptyExpoPublishToMavenLocalTask
import expo.modules.plugin.android.createExpoPublishTask
import expo.modules.plugin.android.createExpoPublishToMavenLocalTask
import expo.modules.plugin.android.createReleasePublication
import expo.modules.plugin.gradle.ExpoModuleExtension
import org.gradle.api.Project
import org.gradle.api.publish.PublishingExtension
import org.gradle.internal.extensions.core.extra
import java.io.File

internal fun Project.applyDefaultPlugins() {
  if (!plugins.hasPlugin("com.android.library")) {
    plugins.apply("com.android.library")
  }
  if (!plugins.hasPlugin("kotlin-android")) {
    plugins.apply("kotlin-android")
  }
  if (!plugins.hasPlugin("maven-publish")) {
    plugins.apply("maven-publish")
  }
}

internal fun Project.applyKotlin(kotlinVersion: String, kspVersion: String) {
  extra.set("kotlinVersion", kotlinVersion)
  extra.set("kspVersion", kspVersion)

  project.dependencies.add("implementation", "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlinVersion")
}

internal fun Project.applyDefaultDependencies() {
  val modulesCore = rootProject.project(":expo-modules-core")
  if (project != modulesCore) {
    project.dependencies.add("compileOnly", modulesCore)

    project.dependencies.add("testImplementation", modulesCore)
    project.dependencies.add("androidTestImplementation", modulesCore)
  }
}

internal fun Project.applyDefaultAndroidSdkVersions() {
  with(androidLibraryExtension()) {
    applySDKVersions(
      compileSdk = rootProject.extra.safeGet("compileSdkVersion")
        ?: logger.warnIfNotDefined("compileSdkVersion", 35),
      minSdk = rootProject.extra.safeGet("minSdkVersion")
        ?: logger.warnIfNotDefined("minSdkVersion", 24),
      targetSdk = rootProject.extra.safeGet("targetSdkVersion")
        ?: logger.warnIfNotDefined("targetSdkVersion", 34)
    )
    applyLinterOptions()
  }
}

/**
 * Applies the necessary configuration for publishing to the local Maven repository.
 * It need to be called when DSL is finalized.
 */
internal fun Project.applyPublishing(expoModulesExtension: ExpoModuleExtension) {
  if (!expoModulesExtension.canBePublished) {
    createEmptyExpoPublishTask()
    createEmptyExpoPublishToMavenLocalTask()
    return
  }

  val libraryExtension = androidLibraryExtension()

  libraryExtension
    .applyPublishingVariant()

  afterEvaluate {
    val publicationInfo = PublicationInfo(this)

    publishingExtension()
      .publications
      .createReleasePublication(publicationInfo)

    createExpoPublishToMavenLocalTask(publicationInfo, expoModulesExtension)

    val npmLocalRepositoryRelativePath = "local-maven-repo"
    val npmLocalRepository = File("${project.projectDir.parentFile}/${npmLocalRepositoryRelativePath}").toURI()
    publishingExtension().repositories.mavenLocal { mavenRepo ->
      mavenRepo.name = "NPMPackage"
      mavenRepo.url = npmLocalRepository
    }

    createExpoPublishTask(publicationInfo, expoModulesExtension, npmLocalRepositoryRelativePath)
  }
}

internal fun Project.androidLibraryExtension() = extensions.getByType(LibraryExtension::class.java)

internal fun Project.publishingExtension() = extensions.getByType(PublishingExtension::class.java)
