package expo.modules.ui.textfield

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class TruncateToMaxLengthTest {
  @Test
  fun `does not split an emoji at the limit`() {
    assertThat("abcdefghi👍".truncateToMaxLength(10)).isEqualTo("abcdefghi")
  }

  @Test
  fun `does not split a letter from its combining mark at the limit`() {
    assertThat("abcdefghié".truncateToMaxLength(10)).isEqualTo("abcdefghi")
  }
}
