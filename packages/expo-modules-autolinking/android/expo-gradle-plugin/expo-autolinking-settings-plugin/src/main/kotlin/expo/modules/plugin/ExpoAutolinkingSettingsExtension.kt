package expo.modules.plugin

import org.gradle.api.Action
import org.gradle.api.initialization.Settings
import org.gradle.api.initialization.dsl.VersionCatalogBuilder
import org.gradle.api.model.ObjectFactory
import java.io.File
import javax.inject.Inject

open class ExpoAutolinkingSettingsExtension(
  val settings: Settings,
  @Inject val objects: ObjectFactory
) {
  /**
   * Command that should be provided to `react-native` to resolve the configuration.
   */
  val rnConfigCommand = AutolinkigCommandBuilder()
    .command("react-native-config")
    .useJson()
    .build()

  /**
   * A list of paths relative to the app's root directory where
   * the autolinking script should search for Expo modules.
   */
  var searchPaths: List<String>? = null

  /**
   * Paths to ignore when looking up for modules.
   */
  var ignorePaths: List<String>? = null

  /**
   * Package names to exclude when looking up for modules.
   */
  var exclude: List<String>? = null

  /**
   * The file pointing to the React Native Gradle plugin.
   */
  val reactNativeGradlePlugin: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine("node", "--print", "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }

  /**
   * The file pointing to the React Native root directory.
   */
  val reactNative: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }

  /**
   * Uses Expo modules autolinking.
   */
  fun useExpoModules() {
    SettingsManager(
      settings,
      searchPaths,
      ignorePaths,
      exclude
    ).useExpoModules()
  }

  fun useExpoVersionCatalog() {
    useExpoVersionCatalog(
      reactNativeVersionCatalog = null,
      override = null
    )
  }

  fun useExpoVersionCatalog(
    override: Action<in VersionCatalogBuilder>
  ) {
    useExpoVersionCatalog(
      reactNativeVersionCatalog = null,
      override = override
    )
  }

  fun useExpoVersionCatalog(
    reactNativeVersionCatalog: String?,
    override: Action<in VersionCatalogBuilder>?
  ) {
    val baseFile = if (reactNativeVersionCatalog != null) {
      File(reactNativeVersionCatalog)
    } else {
      File(
        reactNative,
        "gradle/libs.versions.toml"
      )
    }

    val catalogFile = objects.fileCollection().from(baseFile)

    val properties = listOf(
      "android.buildToolsVersion" to "buildTools",
      "android.minSdkVersion" to "minSdk",
      "android.compileSdkVersion" to "compileSdk",
      "android.targetSdkVersion" to "targetSdk",
      "android.kotlinVersion" to "kotlin"
    )

    settings.dependencyResolutionManagement {
      it.versionCatalogs { spec ->
        spec.create("expoLibs") { catalog ->
          catalog.from(catalogFile)
          properties.forEach { (propertyName, name) ->
            val property = settings.providers.gradleProperty(propertyName)
            if (property.isPresent) {
              catalog.version(name, property.get())
            }
          }

          override?.execute(catalog)
        }
      }
    }
  }
}
