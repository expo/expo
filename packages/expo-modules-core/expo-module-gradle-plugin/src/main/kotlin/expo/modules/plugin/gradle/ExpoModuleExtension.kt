package expo.modules.plugin.gradle

import org.gradle.api.Project
import java.io.File
import java.util.Properties
import expo.modules.plugin.Version

/**
 * An user-facing interface to interact with the `ExpoGradleHelperExtension`.
 */
open class ExpoModuleExtension(val project: Project) {
  private val gradleHelper by lazy {
    project.gradle.extensions.getByType(ExpoGradleHelperExtension::class.java)
  }

  val reactNativeDir: File
    get() = gradleHelper.getReactNativeDir(project)

  val reactNativeProperties: Properties
    get() = gradleHelper.getReactNativeProperties(project)

  val reactNativeVersion: Version
    get() = gradleHelper.getReactNativeVersion(project)
}
