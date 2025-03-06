@file:OptIn(ExperimentalSerializationApi::class)

package expo.modules.plugin.android

import expo.modules.plugin.androidLibraryExtension
import expo.modules.plugin.publishingExtension
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.component.SoftwareComponent
import org.gradle.api.publish.PublicationContainer
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.api.tasks.TaskProvider
import java.nio.file.Path
import kotlin.io.path.exists
import kotlin.io.path.toPath

internal data class PublicationInfo(
  val components: SoftwareComponent,
  val groupId: String,
  val artifactId: String,
  val version: String,
) {
  constructor(
    project: Project,
  ) : this(
    components = project.components.getByName("release"),
    groupId = project.group.toString(),
    artifactId = requireNotNull(project.androidLibraryExtension().namespace) {
      "'android.namespace' is not defined"
    },
    version = requireNotNull(project.androidLibraryExtension().defaultConfig.versionName) {
      "'android.defaultConfig.versionName' is not defined"
    },
  )

  fun resolvePath(repositoryPath: Path): Path {
    val groupPath = groupId.replace('.', '/')
    val artifactPath = "$groupPath/$artifactId/$version"
    val publicationPath = repositoryPath.resolve(artifactPath)

    return publicationPath
  }

  override fun toString(): String {
    return "$groupId:$artifactId:$version"
  }
}

internal fun PublicationContainer.createReleasePublication(publicationInfo: PublicationInfo) {
  create("release", MavenPublication::class.java) { mavenPublication ->
    with(mavenPublication) {
      from(publicationInfo.components)
      groupId = publicationInfo.groupId
      artifactId = publicationInfo.artifactId
      version = publicationInfo.version
    }
  }
}

internal fun Project.createExpoPublishToMavenLocalTask(publicationInfo: PublicationInfo): TaskProvider<Task> {
  val publishToMavenLocalTask = tasks.getByName("publishToMavenLocal")
  return project.tasks.register("expoPublishToMavenLocal") { task ->
    task.group = "publishing"
    task.description = "Publishes the library to the local Maven repository"

    task.dependsOn(publishToMavenLocalTask)

    task.doLast {
      val mavenLocal = publishingExtension().repositories.mavenLocal()
      val mavenLocalPath = mavenLocal.url.toPath()

      val publicationPath = publicationInfo.resolvePath(mavenLocalPath)

      if (!publicationPath.exists()) {
        return@doLast
      }

      logger.quiet("$publicationInfo was published to $publicationPath")

      val expoModuleConfig = layout.projectDirectory.file("../expo-module.config.json").asFile
      val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
        prettyPrintIndent = "  "
      }

      val jsonElement = json.parseToJsonElement(expoModuleConfig.readText()).jsonObject
      val newJsonElement = modifyModuleConfig(projectName = name, jsonElement, publicationInfo)

      val newJsonString = json.encodeToString(JsonObject.serializer(), newJsonElement)

      logger.quiet("Updating 'expo-module.config.json' in ${expoModuleConfig.parent}")

      expoModuleConfig.writeText(newJsonString)
      providers.exec { env ->
        env.workingDir(layout.projectDirectory.file(".."))
        // TODO(@lukmccall): support other package managers
        env.commandLine("yarn", "prettier", "--write", "expo-module.config.json")
      }.result.get()
    }
  }
}

private fun modifyModuleConfig(projectName: String, currentConfig: JsonObject, publicationInfo: PublicationInfo): JsonObject {
  val publicationObject = JsonObject(mapOf(
    "groupId" to publicationInfo.groupId.toJsonElement(),
    "artifactId" to publicationInfo.artifactId.toJsonElement(),
    "version" to publicationInfo.version.toJsonElement(),
    "repository" to "mavenLocal".toJsonElement(),
  ))

  val androidObject = currentConfig.getOrDefault("android", JsonObject(emptyMap())).jsonObject.mutate {
    val subProject = get("projects")
      ?.jsonArray
      ?.mapIndexed { index, element -> index to element.jsonObject }
      ?.find { (_, element) -> element["name"]?.jsonPrimitive?.content == projectName }
    if (subProject != null) {
      val (index, project) = subProject
      val newProject = project.mutate {
        put("publication", publicationObject)
      }

      val newProjects = requireNotNull(get("projects"))
        .jsonArray
        .toMutableList()
        .apply {
          set(index, newProject)
        }
        .toJsonArray()

      put("projects", newProjects)
    } else {
      put("publication", publicationObject)
    }
  }

  return currentConfig.mutate {
    put("android", androidObject)
  }
}

private fun String.toJsonElement(): JsonElement = JsonPrimitive(this)
private fun Map<String, JsonElement>.toJsonObject(): JsonObject = JsonObject(this)
private inline fun JsonObject.mutate(block: MutableMap<String, JsonElement>.() -> Unit) =
  toMutableMap().apply {
    block()
  }.toJsonObject()

private fun MutableList<JsonElement>.toJsonArray(): JsonArray = JsonArray(this)
