package expo.modules.updates

import org.junit.Assert.assertEquals
import org.junit.Test

class ExpoUpdatesPluginTest {
  @Test
  fun `selects the config mode`() {
    data class TestCase(
      val name: String,
      val inheritedMode: String?,
      val isEasBuild: Boolean,
      val isDebuggableVariant: Boolean,
      val expectedMode: String
    )

    val testCases = listOf(
      TestCase("inherited config mode", "development", true, false, "development"),
      TestCase("EAS Debug build", null, true, true, "production"),
      TestCase("Debug build", null, false, true, "development"),
      TestCase("Release build", null, false, false, "production"),
      TestCase("empty inherited config mode", "", false, true, "development")
    )

    testCases.forEach { testCase ->
      assertEquals(
        testCase.name,
        testCase.expectedMode,
        getConfigMode(
          inheritedMode = testCase.inheritedMode,
          isEasBuild = testCase.isEasBuild,
          isDebuggableVariant = testCase.isDebuggableVariant
        )
      )
    }
  }
}
