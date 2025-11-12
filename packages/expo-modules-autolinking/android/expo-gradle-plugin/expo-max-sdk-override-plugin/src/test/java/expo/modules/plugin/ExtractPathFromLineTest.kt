package expo.modules.plugin.utils

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class ExtractPathFromLineTest {

  @Test
  fun `extracts path from a standard merge log line`() {
    val line = "\tMERGED from /Users/user/project/app/src/main/AndroidManifest.xml:11:3-33"
    val path = extractPathFromLine(line)
    assertThat(path).isEqualTo("/Users/user/project/app/src/main/AndroidManifest.xml")
  }

  @Test
  fun `extracts path from an ADDED line`() {
    val line = "  ADDED from /Users/user/project/library/build/intermediates/merged_manifest/debug/AndroidManifest.xml:23:7-77"
    val path = extractPathFromLine(line)
    assertThat(path).isEqualTo("/Users/user/project/library/build/intermediates/merged_manifest/debug/AndroidManifest.xml")
  }

  @Test
  fun `returns null if no path is found`() {
    val line = "\tandroid:maxSdkVersion"
    val path = extractPathFromLine(line)
    assertThat(path).isNull()
  }
}
