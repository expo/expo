package expo.modules.plugin

import com.google.common.truth.Truth.assertThat
import org.junit.Assert.assertThrows
import org.junit.Test

class KotlinVersionsTest {
  @Test
  fun `prefers the Kotlin Gradle plugin used by the build over the version catalog`() {
    // AGP 9.2.1 forces KGP 2.2.10 while the React Native catalog still declares 2.2.0.
    assertThat(resolveKotlinVersion(kotlinGradlePluginVersion = "2.2.10", catalogVersion = "2.2.0"))
      .isEqualTo("2.2.10")
  }

  @Test
  fun `falls back to the version catalog when no Kotlin Gradle plugin is available`() {
    assertThat(resolveKotlinVersion(kotlinGradlePluginVersion = null, catalogVersion = "2.2.21"))
      .isEqualTo("2.2.21")
  }

  @Test
  fun `falls back to the default Kotlin version`() {
    assertThat(resolveKotlinVersion(kotlinGradlePluginVersion = null, catalogVersion = null))
      .isEqualTo(defaultKotlinVersion)
  }

  @Test
  fun `resolves the KSP release tied to the Kotlin version`() {
    assertThat(resolveKspVersion("2.2.10")).isEqualTo("2.2.10-2.0.2")
    assertThat(resolveKspVersion("2.2.0")).isEqualTo("2.2.0-2.0.2")
  }

  @Test
  fun `uses the latest KSP for Kotlin 2_3 and newer`() {
    assertThat(resolveKspVersion("2.3.0")).isEqualTo(latestKspVersion)
    assertThat(resolveKspVersion("2.3.0-Beta1")).isEqualTo(latestKspVersion)
  }

  @Test
  fun `compares Kotlin versions numerically`() {
    assertThat(resolveKspVersion("2.10.0")).isEqualTo(latestKspVersion)
    assertThat(resolveKspVersion("10.0.0")).isEqualTo(latestKspVersion)
  }

  @Test
  fun `parses Kotlin versions`() {
    assertThat(parseKotlinVersion("2.2.10")).isEqualTo(KotlinVersion(2, 2, 10))
    assertThat(parseKotlinVersion("2.3.0-RC2")).isEqualTo(KotlinVersion(2, 3, 0))
    assertThat(parseKotlinVersion("2.3")).isEqualTo(KotlinVersion(2, 3, 0))
    assertThat(parseKotlinVersion("")).isNull()
    assertThat(parseKotlinVersion("2.x.0")).isNull()
    assertThat(parseKotlinVersion("2.3.0.1")).isNull()
  }

  @Test
  fun `rejects Kotlin versions older than the supported range`() {
    val error = assertThrows(IllegalStateException::class.java) { resolveKspVersion("2.0.21") }
    assertThat(error.message).contains("Kotlin 2.0.21 is not supported by Expo modules")
    assertThat(error.message).contains("The minimum supported Kotlin version is 2.2.0")
  }
}
