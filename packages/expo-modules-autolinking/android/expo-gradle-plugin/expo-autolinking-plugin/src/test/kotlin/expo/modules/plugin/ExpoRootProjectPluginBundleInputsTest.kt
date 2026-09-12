package expo.modules.plugin

import com.google.common.truth.Truth
import org.gradle.testkit.runner.BuildResult
import org.gradle.testkit.runner.GradleRunner
import org.gradle.testkit.runner.TaskOutcome
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

/**
 * Checks the inputs that [declareInlinedEnvironmentAsBundleTaskInputs] adds to React Native's
 * `createBundle*JsAndAssets` tasks.
 *
 * The test project applies no Android plugin and holds no React Native sources. The `:app`
 * subproject registers a stub task with the same name and one output file, so Gradle can report
 * it as `UP-TO-DATE`. Every test first shows a repeated build that stays `UP-TO-DATE`, then
 * changes one value and shows that the task runs again.
 */
class ExpoRootProjectPluginBundleInputsTest {
  @JvmField
  @Rule
  var testProjectDir: TemporaryFolder = TemporaryFolder()

  /** The root Gradle project is the `android` directory, like in a real Expo project. */
  private val androidDir: File
    get() = File(testProjectDir.root, "android")

  /** The `.env` file sits next to the `android` directory, where Expo reads it. */
  private val dotenvFile: File
    get() = File(testProjectDir.root, ".env")

  @Before
  fun setUp() {
    File(androidDir, "app").mkdirs()

    File(androidDir, "settings.gradle").writeText(
      """
      include(":app")
      """.trimIndent()
    )

    File(androidDir, "build.gradle").writeText(
      """
      plugins {
        id("expo-root-project")
      }
      """.trimIndent()
    )

    // A stub of React Native's bundle task. It declares an output, which Gradle needs before it
    // can report the task as UP-TO-DATE. It reads the output location outside `doLast`, so the
    // task also works with the configuration cache.
    File(androidDir, "app/build.gradle").writeText(
      """
      def bundleFile = layout.buildDirectory.file("index.android.bundle")

      tasks.register("$BUNDLE_TASK") {
        outputs.file(bundleFile)
        doLast {
          def bundle = bundleFile.get().asFile
          bundle.parentFile.mkdirs()
          bundle.text = "stub bundle"
        }
      }
      """.trimIndent()
    )
  }

  @Test
  fun `a changed EXPO_PUBLIC value runs the bundle task again`() {
    Truth.assertThat(build("EXPO_PUBLIC_X" to "one").outcome()).isEqualTo(TaskOutcome.SUCCESS)
    Truth.assertThat(build("EXPO_PUBLIC_X" to "one").outcome()).isEqualTo(TaskOutcome.UP_TO_DATE)

    Truth.assertThat(build("EXPO_PUBLIC_X" to "two").outcome()).isEqualTo(TaskOutcome.SUCCESS)
  }

  @Test
  fun `a variable outside the EXPO_PUBLIC prefix keeps the bundle task up to date`() {
    Truth.assertThat(build("OTHER_VARIABLE" to "one").outcome()).isEqualTo(TaskOutcome.SUCCESS)

    Truth.assertThat(build("OTHER_VARIABLE" to "two").outcome()).isEqualTo(TaskOutcome.UP_TO_DATE)
  }

  @Test
  fun `a changed dotenv file runs the bundle task again`() {
    dotenvFile.writeText("EXPO_PUBLIC_X=one\n")
    Truth.assertThat(build().outcome()).isEqualTo(TaskOutcome.SUCCESS)
    Truth.assertThat(build().outcome()).isEqualTo(TaskOutcome.UP_TO_DATE)

    dotenvFile.writeText("EXPO_PUBLIC_X=two\n")
    Truth.assertThat(build().outcome()).isEqualTo(TaskOutcome.SUCCESS)
  }

  @Test
  fun `EXPO_NO_DOTENV runs the bundle task again`() {
    assertSwitchRunsTheBundleTaskAgain("EXPO_NO_DOTENV")
  }

  @Test
  fun `EXPO_NO_CLIENT_ENV_VARS runs the bundle task again`() {
    assertSwitchRunsTheBundleTaskAgain("EXPO_NO_CLIENT_ENV_VARS")
  }

  /**
   * Gradle reads the environment when it snapshots the task inputs, not when it configures the
   * build. A changed value must therefore run the task again and keep the configuration cache
   * entry valid.
   */
  @Test
  fun `a changed value keeps the configuration cache entry valid`() {
    build("--configuration-cache", "EXPO_PUBLIC_X" to "one")
    Truth
      .assertThat(build("--configuration-cache", "EXPO_PUBLIC_X" to "one").output)
      .contains(CONFIGURATION_CACHE_REUSED)

    val changed = build("--configuration-cache", "EXPO_PUBLIC_X" to "two")

    Truth.assertThat(changed.outcome()).isEqualTo(TaskOutcome.SUCCESS)
    Truth.assertThat(changed.output).contains(CONFIGURATION_CACHE_REUSED)
  }

  /**
   * The first two builds leave [name] unset, which gives a provider without a value. They pass
   * only when the input property is optional.
   */
  private fun assertSwitchRunsTheBundleTaskAgain(name: String) {
    dotenvFile.writeText("EXPO_PUBLIC_X=one\n")
    Truth.assertThat(build().outcome()).isEqualTo(TaskOutcome.SUCCESS)
    Truth.assertThat(build().outcome()).isEqualTo(TaskOutcome.UP_TO_DATE)

    Truth.assertThat(build(name to "1").outcome()).isEqualTo(TaskOutcome.SUCCESS)
    Truth.assertThat(build(name to "1").outcome()).isEqualTo(TaskOutcome.UP_TO_DATE)
  }

  /** Runs the stub bundle task with [environment] added to the environment of this process. */
  private fun build(vararg environment: Pair<String, String>): BuildResult =
    build(null, *environment)

  private fun build(argument: String?, vararg environment: Pair<String, String>): BuildResult =
    GradleRunner
      .create()
      .withProjectDir(androidDir)
      .withArguments(listOfNotNull(":app:$BUNDLE_TASK", argument))
      .withPluginClasspath()
      .withEnvironment(System.getenv() + environment.toMap())
      .build()

  private fun BuildResult.outcome(): TaskOutcome? = task(":app:$BUNDLE_TASK")?.outcome
}

private const val BUNDLE_TASK = "createBundleReleaseJsAndAssets"
private const val CONFIGURATION_CACHE_REUSED = "Configuration cache entry reused."
