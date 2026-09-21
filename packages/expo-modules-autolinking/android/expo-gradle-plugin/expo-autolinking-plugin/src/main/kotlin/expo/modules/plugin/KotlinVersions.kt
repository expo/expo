// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.plugin

import org.gradle.api.Project
import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion

internal const val defaultKotlinVersion = "2.2.0"

internal fun resolveKotlinVersion(kotlinGradlePluginVersion: String?, catalogVersion: String?): String {
  return kotlinGradlePluginVersion ?: catalogVersion ?: defaultKotlinVersion
}

internal fun resolveKspVersion(kotlinVersion: String): String {
  KSPLookup[kotlinVersion]?.let { return it }
  if (kotlinVersion >= "2.3.0") {
    return latestKspVersion
  }

  val minSupported = KSPLookup.keys.min()
  throw IllegalStateException(
    """
    Kotlin $kotlinVersion is not supported by Expo modules.
    The minimum supported Kotlin version is $minSupported.
    Update 'kotlinVersion' in your project's build.gradle to a supported version.
    Alternatively, you can set 'kspVersion' explicitly in build.gradle to bypass this check, but this is unsupported and may cause build failures.
    """.trimIndent()
  )
}

/**
 * The version of the Kotlin Gradle plugin that the app loaded and that compiles its modules, or `null`
 * when no Kotlin Gradle plugin is available to this build.
 */
internal fun Project.kotlinGradlePluginVersionOrNull(): String? {
  return try {
    getKotlinPluginVersion()
  } catch (e: LinkageError) {
    // The Kotlin Gradle plugin is not on the classpath of this build.
    logger.debug("Couldn't determine the Kotlin Gradle plugin version", e)
    null
  }
}
