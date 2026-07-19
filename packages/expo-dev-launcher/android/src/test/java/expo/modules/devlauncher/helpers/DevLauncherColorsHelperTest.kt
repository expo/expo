package expo.modules.devlauncher.helpers

import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherColorsHelperTest {
  @Test
  fun `checks if RGBAtoARGB returns correct values`() {
    Truth.assertThat(RGBAtoARGB("#11223344")).isEqualTo("#44112233")
    Truth.assertThat(RGBAtoARGB("11223344")).isEqualTo("11223344")
    Truth.assertThat(RGBAtoARGB("#112233")).isEqualTo("#112233")
  }

  @Test
  fun `checks if isValidColor returns correct values`() {
    Truth.assertThat(isValidColor("#11223344")).isTrue()
    Truth.assertThat(isValidColor("11223344")).isFalse()
    Truth.assertThat(isValidColor("#112233")).isTrue()
    Truth.assertThat(isValidColor("$112233")).isFalse()
    Truth.assertThat(isValidColor("#PPAAVV")).isFalse()
  }
}
