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
          isDebuggableVariant = testCase.isDebuggableVariant
        )
      )
    }
  }
}
