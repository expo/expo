package expo.modules.plugin

import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.TaskProvider

/**
 * Set up prebuilt artifact copying for the root project.
 *
 * @param rootProject The root project to set up prebuilt artifact copying for.
 */
internal fun setupPrebuiltsCopying(rootProject: Project) {
  rootProject.afterEvaluate {
    val configExtension = getConfigExtension(rootProject)

    if (configExtension.publications.isEmpty) {
      throw IllegalStateException(
        "`publications` is not set. Please, make sure that `publications { ... }` was called in the root `build.gradle` file."
      )
    }

    val taskName =
      rootProject.gradle.startParameter.taskNames.firstOrNull()
        ?: throw IllegalStateException("Cannot find task in the Gradle start parameter")
    val repo = parsePublishInvocation(rootProject, taskName)

    if (repo != null) {
      val publication = findPublicationWithRepository(configExtension.publications.toList(), repo)
      createPrebuiltsPublicationTask(publication, rootProject, configExtension.libraryName.get())
    }
  }
}

/**
 * Create a task to copy or publish prebuilt artifacts to the publication repository based on the
 * publication type.
 *
 * @param publication The publication configuration to use.
 * @param rootProject The root project to use.
 * @param libraryName The name of the brownfield library project.
 */
internal fun createPrebuiltsPublicationTask(
  publication: PublicationConfig,
  rootProject: Project,
  libraryName: String,
) {
  when (publication.type.get()) {
    "localDirectory" -> {
      createPrebuiltsCopyTask(publication, rootProject, libraryName)
    }
    else -> {
      createPrebuiltsPublishTask(publication, rootProject, libraryName)
    }
  }
}

/**
 * Create a task to copy prebuilt artifacts to the publication repository.
 *
 * Used for localDirectory repositories where copying artifacts is sufficient.
 *
 * @param publication The publication configuration to use.
 * @param rootProject The root project to use.
 * @param libraryName The name of the brownfield library project.
 */
internal fun createPrebuiltsCopyTask(
  publication: PublicationConfig,
  rootProject: Project,
  libraryName: String,
) {
  val brownfieldProject = getBrownfieldProject(rootProject, libraryName)
  val projects = getExpoPrebuiltProjects(rootProject)

  brownfieldProject.afterEvaluate {
    val copyTask =
      brownfieldProject.tasks.register(
        "copyPrebuiltExpoModules${publication.getName()}",
        Copy::class.java,
      ) { task ->
        projects.forEach { project ->
          task.from(project.localMavenRepo()) { copy -> copy.include("**/*") }
        }

        task.into(rootProject.file("${publication.url.get()}"))
      }

    registerPrebuiltPublicationTask(brownfieldProject, task = copyTask)
  }
}

/**
 * Create a task to publish prebuilt artifacts to the publication repository.
 *
 * Used for remote and mavenLocal repositories which require publications.
 *
 * @param publication The publication configuration to use.
 * @param rootProject The root project to use.
 * @param libraryName The name of the brownfield library project.
 */
internal fun createPrebuiltsPublishTask(
  publication: PublicationConfig,
  rootProject: Project,
  libraryName: String,
) {
  val brownfieldProject = getBrownfieldProject(rootProject, libraryName)
  val publishingExtension = getPublishingExtension(brownfieldProject)
  val projects = getExpoPrebuiltProjects(rootProject)

  brownfieldProject.afterEvaluate {
    projects.forEach { project ->
      val (_groupId, _artifactId, _version) = getPublicationInformation(project)

      publishingExtension.publications.create(
        "publishPrebuilt${project.getCapitalizedName()}${publication.getName()}",
        MavenPublication::class.java,
      ) { mavenPublication ->
        with(mavenPublication) {
          groupId = _groupId
          artifactId = _artifactId
          version = _version

          pom.withXml { xmlProvider ->
            val pomFile =
              project
                .localMavenRepo()
                .resolve(
                  "${_groupId.replace('.', '/')}/${_artifactId}/${_version}/${_artifactId}-${_version}.pom"
                )
            if (!pomFile.exists()) {
              throw IllegalStateException("Expo module pom not found: $pomFile")
            }

            val xmlContent = xmlProvider.asString()
            xmlContent.setLength(0)
            xmlContent.append(pomFile.readText())
          }

          project
            .localMavenRepo()
            .resolve("${_groupId.replace('.', '/')}/${_artifactId}/${_version}")
            .listFiles()
            ?.filter { file ->
              when (file.extension) {
                "aar",
                "jar",
                "module" -> true
                else -> false
              }
            }
            ?.forEach { file -> artifact(file) }
        }
      }
    }

    publishingExtension.setupRepository(publication, brownfieldProject)

    val publishTasks =
      if (publication.type.get() != "localMaven") {
        publishingExtension.publications
          .toList()
          .filter { it.name.startsWith("publishPrebuiltExpo") }
          .map { pub ->
            brownfieldProject.tasks.named(
              "publish${pub.name.capitalized()}PublicationTo${publication.getName().capitalized()}Repository"
            )
          }
      } else {
        publishingExtension.publications
          .toList()
          .filter { it.name.startsWith("publishPrebuiltExpo") }
          .map { pub ->
            brownfieldProject.tasks.named("publish${pub.name.capitalized()}PublicationToMavenLocal")
          }
      }

    registerPrebuiltPublicationTask(brownfieldProject, tasks = publishTasks)
  }
}

/**
 * Register one or more tasks to copy or publish prebuilt artifacts to the publication repository.
 *
 * @param brownfieldProject The brownfield library project to register the task for.
 * @param task The task to register (optional).
 * @param tasks The list of tasks to register (optional).
 */
internal fun registerPrebuiltPublicationTask(
  brownfieldProject: Project,
  task: TaskProvider<Copy>? = null,
  tasks: List<TaskProvider<Task>> = listOf(),
) {
  brownfieldProject.tasks.named("preBuild").configure { it.finalizedBy(task ?: tasks) }
}

/**
 * Parse the name of the publish task to infer the repository name.
 *
 * Throws an exception if the task name is invalid and can't be parsed.
 *
 * @param name The name of the publish task.
 * @return The repository name.
 */
internal fun parsePublishInvocation(project: Project, name: String): String? {
  val regex = Regex("publishBrownfield(\\w+)PublicationTo(\\w+)")
  val match = regex.matchEntire(name)

  if (match == null || match.groupValues.size < 3) {
    project.logger.warn("Cannot parse task: $name to infer the Maven repository")
    project.logger.warn("Skipping prebuilt artifact copying for the current task")
    return null
  }

  return match.groupValues[2]
}

/**
 * Find the publication configuration which publishes to a specific repository.
 *
 * Depends on the fact that we tie publication name with the repository name based on the
 * publication configuration.
 *
 * Throws an exception if the publication is not found.
 *
 * @param publications The list of publication configurations.
 * @param repository The name of the repository to find the publication for.
 * @return The publication configuration for the repository.
 */
internal fun findPublicationWithRepository(
  publications: List<PublicationConfig>,
  repository: String,
): PublicationConfig {
  val repositoryName = repository.removeSuffix("Repository").replaceFirstChar { it.lowercase() }

  val publication =
    publications.find { publication ->
      val publicationName = publication.getName()
      (publicationName == "localDefault" && repositoryName == "mavenLocal") ||
        repositoryName == publicationName
    }

  return publication
    ?: throw IllegalStateException("Publication not found for repository: $repositoryName")
}
