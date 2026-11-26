package expo.modules.plugin.utils

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class ManifestMergerReportPathTest {

  @Test
  fun `uses only the build type when there are no flavors`() {
    assertThat(manifestMergerReportPath(emptyList(), "debug"))
      .isEqualTo("outputs/logs/manifest-merger-debug-report.txt")
  }

  @Test
  fun `joins a single flavor and the build type`() {
    assertThat(manifestMergerReportPath(listOf("free"), "release"))
      .isEqualTo("outputs/logs/manifest-merger-free-release-report.txt")
  }

  @Test
  fun `keeps every flavor dimension as its own segment`() {
    assertThat(manifestMergerReportPath(listOf("free", "minApi24"), "debug"))
      .isEqualTo("outputs/logs/manifest-merger-free-minApi24-debug-report.txt")
  }
}
