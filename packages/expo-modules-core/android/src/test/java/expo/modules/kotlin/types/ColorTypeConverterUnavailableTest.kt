package expo.modules.kotlin.types

import android.graphics.Color
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Regression test for https://github.com/expo/expo/issues/47546. On Android below 8.0 (API < 26)
 * the class-based [Color] API is unavailable, so a `Color?` value must resolve to `null` instead
 * of throwing `MissingTypeConverter`, which otherwise made `@expo/ui` unusable on Android 7.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [24])
internal class ColorTypeConverterUnavailableTest {
  @Test
  fun `resolves a string color to null below API 26`() {
    Truth.assertThat(convert<Color?>(DynamicFromObject("papayawhip"))).isNull()
  }

  @Test
  fun `resolves an int color to null below API 26`() {
    Truth.assertThat(convert<Color?>(DynamicFromObject(0xffaabbcc.toInt().toDouble()))).isNull()
  }

  @Test
  fun `resolves a double-array color to null below API 26`() {
    val array = JavaOnlyArray().apply {
      pushDouble(0.5)
      pushDouble(0.5)
      pushDouble(0.5)
    }
    Truth.assertThat(convert<Color?>(DynamicFromObject(array))).isNull()
  }
}
