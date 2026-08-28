package expo.modules.updates

import org.junit.Assert.assertEquals
import org.junit.Test

class ExpoUpdatesPluginTest {
  @Test
  fun `selects the config mode`() {
    data class TestCase(
      val name: String,
      val inheritedMode: String?,
      val isDevelopmentBuild: Boolean,
      val expectedMode: String
    )

    val testCases = listOf(
      TestCase("inherited config mode", "development", false, "development"),
      TestCase("Debug build", null, true, "development"),
      TestCase("Release build", null, false, "production"),
      TestCase("empty inherited config mode", "", true, "development")
    )

    testCases.forEach { testCase ->
      assertEquals(
        testCase.name,
        testCase.expectedMode,
        getConfigMode(
          inheritedMode = testCase.inheritedMode,
          isDevelopmentBuild = testCase.isDevelopmentBuild
        )
      )
    }
  }

  @Test
  fun `selects development builds`() {
    data class TestCase(
      val name: String,
      val buildType: String,
      val isDebuggableVariant: Boolean,
      val nativeDebuggingEnabled: Boolean,
      val expected: Boolean
    )

    val testCases = listOf(
      TestCase("debuggable variant", "debug", true, false, true),
      TestCase("non-debuggable variant", "release", false, false, false),
      TestCase("native Debug build", "debug", false, true, true),
      TestCase("native optimized Debug build", "debugOptimized", false, true, true),
      TestCase("native Release build", "release", false, true, false)
    )

    testCases.forEach { testCase ->
      assertEquals(
        testCase.name,
        testCase.expected,
        isDevelopmentBuild(
          buildType = testCase.buildType,
          isDebuggableVariant = testCase.isDebuggableVariant,
          nativeDebuggingEnabled = testCase.nativeDebuggingEnabled
        )
      )
    }
  }
}
