package expo.modules.plugin

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.LibraryExtension
import expo.modules.plugin.configuration.GradleProject
import groovy.json.JsonOutput
import groovy.util.Node
import groovy.util.NodeList
import java.io.File
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.XmlProvider
import org.gradle.api.publish.PublishingExtension
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.api.tasks.TaskProvider

// SECTION: LibraryExtension
/**
 * Apply publishing variants to the library extension.
 *
 * @return The library extension.
 */
internal fun LibraryExtension.applyPublishingVariant() {
  publishing { publishing ->
    publishing.multipleVariants("brownfieldDebug") {
      includeBuildTypeValues("debug")
      withSourcesJar()
    }

    publishing.multipleVariants("brownfieldRelease") {
      includeBuildTypeValues("release")
      withSourcesJar()
    }

    publishing.multipleVariants("brownfieldAll") {
      includeBuildTypeValues("debug", "release")
      withSourcesJar()
    }
  }
}

// END SECTION: LibraryExtension

// SECTION: XmlProvider
/**
 * Get the dependencies node from the XML provider.
 *
 * @return The dependencies node, or null if not found.
 */
internal fun XmlProvider.dependenciesNode(): Node? {
  val root = asNode() as? Node ?: return null
  val dependenciesNodeList = root.get("dependencies") as? NodeList ?: return null

  return dependenciesNodeList?.firstOrNull() as? Node ?: null
}

/**
 * Get the list of dependency nodes from the XML provider.
 *
 * @return The list of dependency nodes, or empty list if not found.
 */
internal fun XmlProvider.dependencyNodes(): List<Node> {
  val dependenciesNode = dependenciesNode()
  return dependenciesNode?.children()?.filterIsInstance<Node>() ?: emptyList()
}

// END SECTION: XmlProvider

// SECTION: Node
/**
 * Get the groupId of the dependency.
 *
 * @return The groupId of the dependency, or null if not found.
 */
internal fun Node.groupId(): String? {
  val groupIdNode =
    when (val g = get("groupId")) {
      is Node -> g
      is NodeList -> g.firstOrNull() as? Node ?: null
      else -> null
    }

  return groupIdNode?.text()
}

/**
 * Get the artifactId of the dependency.
 *
 * @return The artifactId of the dependency, or null if not found.
 */
internal fun Node.artifactId(): String? {
  val artifactIdNode =
    when (val a = get("artifactId")) {
      is Node -> a
      is NodeList -> a.firstOrNull() as? Node ?: null
      else -> null
    }

  return artifactIdNode?.text()
}

/**
 * Set the version of the dependency.
 *
 * @param version The version to set.
 */
internal fun Node.setVersion(version: String) {
  val versionNode = this.children().firstOrNull { it is Node && it.name() == "version" } as? Node

  if (versionNode != null) {
    versionNode.setValue(version)
  } else {
    this.appendNode("version", version)
  }
}

// END SECTION: Node

// SECTION: String
/**
 * Capitalize the first letter of the string.
 *
 * @return The capitalized string.
 */
internal fun String.capitalized(): String {
  return this.replaceFirstChar { it.uppercase() }
}

// END SECTION: String

// SECTION: PublicationExtension
/**
 * Set up a repository for the publication.
 *
 * @param publication The publication configuration to use.
 * @param project The project to set up the repository for.
 */
internal fun PublishingExtension.setupRepository(publication: PublicationConfig, project: Project) {
  when (publication.type.get()) {
    "localMaven" -> {
      repositories { repo -> repo.mavenLocal() }
    }
    "localDirectory",
    "remotePublic" -> {
      repositories { repo ->
        repo.maven { maven ->
          maven.name = publication.getName()
          maven.url = project.uri("${publication.url.get()}")
          maven.isAllowInsecureProtocol = publication.allowInsecure.get()
        }
      }
    }
    "remotePrivate" -> {
      repositories { repo ->
        repo.maven { maven ->
          maven.name = publication.getName()
          maven.url = project.uri("${publication.url.get()}")
          maven.credentials { credentials ->
            credentials.username = publication.username.get()
            credentials.password = publication.password.get()
          }
          maven.isAllowInsecureProtocol = publication.allowInsecure.get()
        }
      }
    }
  }
}

