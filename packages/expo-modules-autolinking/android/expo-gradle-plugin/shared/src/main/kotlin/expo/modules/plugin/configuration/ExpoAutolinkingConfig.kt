package expo.modules.plugin.configuration

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule

@Serializable
data class ExpoAutolinkingConfig(
  val modules: List<ExpoModule> = emptyList(),
  val extraDependencies: List<MavenRepo> = emptyList()
) {
  /**
   * Returns all gradle projects from all modules.
   */
  val allProjects: List<GradleProject>
    get() = modules.flatMap { it.projects }

  /**
   * Returns all plugins from all modules.
   */
  val allPlugins: List<GradlePlugin>
    get() = modules.flatMap { it.plugins }

  /**
   * Returns all AAR projects from all modules.
   */
  val allAarProjects: List<GradleAarProject>
    get() = modules.flatMap { it.aarProjects }

  fun toJson(): String {
    return Json.encodeToString(this)
  }

  companion object {
    private val jsonDecoder by lazy {
      val module = SerializersModule {
        polymorphicDefaultDeserializer(MavenCredentials::class) { MavenCredentialsSerializer }
      }

      Json {
        // We don't want to fail on a unknown key
        ignoreUnknownKeys = true
        serializersModule = module
      }
    }

    /**
     * Decodes the `ExpoAutolinkingConfig` from given string.
     */
    fun decodeFromString(input: String): ExpoAutolinkingConfig {
      return jsonDecoder.decodeFromString(input)
    }
  }
}

/**
 * Object representing a maven repository
 */
@Serializable
data class MavenRepo(
  val url: String,
  val credentials: MavenCredentials? = null,
  val authentication: String? = null
)

/**
 * Object representing a module.
 */
@Serializable
data class ExpoModule(
  val packageName: String,
  val packageVersion: String,
  val projects: List<GradleProject> = emptyList(),
  val plugins: List<GradlePlugin> = emptyList(),
  val aarProjects: List<GradleAarProject> = emptyList(),
  val modules: List<String> = emptyList()
)

/**
 * Object representing a gradle project.
 */
@Serializable
data class GradleProject(
  val name: String,
  val sourceDir: String
)

/**
 * Object representing a gradle plugin
 */
@Serializable
data class GradlePlugin(
  val id: String,
  val group: String,
  val sourceDir: String,
  val applyToRootProject: Boolean = true
)

/**
 * Object representing an gradle project containing AAR file
 */
@Serializable
data class GradleAarProject(
  val name: String,
  val aarFilePath: String,
  val projectDir: String
)
