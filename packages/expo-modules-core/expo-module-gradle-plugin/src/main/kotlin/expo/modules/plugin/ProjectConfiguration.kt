// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import com.android.build.api.dsl.LibraryExtension
import com.android.build.api.variant.AndroidComponentsExtension
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
import io.github.expo.pika.PikaGradleExtension
import org.gradle.api.Project
import org.gradle.api.publish.PublishingExtension
import org.gradle.internal.extensions.core.extra
import java.io.File

internal fun Project.applyDefaultPlugins() {
  applyPluginIfNeeded("com.android.library")

  if (!hasBuiltInKotlinSupport()) {
    // AGP 9 ships built-in Kotlin support (enabled by default), so applying `kotlin-android` on top
    // of it fails with "Cannot add extension with name 'kotlin', …".
    applyPluginIfNeeded("kotlin-android")
  }

  applyPluginIfNeeded("maven-publish")
}

internal fun Project.applyPikaPlugin() {
  applyPluginIfNeeded("io.github.expo.pika")
  
  val pika = extensions.getByType(PikaGradleExtension::class.java)
  pika.introspectableAnnotation("expo.modules.kotlin.types.OptimizedRecord")
  pika.introspectableAnnotation("expo.modules.kotlin.views.OptimizedComposeProps")
}

private fun Project.applyPluginIfNeeded(id: String) {
  if (!plugins.hasPlugin(id)) {
    plugins.apply(id)
  }
}

internal fun Project.configurePika(shouldBeEnabled: Boolean = true) {
  val pika = extensions.getByType(PikaGradleExtension::class.java)
  pika.enabled = shouldBeEnabled
}

internal fun Project.applyKotlin(kotlinVersion: String, kspVersion: String) {
  extra.set("kotlinVersion", kotlinVersion)
  extra.set("kspVersion", kspVersion)

  project.dependencies.add("implementation", "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlinVersion")
  // kotlinx-coroutines-core requires annotations:23.0.0 while kotlin-stdlib uses 13.0.
  // Gradle 9's consistent resolution rejects this mismatch, so we force the higher version.
  project.dependencies.add("implementation", "org.jetbrains:annotations:23.0.0")
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
        ?: logger.warnIfNotDefined("compileSdkVersion", 36),
      minSdk = rootProject.extra.safeGet("minSdkVersion")
        ?: logger.warnIfNotDefined("minSdkVersion", 24)
    )
    applyLinterOptions()
  }
}

/**
 * Applies the necessary configuration for publishing to the local Maven repository.
 * It needs to be called when DSL is finalized.
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
    val project = this
    // AGP 9's built-in Kotlin registers the "release" software component later than our
    // afterEvaluate, so react when it becomes available instead of reading it eagerly. On AGP 8
    // the component already exists, so this fires immediately.
    components.matching { it.name == "release" }.all {
      val publicationInfo = PublicationInfo(project)

      project.publishingExtension()
        .publications
        .createReleasePublication(
          publicationInfo,
          expoModulesExtension.pomConfigurator
        )

      project.createExpoPublishToMavenLocalTask(publicationInfo, expoModulesExtension)

      val npmLocalRepositoryRelativePath = "local-maven-repo"
      val npmLocalRepository = File("${project.projectDir.parentFile}/${npmLocalRepositoryRelativePath}").toURI()
      project.publishingExtension().repositories.mavenLocal { mavenRepo ->
        mavenRepo.name = "NPMPackage"
        mavenRepo.url = npmLocalRepository
      }

      project.createExpoPublishTask(publicationInfo, expoModulesExtension, npmLocalRepositoryRelativePath)
    }
  }
}

private const val AGP_BUILT_IN_KOTLIN_MAJOR = 9

/**
 * Whether AGP's built-in Kotlin support is active, meaning the `kotlin-android` plugin must not be
 * applied. True on AGP 9+ unless the project explicitly opts out with `android.builtInKotlin=false`.
 */
internal fun Project.hasBuiltInKotlinSupport(): Boolean {
  val androidComponents = extensions.findByType(AndroidComponentsExtension::class.java)
    ?: return false
  if (androidComponents.pluginVersion.major < AGP_BUILT_IN_KOTLIN_MAJOR) {
    return false
  }
  return findProperty("android.builtInKotlin")?.toString()?.toBoolean() ?: true
}

internal fun Project.androidLibraryExtension() = extensions.getByType(LibraryExtension::class.java)

internal fun Project.publishingExtension() = extensions.getByType(PublishingExtension::class.java)
