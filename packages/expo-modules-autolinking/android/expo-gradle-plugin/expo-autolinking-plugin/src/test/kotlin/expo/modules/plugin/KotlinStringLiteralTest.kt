package expo.modules.plugin

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class KotlinStringLiteralTest {
  @Test
  fun `escapes the dollar sign of the local modules package`() {
    // Without the escape, the generated `"$local"` reads a variable named `local` and the build fails.
    assertThat(kotlinStringLiteral("\$local")).isEqualTo("\"\\\$local\"")
  }

  @Test
  fun `keeps npm package names as they are`() {
    assertThat(kotlinStringLiteral("@expo/ui")).isEqualTo("\"@expo/ui\"")
  }

  @Test
  fun `escapes quotes and backslashes`() {
    assertThat(kotlinStringLiteral("a\"b\\c")).isEqualTo("\"a\\\"b\\\\c\"")
  }
}
