package expo.modules.kotlin.types

import android.graphics.Color
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
internal class ColorTypeConverterTest {
  @Test
  fun `converts from CSS named color`() {
    val colorString = DynamicFromObject("papayawhip")

    val color = convert<Color>(colorString)

    val expectedColor = arrayOf(255f, 239f, 213f).map { it / 255f }
    Truth.assertThat(color.alpha()).isEqualTo(1f)
    Truth.assertThat(color.red()).isEqualTo(expectedColor[0])
    Truth.assertThat(color.green()).isEqualTo(expectedColor[1])
    Truth.assertThat(color.blue()).isEqualTo(expectedColor[2])
  }

  @Test
  fun `converts from transparent`() {
    val colorString = DynamicFromObject("transparent")

    val color = convert<Color>(colorString)

    Truth.assertThat(color.alpha()).isEqualTo(0f)
  }

  @Test
  fun `converts from int`() {
    val colorInt = DynamicFromObject(Color.parseColor("#aabbcc").toDouble())

    val color = convert<Color>(colorInt)

    val expectedColor = arrayOf(0xaa, 0xbb, 0xcc).map { it.toFloat() / 255f }
    Truth.assertThat(color.alpha()).isEqualTo(1f)
    Truth.assertThat(color.red()).isEqualTo(expectedColor[0])
    Truth.assertThat(color.green()).isEqualTo(expectedColor[1])
    Truth.assertThat(color.blue()).isEqualTo(expectedColor[2])
  }

  @Test
  fun `converts from double array`() {
    val colorArray = DynamicFromObject(
      JavaOnlyArray().apply {
        pushDouble(0xaa.toDouble() / 255.0)
        pushDouble(0xbb.toDouble() / 255.0)
        pushDouble(0xcc.toDouble() / 255.0)
      }
    )

    val color = convert<Color>(colorArray)
    val expectedColor = arrayOf(0xaa, 0xbb, 0xcc).map { it.toFloat() / 255f }
    Truth.assertThat(color.alpha()).isEqualTo(1f)
    Truth.assertThat(color.red()).isEqualTo(expectedColor[0])
    Truth.assertThat(color.green()).isEqualTo(expectedColor[1])
    Truth.assertThat(color.blue()).isEqualTo(expectedColor[2])
  }
}
