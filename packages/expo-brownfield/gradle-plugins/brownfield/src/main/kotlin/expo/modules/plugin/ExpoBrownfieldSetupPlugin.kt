package expo.modules.plugin

import com.android.build.gradle.LibraryExtension
import java.io.File
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.Copy
import org.json.JSONObject
import org.gradle.api.GradleException

class ExpoBrownfieldSetupPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    project.evaluationDependsOn(":expo")
    setupDependencySubstitution(project)

    project.afterEvaluate { project ->
      setupSourceSets(project)
      setupCopyingAutolinking(project)
      setupCopyingNativeLibsForType(project, "Release")
      setupCopyingNativeLibsForType(project, "Debug")
      setupHostAppArtifactForwardingForRelease(project)
      wireDevLauncherTasks(project)
    }
  }

  /**
   * Setup the dependency substitution for `react-android` and `hermes-android`.
   *
   * @param project The project to setup the dependency substitution for.
   */
  private fun setupDependencySubstitution(project: Project) {
    val rnVersion = getReactNativeVersion(project)
    val hermesVersion = getHermesVersion(project)
    project.logger.lifecycle("Resolved React Native version: $rnVersion")
    project.logger.lifecycle("Resolved Hermes version: $hermesVersion")

    project.configurations.configureEach { config ->
      config.resolutionStrategy {
        it.force("com.facebook.react:react-android:$rnVersion")
        it.force("com.facebook.hermes:hermes-android:$hermesVersion")
      }
    }
  }

  /**
   * Setup the source sets for the project.
   *
   * @param brownfieldProject The brownfield project to setup the source sets for.
   */
  private fun setupSourceSets(brownfieldProject: Project) {
    val libraryExtension = getLibraryExtension(brownfieldProject)
    val appProject = findAppProject(brownfieldProject)
    val appBuildDir = appProject.layout.buildDirectory.get().asFile
    val moduleBuildDir = brownfieldProject.layout.buildDirectory.get().asFile

    val main = libraryExtension.sourceSets.getByName("main")
    main.java.srcDirs("$moduleBuildDir/generated/autolinking/src/main/java")

    libraryExtension.sourceSets.getByName("release").apply {
      jniLibs.srcDirs("libsRelease")
      // release assets src dir is wired in setupHostAppArtifactForwardingForRelease
      res.srcDirs("$appBuildDir/generated/res/react/release")
    }

    libraryExtension.sourceSets.getByName("debug").apply { jniLibs.srcDirs("libsDebug") }
  }

  /**
   * Setup the copying of the autolinking sources.
   *
   * The autolinking sources are copied from the app project to the brownfield project.
   *
   * @param brownfieldProject The brownfield project to setup the copying of the autolinking sources
   *   for.
   */
  private fun setupCopyingAutolinking(brownfieldProject: Project) {
    val libraryExtension = getLibraryExtension(brownfieldProject)
    val appProject = findAppProject(brownfieldProject)

    val path = "generated/autolinking/src/main/java"
    val appBuildDir = appProject.layout.buildDirectory
    val moduleBuildDir = brownfieldProject.layout.buildDirectory

    val fromDir = appBuildDir.dir(path)
    val intoDir = moduleBuildDir.dir(path)

    brownfieldProject.tasks.register("copyAutolinkingSources", Copy::class.java) { task ->
      task.dependsOn(":${appProject.name}:generateAutolinkingPackageList")
      task.from(fromDir)
      task.into(intoDir)

      val rnEntryPointTask =
        appProject.tasks.findByName("generateReactNativeEntryPoint")
          ?: throw IllegalStateException("`generateReactNativeEntryPoint` task not found")
      task.dependsOn(rnEntryPointTask)

      task.doLast {
        val sourceFile =
          File(
            moduleBuildDir.get().asFile,
            "$path/com/facebook/react/ReactNativeApplicationEntryPoint.java",
          )
        if (sourceFile.exists()) {
          var content = sourceFile.readText()
          val namespace =
            libraryExtension.namespace
              ?: throw IllegalStateException(
                "Namespace hasn't been configured for the library extension"
              )
          val regex = Regex("""\b[\w.]+(?=\.BuildConfig)""")
          content = content.replace(regex, namespace)
          sourceFile.writeText(content)
        }
      }
    }

    brownfieldProject.tasks.named("preBuild").configure { task ->
      task.dependsOn("copyAutolinkingSources")
    }
  }

  /**
   * Forward the host `:app` module's build-time outputs into the published brownfield AAR so the
   * runtime React Native + expo libraries inside the AAR find the configuration they need.
   *
   * Two pieces are forwarded:
   *
   *   1. `:app:mergeReleaseAssets` output (everything that AGP would bundle into the host APK's
   *      `assets/`). This includes the RN JS bundle and hashed assets, expo-updates' `app.manifest`,
   *      expo-constants' `app.config`, and any other generated asset emitted by a host-side gradle
   *      plugin. Forwarding the merged output (rather than picking specific generator tasks) makes
   *      this future-proof: any new expo library that emits an asset on the `:app` side is picked
   *      up automatically. Transitive dep: `mergeReleaseAssets` requires `createBundleReleaseJsAndAssets`
   *      so the old `setupBundleDependencyForRelease` is no longer needed.
   *
   *   2. Every `<application>` `<meta-data>` entry from `:app/src/main/AndroidManifest.xml`,
   *      written into a generated release-variant manifest that AGP merges into the consumer.
   *      Covers expo-updates' `EXPO_UPDATE_URL`, expo-notifications' default icon/color, and
   *      anything else a config plugin injects.
   *
   * @param brownfieldProject The brownfield project.
   */
  internal fun setupHostAppArtifactForwardingForRelease(brownfieldProject: Project) {
    val appProject = findAppProject(brownfieldProject)
    val mergeAssetsTask = appProject.tasks.findByName("mergeReleaseAssets") ?: run {
      brownfieldProject.logger.lifecycle(
        "brownfield: \":${appProject.name}:mergeReleaseAssets\" task not found; " +
          "skipping host-app asset forwarding."
      )
      return
    }

    val libraryExtension = getLibraryExtension(brownfieldProject)
    val moduleBuildDir = brownfieldProject.layout.buildDirectory.get().asFile

    val hostAssetsDir = File(moduleBuildDir, "generated/assets/hostApp/release")
    val copyHostAssetsTask =
      brownfieldProject.tasks.register("copyHostAppAssetsRelease", Copy::class.java) { task ->
        task.dependsOn(mergeAssetsTask)
        task.from(mergeAssetsTask.outputs.files)
        task.into(hostAssetsDir)
      }
    libraryExtension.sourceSets.getByName("release").assets.srcDirs(hostAssetsDir)

    val hostManifestFile =
      File(moduleBuildDir, "generated/manifest/hostApp/release/AndroidManifest.xml")
    val appManifest = File(appProject.projectDir, "src/main/AndroidManifest.xml")
    val appStrings = File(appProject.projectDir, "src/main/res/values/strings.xml")

    val generateHostManifestTask =
      brownfieldProject.tasks.register("generateBrownfieldHostAppManifestRelease") { task ->
        task.inputs.file(appManifest)
        if (appStrings.exists()) {
          task.inputs.file(appStrings)
        }
        task.outputs.file(hostManifestFile)
        task.doLast {
          hostManifestFile.parentFile.mkdirs()
          hostManifestFile.writeText(buildForwardedApplicationManifest(appManifest, appStrings))
        }
      }
    libraryExtension.sourceSets.getByName("release").manifest.srcFile(hostManifestFile)

    brownfieldProject.tasks.named("preReleaseBuild").configure { task ->
      task.dependsOn(copyHostAssetsTask)
      task.dependsOn(generateHostManifestTask)
    }
    brownfieldProject.tasks
      .matching { it.name == "processReleaseManifest" || it.name == "processReleaseMainManifest" }
      .configureEach { task -> task.dependsOn(generateHostManifestTask) }
  }

  /**
   * Setup the copying of the native libraries for a given build type.
   *
   * The native libraries are copied from the app project to the brownfield project
   *
   * @param brownfieldProject The brownfield project to setup the copying of the native libraries
   *   for.
   * @param buildType The build type to setup the copying of the native libraries for.
   */
  private fun setupCopyingNativeLibsForType(brownfieldProject: Project, buildType: String) {
    val appProject = findAppProject(brownfieldProject)

    val mergeJniLibsTask = brownfieldProject.tasks.named("merge${buildType}JniLibFolders")

    val stripTaskPath = ":${appProject.name}:strip${buildType}DebugSymbols"
    val codegenTaskPath = ":${brownfieldProject.name}:generateCodegenSchemaFromJavaScript"

    val fromDir =
      appProject.layout.buildDirectory.dir(
        "intermediates/stripped_native_libs/${buildType.lowercase()}/strip${buildType}DebugSymbols/out/lib"
      )
    val intoDir = brownfieldProject.rootProject.file("${brownfieldProject.name}/libs${buildType}")

    val copyTask =
      brownfieldProject.tasks.register("copyAppModulesLib${buildType}", Copy::class.java) { task ->
        task.dependsOn(stripTaskPath, codegenTaskPath)
        task.from(fromDir)
        task.into(intoDir)
        task.include("**/libappmodules.so", "**/libreact_codegen_*.so")
      }

    mergeJniLibsTask.configure { task -> task.dependsOn(copyTask) }
  }

  /**
   * Get the library extension for the project.
   *
   * @param project The project to get the library extension for.
   * @return The library extension for the project.
   * @throws DomainObjectNotFoundException if the library extension is not found.
   */
  private fun getLibraryExtension(project: Project): LibraryExtension {
    return project.extensions.getByType(LibraryExtension::class.java)
  }

  /**
   * Get the React Native version for the project.
   *
   * @param project The project to get the React Native version for.
   * @return The React Native version for the project.
   * @throws IllegalStateException if the React Native version cannot be inferred.
   */
  private fun getReactNativeVersion(project: Project): String {
    return try {
      val process =
        ProcessBuilder("node", "--print", "require('react-native/package.json').version")
          .directory(project.rootProject.projectDir)
          .redirectErrorStream(true)
          .start()

      val version = process.inputStream.bufferedReader().readText().trim()
      process.waitFor()

      if (process.exitValue() == 0 && version.isNotEmpty()) {
        return version
      }

      throw IllegalStateException("Failed to infer React Native version via Node")
    } catch (e: Exception) {
      project.logger.warn("Failed to infer React Native version via Node")
      project.logger.warn("Falling back to reading from package.json...")
      return getReactNativeVersionFromPackageJson(project)
    }
  }

  /**
   * Get the Hermes version for the project.
   *
   * @param project The project to get the Hermes version for.
   * @return The Hermes version for the project.
   * @throws IllegalStateException if the Hermes version cannot be inferred.
   */
  private fun getHermesVersion(project: Project): String {
    val process =
      ProcessBuilder("node", "--print", "require('hermes-compiler/package.json').version")
        .directory(project.rootProject.projectDir)
        .redirectErrorStream(true)
        .start()

    val version = process.inputStream.bufferedReader().readText().trim()
    process.waitFor()

    if (process.exitValue() == 0 && version.isNotEmpty()) {
      return version
    }

    throw IllegalStateException("Failed to infer Hermes version via Node")
  }

  /**
   * Get the React Native version from the package.json file.
   *
   * This method is used as a fallback when the React Native version cannot be inferred via Node.
   *
   * @param project The project to get the React Native version from the package.json file for.
   * @return The React Native version from the package.json file.
   * @throws IllegalStateException if the React Native version cannot be inferred from the
   *   package.json file.
   */
  private fun getReactNativeVersionFromPackageJson(project: Project): String {
    val packageJson = project.rootProject.projectDir.parentFile.resolve("package.json")
    if (!packageJson.exists()) {
      throw IllegalStateException("package.json not found in ${project.rootProject.projectDir}")
    }

    val content = packageJson.readText()
    val json = JSONObject(content)

    val dependencies = json.optJSONObject("dependencies")
    val devDependencies = json.optJSONObject("devDependencies")

    val version =
      dependencies?.optString("react-native")
        ?: devDependencies?.optString("react-native")
        ?: throw IllegalStateException("react-native not found in package.json dependencies")

    return version.removePrefix("^").removePrefix("~")
  }

  /**
   * Add explicit dependency between the `sourceDebugJar` and `generateServiceApolloSources`
   * tasks in `expo-dev-launcher` project.
   *
   * @param brownfieldProject The brownfield project
   */
  private fun wireDevLauncherTasks(brownfieldProject: Project) {
    try {
      val devLauncherProject = brownfieldProject.rootProject.project(":expo-dev-launcher")

      val sourceDebugTask = devLauncherProject.tasks.findByName("sourceDebugJar")
      val apolloSourcesTask = devLauncherProject.tasks.findByName("generateServiceApolloSources")

      if (sourceDebugTask == null || apolloSourcesTask == null) {
        brownfieldProject.logger.warn("WARNING: Application uses expo-dev-launcher but tasks: sourceDebugJar and generateServiceApolloSources")
        brownfieldProject.logger.warn("Skipping explicitly defining dependency between the tasks...")
        return
      }

      sourceDebugTask.dependsOn(apolloSourcesTask)
    } catch (e: GradleException) {
      // no-op
    }
  }
}
