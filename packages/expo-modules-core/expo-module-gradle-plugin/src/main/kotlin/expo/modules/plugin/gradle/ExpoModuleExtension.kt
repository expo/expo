package expo.modules.plugin.gradle

import expo.modules.plugin.AutolinkingIntegration
import expo.modules.plugin.AutolinkingIntegrationImpl
import expo.modules.plugin.Version
import expo.modules.plugin.safeGet
import org.gradle.api.Action
import org.gradle.api.Project
import org.gradle.api.publish.maven.MavenPom
import org.gradle.internal.extensions.core.extra
import java.io.File
import java.util.Properties

typealias POMConfigurator = Action<MavenPom>

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

  var enableCompileTimeOptimization: Boolean =
    findBoolProperty("expo.enableCompileTimeOptimization", default = true)

  internal var pomConfigurator: POMConfigurator? = null

  fun pom(configurator: POMConfigurator) {
    pomConfigurator = configurator
  }

  private fun findBoolProperty(name: String, default: Boolean): Boolean {
    val propertyValue = project.findProperty(name)?.toString() ?: return default
    if (!propertyValue.equals("true", ignoreCase = true) && !propertyValue.equals("false", ignoreCase = true)) {
      error("Property '$name' must be either 'true' or 'false', but found '$propertyValue'.")
    }
    return propertyValue.toBoolean()
  }
}
