package expo.modules.plugin.gradle

import expo.modules.plugin.Version
import org.gradle.api.Project
import java.io.File
import java.io.FileInputStream
import java.util.Properties

/**
 * An extension for the Gradle instance that stores data in a cache,
 * reducing the number of times it needs to be recomputed.
 *
 * For example, to resolve the React Native directory, we need to run an external process.
 * This can add up - it's better to run it once and cache the result.
 */
open class ExpoGradleHelperExtension {
  /**
   * Cached React Native directory
   */
  private lateinit var reactNativeDir: File

  /**
   * Cached React Native properties
   */
  private lateinit var reactNativeProperties: Properties

  /**
   * Cached React Native version
   */
  private lateinit var reactNativeVersion: Version

  fun getReactNativeDir(project: Project): File = synchronized(this) {
    if (::reactNativeDir.isInitialized) {
      return reactNativeDir
    }

    // When building from source, the ReactAndroid project is available
    val reactNativeDirFromSource = project
      .findProject(":packages:react-native:ReactAndroid")
      ?.projectDir
      ?.parentFile

    reactNativeDir = reactNativeDirFromSource ?: File(
      project.providers.exec { env ->
        env.workingDir(project.rootDir)
        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim()
    ).parentFile

    return reactNativeDir
  }

  fun getReactNativeProperties(project: Project): Properties = synchronized(this) {
    if (::reactNativeProperties.isInitialized) {
      return reactNativeProperties
    }

    val reactPropertiesFile = File(getReactNativeDir(project), "ReactAndroid/gradle.properties")
    reactNativeProperties = Properties().also { properties ->
      FileInputStream(reactPropertiesFile).use {
        properties.load(it)
      }
      properties.load(reactPropertiesFile.inputStream())
    }
    return reactNativeProperties
  }

  fun getReactNativeVersion(project: Project): Version = synchronized(this) {
    if (::reactNativeVersion.isInitialized) {
      return reactNativeVersion
    }

    val version = getReactNativeProperties(project).getProperty("VERSION_NAME")
    reactNativeVersion = Version.fromString(version)
    return reactNativeVersion
  }
}
