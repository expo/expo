package expo.modules.updates

import org.junit.Assert.assertEquals
import org.junit.Test

class ExpoUpdatesPluginTest {
  @Test
  fun `selects the config mode`() {
    data class TestCase(
      val name: String,
      val inheritedMode: String?,
      val isDebuggableVariant: Boolean,
      val expectedMode: String
    )

    val testCases = listOf(
      TestCase("development override for a bundled variant", "development", false, "development"),
      TestCase("production override for a debuggable variant", "production", true, "production"),
      TestCase("debuggable variant", null, true, "development"),
      TestCase("bundled variant", null, false, "production"),
      TestCase("empty override for a debuggable variant", "", true, ""),
      TestCase("empty override for a bundled variant", "", false, ""),
      TestCase("invalid override reaches Node validation", "staging", false, "staging")
    )

    testCases.forEach { testCase ->
      assertEquals(
        testCase.name,
        testCase.expectedMode,
        getConfigMode(
          inheritedMode = testCase.inheritedMode,
          isDebuggableVariant = testCase.isDebuggableVariant
        )
      )
    }
  }

  @Test
  fun `matches complete variant names against the effective React Native list`() {
    data class TestCase(
      val name: String,
      val variantName: String,
      val debuggableVariants: List<String>,
      val expected: Boolean
    )

    val testCases = listOf(
      TestCase("listed variant", "debug", listOf("debug"), true),
      TestCase("unlisted variant", "release", listOf("debug"), false),
      TestCase("listed flavored variant", "demoDebug", listOf("demoDebug"), true),
      TestCase("case-insensitive membership", "demoDebug", listOf("DEMODEBUG"), true),
      TestCase("unlisted flavored variant", "demoDebug", listOf("debug"), false),
      TestCase("flavor alone is not a variant", "demoDebug", listOf("demo"), false),
      TestCase("listed custom variant", "qa", listOf("qa"), true),
      TestCase("unlisted custom variant", "qa", listOf("debug"), false),
      TestCase("empty effective list", "debug", emptyList(), false)
    )

    testCases.forEach { testCase ->
      assertEquals(
        testCase.name,
        testCase.expected,
        isDebuggableVariant(testCase.variantName, testCase.debuggableVariants)
      )
    }
  }
}
