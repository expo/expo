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
      *AutolinkigCommandBuilder()
        .command("resolve")
        .useJson()
        .build()
        .toTypedArray()
    )

    val configFromAutolinking = ExpoAutolinkingConfig.decodeFromString(configStringFromAutolinking)

    Truth.assertThat(configFromPlugin).isEqualTo(configFromAutolinking)
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
 * Creates a new project with the following structure:
 * <file>
 * ├── app
 * │   └── build.gradle
 * ├── build.gradle
 * ├── settings.gradle
 * └── package.json
 */
private fun File.createProject() {
  File(this, "app").mkdir()
  val app = File(this, "app")
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

  File(this, "build.gradle").writeText(
    """
    buildscript {
      repositories {
        google()
        mavenCentral()
      }
      dependencies {
        classpath("com.android.tools.build:gradle:8.6.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.24")
      }
    }
    
    allprojects {
      repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
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
        "dependencies": {
          "expo": "52.0.5",
          "expo-image-picker": "16.0.3"
        }
      }
      """.trimIndent()
  )

  runCommand("npm", "install")

  // Mocks the expo and expo-modules-core build.gradle files
  // to avoid errors during the sync process.
  File(this, "node_modules/expo/android/build.gradle").writeText(
    """
    """.trimIndent()
  )
  File(this, "node_modules/expo-modules-core/android/build.gradle").writeText(
    """
    """.trimIndent()
  )
}

/**
 * Runs a command in the current directory and returns the output as a string.
 */
private fun File.runCommand(vararg command: String): String {
  val process = ProcessBuilder(*command)
    .directory(this)
    .start()

  val inputStream = process.inputStream
  process.waitFor()
  return inputStream.use {
    it.readAllBytes().toString(Charsets.UTF_8)
  }
}

/**
 * Removes the file and all its children
 */
private fun File.removeRecursively() =
  this
    .walkBottomUp()
    .filter { it != this }
    .forEach { it.deleteRecursively() }
