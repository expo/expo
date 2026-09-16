package expo.modules.plugin

import com.google.common.truth.Truth
import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import org.gradle.testkit.runner.BuildResult
import org.gradle.testkit.runner.GradleRunner
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.nio.file.Files

class ExpoAutolinkingSettingsPluginTest {
  @JvmField
  @Rule
  var testProjectDir: TemporaryFolder = TemporaryFolder()

  @Before
  fun setUp() {
    testProjectDir.root.removeRecursively()
    testProjectDir.root.createProject()
  }

  @Test
  fun `applies settings plugin`() {
    val result = executeGradleRun()
    Truth.assertThat(result.output).contains("BUILD SUCCESSFUL")
  }

  @Test
  fun `injects expo gradle extension`() {
    val result = executeGradleRun(":app:gradleExpoExtension")
    val expoConfig = findPrefix("expoGradle=", result.output)
    Truth.assertThat(expoConfig).isNotNull()
  }

  @Test
  fun `returns correct config`() {
    val result = executeGradleRun(":app:expoConfig")

    val configStringFromPlugin = findPrefix("expoConfig=", result.output)
    val configFromPlugin = ExpoAutolinkingConfig.decodeFromString(configStringFromPlugin!!)

    val configStringFromAutolinking = testProjectDir.root.runCommand(
      *AutolinkingCommandBuilder()
        .command("resolve")
        .useJson()
        .build()
        .toTypedArray()
    )

    val configFromAutolinking = ExpoAutolinkingConfig.decodeFromString(configStringFromAutolinking)

    Truth.assertThat(configFromPlugin).isEqualTo(configFromAutolinking)
    Truth.assertThat(configFromPlugin.modules.map { it.packageName })
      .containsExactly("expo-fake-module", "expo-other-module")
  }

  private fun executeGradleRun(task: String? = null): BuildResult =
    GradleRunner
      .create()
      .withProjectDir(testProjectDir.root)
      .apply {
        if (task != null) {
          withArguments(task)
        }
      }
      .withPluginClasspath()
      .build()

}

fun findPrefix(prefix: String, input: String): String? {
  return input.lineSequence()
    .map { it.trim() }
    .find { it.startsWith(prefix) }
    ?.substringAfter(prefix)
    ?.takeIf { it.isNotBlank() }
}

/**
 * Path to `packages/expo-modules-autolinking` in this checkout, passed by the `test` task.
 */
private val expoModulesAutolinkingDir: File
  get() {
    val path = requireNotNull(System.getProperty("expo.autolinkingDir")) {
      "The `expo.autolinkingDir` system property is not set. Run the tests through Gradle, which sets it in build.gradle.kts."
    }
    return File(path).also {
      require(File(it, "build/index.js").exists()) {
        "The autolinking JS is not built at ${it.absolutePath}/build. Run `et check-packages expo-modules-autolinking` or `pnpm run build` in that package first."
      }
    }
  }

/**
 * Creates a new project that mimics a bare app with two autolinked Expo modules:
 * <file>
 * ├── app
 * │   └── build.gradle
 * ├── build.gradle
 * ├── settings.gradle
 * ├── package.json
 * └── node_modules
 *     ├── expo                       (stub exposing `expo/bin/autolinking`)
 *     ├── expo-modules-autolinking   (symlink to this checkout's package)
 *     ├── expo-fake-module           (stub module with an empty android/build.gradle)
 *     └── expo-other-module          (stub module with an empty android/build.gradle)
 */
private fun File.createProject() {
  val app = File(this, "app").apply { mkdirs() }
  File(app, "build.gradle").writeText(
    """
      task("gradleExpoExtension") {
        doLast {
          println("expoGradle=" + gradle.expoGradle)
        }
      }
      
      task("expoConfig") {
        doLast {
          println("expoConfig=" + gradle.expoGradle.config.toJson())
        }
      }
      """.trimIndent()
  )

  // `useExpoModules()` puts the included `expo-gradle-plugin` build on the root classpath,
  // so its dependencies must be resolvable from here.
  File(this, "build.gradle").writeText(
    """
    buildscript {
      repositories {
        google()
        mavenCentral()
      }
    }
    """.trimIndent()
  )

  File(this, "settings.gradle").writeText(
    """
      plugins {
        id("expo-autolinking-settings")
      }
      
      expoAutolinking.useExpoModules()

      include(":app")
      """.trimIndent()
  )

  File(this, "package.json").writeText(
    """
      {
        "name": "test-project",
        "version": "1.0.0",
        "dependencies": {
          "expo": "1.0.0",
          "expo-fake-module": "1.0.0",
          "expo-other-module": "1.0.0"
        }
      }
      """.trimIndent()
  )

  val nodeModules = File(this, "node_modules").apply { mkdirs() }

  Files.createSymbolicLink(
    File(nodeModules, "expo-modules-autolinking").toPath(),
    expoModulesAutolinkingDir.toPath()
  )

  // Mirrors `packages/expo/bin/autolinking`, which the Gradle plugins use to start the CLI.
  val expo = File(nodeModules, "expo").apply { mkdirs() }
  File(expo, "package.json").writeText("""{ "name": "expo", "version": "1.0.0" }""")
  File(expo, "bin").mkdirs()
  File(expo, "bin/autolinking").writeText("require('expo-modules-autolinking/bin/expo-modules-autolinking');\n")

  nodeModules.createStubModule("expo-fake-module", "1.2.3", "expo.modules.fake.FakeModule")
  nodeModules.createStubModule("expo-other-module", "4.5.6", "expo.modules.other.OtherModule")
}

private fun File.createStubModule(name: String, version: String, moduleClass: String) {
  val module = File(this, name).apply { mkdirs() }
  File(module, "package.json").writeText("""{ "name": "$name", "version": "$version" }""")
  File(module, "expo-module.config.json").writeText(
    """{ "platforms": ["android"], "android": { "modules": ["$moduleClass"] } }"""
  )
  File(module, "android").mkdirs()
  // Empty build script, so the linked project configures without Android or React Native tooling.
  File(module, "android/build.gradle").writeText("")
}

/**
 * Runs a command in the current directory and returns its stdout as a string.
 */
private fun File.runCommand(vararg command: String): String {
  val process = ProcessBuilder(*command)
    .directory(this)
    .redirectError(ProcessBuilder.Redirect.INHERIT)
    .start()

  val output = process.inputStream.use {
    it.readAllBytes().toString(Charsets.UTF_8)
  }
  val exitCode = process.waitFor()
  require(exitCode == 0) {
    "Command '${command.joinToString(" ")}' failed with exit code $exitCode"
  }
  return output
}

/**
 * Removes the file and all its children
 */
private fun File.removeRecursively() =
  this
    .walkBottomUp()
    .filter { it != this }
    .forEach { it.deleteRecursively() }