/**
 * Create a publication for the project.
 *
 * @param from The variant to create the publication for.
 * @param project The project to create the publication for.
 * @param libraryExtension The library extension to use.
 * @param rnVersion The React Native version to set (not null only for brownfield project).
 */
internal fun PublishingExtension.createPublication(
  from: String,
  project: Project,
  libraryExtension: LibraryExtension,
  rnVersion: String?,
) {
  val _artifactId =
    if (rnVersion != null) {
      project.name
    } else {
      requireNotNull(libraryExtension.namespace)
    }

  publications.create(from, MavenPublication::class.java) { mavenPublication ->
    with(mavenPublication) {
      from(project.components.getByName(from))
      groupId = project.group.toString()
      artifactId = _artifactId
      version = getVersion(project, libraryExtension)

      pom.withXml { xml ->
        removeReactNativeDependencyPom(xml)
        if (rnVersion != null) {
          setReactNativeVersionPom(xml, rnVersion)
        }
      }
    }
  }
}

// END SECTION: PublicationExtension

// SECTION: GradleProject
/**
 * Get the local Maven repository for the project.
 *
 * @return The local Maven repository for the project.
 */
internal fun GradleProject.localMavenRepo(): File {
  return File(sourceDir).parentFile.resolve("local-maven-repo")
}

/**
 * Get the capitalized name of the project.
 *
 * @return The capitalized name of the project.
 */
internal fun GradleProject.getCapitalizedName(): String {
  return name.split('-').map { it.capitalized() }.joinToString("")
}

// END SECTION: GradleProject

// SECTION: Project
/**
 * Check if the project should be skipped.
 *
 * @return true if the project should be skipped, false otherwise.
 */
internal fun Project.shouldBeSkipped(): Boolean {
  val appProject = findAppProject(project)
  return project.extensions.findByType(AndroidComponentsExtension::class.java) == null ||
    project.extensions.findByType(LibraryExtension::class.java) == null ||
    project == appProject
}

/**
 * Register a task to be finalized by the metadata generation task.
 *
 * @param task The task to register.
 * @param variant The variant name.
 */
internal fun Project.registerTaskAfterMetadataGeneration(
  task: TaskProvider<Task>,
  variant: String,
) {
  val taskName = "generateMetadataFileFor${variant.capitalized()}Publication"
  tasks.named(taskName).configure { it.finalizedBy(task) }
}

/**
 * Get the module file for the project.
 *
 * @param variant The variant name.
 * @return The module file for the project, or null if not found.
 */
internal fun Project.moduleFile(variant: String): File? {
  val moduleBuildDir = layout.buildDirectory.get().asFile
  return File(moduleBuildDir, "publications/$variant/module.json").takeIf { it.exists() }
}

// END SECTION: Project

// SECTION: Map<String, Any>
/**
 * Get the variants from the module.json file.
 *
 * @return The variants from the module.json file, or null if not found.
 */
internal fun Map<String, Any>.variants(): List<MutableMap<String, Any>> {
  @Suppress("UNCHECKED_CAST")
  return this["variants"] as? List<MutableMap<String, Any>> ?: emptyList()
}

/**
 * Get the dependencies from the module.json file.
 *
 * @return The dependencies from the module.json file, or null if not found.
 */
internal fun Map<String, Any>.dependencies(): MutableList<MutableMap<String, Any>>? {
  return variants().flatMap {
    it["dependencies"] as? MutableList<MutableMap<String, Any>> ?: emptyList()
  } as? MutableList<MutableMap<String, Any>> ?: null
}

/**
 * Get the dependency lists from the module.json file.
 *
 * @return The dependency lists from the module.json file, or empty list if not found.
 */
internal fun Map<String, Any>.dependencyLists(): List<MutableList<MutableMap<String, Any>>> {
  return variants().mapNotNull {
    @Suppress("UNCHECKED_CAST")
    it["dependencies"] as? MutableList<MutableMap<String, Any>>
  }
}

/**
 * Write the JSON to the file.
 *
 * @param file The file to write the JSON to.
 */
internal fun Map<String, Any>.writeJson(file: File) {
  file.writeText(JsonOutput.prettyPrint(JsonOutput.toJson(this)))
}
// END SECTION: Map<String, Any>
