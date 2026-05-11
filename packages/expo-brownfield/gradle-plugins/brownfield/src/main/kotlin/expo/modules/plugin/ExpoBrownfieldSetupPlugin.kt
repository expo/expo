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
      setupBundleDependencyForRelease(project)
      setupCopyingNativeLibsForType(project, "Release")
      setupCopyingNativeLibsForType(project, "Debug")
      setupExpoUpdatesIntegrationForRelease(project)
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
      assets.srcDirs("$appBuildDir/generated/assets/react/release")
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
   * Setup the dependency of the bundle tasks.
   *
   * Needed to include bundle and assets in the release variant.
   *
   * @param brownfieldProject The brownfield project to setup the dependency of the bundle tasks
   *   for.
   */
  internal fun setupBundleDependencyForRelease(brownfieldProject: Project) {
    val appProject = findAppProject(brownfieldProject)
    brownfieldProject.tasks.named("preReleaseBuild").configure { task ->
      task.dependsOn(":${appProject.name}:createBundleReleaseJsAndAssets")
    }
  }

  /**
   * Forward expo-updates' release-variant outputs from the host app module into the published
   * brownfield AAR.
   *
   * Two artifacts have to make it out of the AAR for runtime expo-updates initialization to
   * succeed in a brownfield consumer:
   *   - `assets/app.manifest`, generated by the expo-updates gradle plugin (`createReleaseUpdatesResources`)
   *     on the host app's `:app` module and read at runtime by `EmbeddedManifestUtils`.
   *   - `<meta-data android:name="expo.modules.updates.*" ...>` entries, normally injected into the
   *     host app's AndroidManifest by the expo-updates config plugin at `expo prebuild` time. The
   *     brownfield library module is a separate module with its own (empty) manifest, so we forward
   *     those entries from `:app/src/main/AndroidManifest.xml` into a generated release-variant
   *     manifest that AGP merges into the consumer.
   *
   * Without these the consumer logs `InitializationError: Ensure a valid URL is supplied` and updates
   * stay disabled.
   *
   * @param brownfieldProject The brownfield project.
   */
  internal fun setupExpoUpdatesIntegrationForRelease(brownfieldProject: Project) {
    val appProject = findAppProject(brownfieldProject)
    val updatesResourcesTask = appProject.tasks.findByName("createReleaseUpdatesResources") ?: run {
      brownfieldProject.logger.lifecycle(
        "expo-updates: \":${appProject.name}:createReleaseUpdatesResources\" task not found; " +
          "skipping brownfield expo-updates forwarding. Install expo-updates in the host app to enable updates in brownfield consumers."
      )
      return
    }

    val libraryExtension = getLibraryExtension(brownfieldProject)
    val moduleBuildDir = brownfieldProject.layout.buildDirectory.get().asFile

    val updatesAssetsDir = File(moduleBuildDir, "generated/assets/expoUpdatesResources/release")
    val copyAssetsTask =
      brownfieldProject.tasks.register("copyExpoUpdatesAssetsRelease", Copy::class.java) { task ->
        task.dependsOn(updatesResourcesTask)
        task.from(updatesResourcesTask.outputs.files)
        task.include("app.manifest")
        task.into(updatesAssetsDir)
      }
    libraryExtension.sourceSets.getByName("release").assets.srcDirs(updatesAssetsDir)

    val updatesManifestFile =
      File(moduleBuildDir, "generated/manifest/expoUpdatesResources/release/AndroidManifest.xml")
    val appManifest = File(appProject.projectDir, "src/main/AndroidManifest.xml")
    val appStrings = File(appProject.projectDir, "src/main/res/values/strings.xml")

    val generateManifestTask =
      brownfieldProject.tasks.register("generateBrownfieldUpdatesManifestRelease") { task ->
        task.inputs.file(appManifest)
        if (appStrings.exists()) {
          task.inputs.file(appStrings)
        }
        task.outputs.file(updatesManifestFile)
        task.doLast {
          updatesManifestFile.parentFile.mkdirs()
          updatesManifestFile.writeText(buildForwardedUpdatesManifest(appManifest, appStrings))
        }
      }
    libraryExtension.sourceSets.getByName("release").manifest.srcFile(updatesManifestFile)

    brownfieldProject.tasks.named("preReleaseBuild").configure { task ->
      task.dependsOn(copyAssetsTask)
      task.dependsOn(generateManifestTask)
    }
    brownfieldProject.tasks
      .matching { it.name == "processReleaseManifest" || it.name == "processReleaseMainManifest" }
      .configureEach { task -> task.dependsOn(generateManifestTask) }
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
