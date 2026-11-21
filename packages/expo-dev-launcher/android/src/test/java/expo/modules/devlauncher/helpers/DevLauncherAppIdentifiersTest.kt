package expo.modules.devlauncher.helpers

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherAppIdentifiersTest {
  @Test
  fun `accepts related identifiers and always keeps the installed app`() {
    assertEquals(
      setOf("dev.expo.mine.dev", "dev.expo.mine", "dev.expo.mine.preview"),
      DevLauncherAppIdentifiers.fromMetadata(
        "dev.expo.mine.dev",
        """["dev.expo.mine", "dev.expo.mine.preview", "dev.expo.mine"]"""
      )
    )
  }

  @Test
  fun `missing empty or malformed metadata keeps exact matching`() {
    for (metadata in listOf("", "[]", "{}", "not-json", """["dev.expo.mine", 42]""", """[null]""", """[""]""")) {
      assertEquals(
        setOf("dev.expo.mine.dev"),
        DevLauncherAppIdentifiers.fromMetadata("dev.expo.mine.dev", metadata)
      )
    }
  }
}
