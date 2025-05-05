package expo.modules.plugin.gradle

import expo.modules.plugin.AutolinkingIntegration
import expo.modules.plugin.AutolinkingIntegrationImpl
import org.gradle.api.Project
import java.io.File
import java.util.Properties
import expo.modules.plugin.Version
import expo.modules.plugin.safeGet
import org.gradle.internal.extensions.core.extra

/**
 * An user-facing interface to interact with the `ExpoGradleHelperExtension`.
 */
open class ExpoModuleExtension(val project: Project) {
  private val gradleHelper by lazy {
    project.gradle.extensions.getByType(ExpoGradleHelperExtension::class.java)
  }

  internal val autolinking: AutolinkingIntegration by lazy {
    AutolinkingIntegrationImpl()
  }

  val reactNativeDir: File
    get() = gradleHelper.getReactNativeDir(project)

  val reactNativeProperties: Properties
    get() = gradleHelper.getReactNativeProperties(project)

  val reactNativeVersion: Version
    get() = gradleHelper.getReactNativeVersion(project)

  fun safeExtGet(name: String, default: Any): Any {
    return project.rootProject.extra.safeGet<Any>(name) ?: default
  }

  fun getExpoDependency(name: String): Any {
    return autolinking.getExpoDependency(project, name)
  }

  var canBePublished: Boolean = true
}
