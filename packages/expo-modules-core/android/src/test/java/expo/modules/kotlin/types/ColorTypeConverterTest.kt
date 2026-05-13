package expo.modules.kotlin.types

import android.graphics.Color
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.assertThrows
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
  fun `converts from rgb string with whitespace`() {
    val colorString = DynamicFromObject(" rgb( 12 , 34 , 56 ) ")

    val color = convert<Color>(colorString)

    val expectedColor = arrayOf(12f, 34f, 56f).map { it / 255f }
    Truth.assertThat(color.alpha()).isEqualTo(1f)
    Truth.assertThat(color.red()).isEqualTo(expectedColor[0])
    Truth.assertThat(color.green()).isEqualTo(expectedColor[1])
    Truth.assertThat(color.blue()).isEqualTo(expectedColor[2])
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

  @Test
  fun `should convert from rgb() with comma syntax`() {
    val color = convert<Color>(DynamicFromObject("rgb(0, 0, 0)"))

    Truth.assertThat(color.red()).isEqualTo(0f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from rgb() with space syntax`() {
    val color = convert<Color>(DynamicFromObject("rgb(255 128 0)"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(128f / 255f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from rgba() with alpha`() {
    val color = convert<Color>(DynamicFromObject("rgba(255, 0, 0, 0.5)"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(0.5f)
  }

  @Test
  fun `should convert from rgb() with slash alpha`() {
    val color = convert<Color>(DynamicFromObject("rgb(0 0 255 / 0.8)"))

    Truth.assertThat(color.red()).isEqualTo(0f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(1f)
    Truth.assertThat(color.alpha()).isEqualTo(0.8f)
  }

  @Test
  fun `should convert from rgb() with percentage values`() {
    val color = convert<Color>(DynamicFromObject("rgb(100%, 50%, 0%)"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0.5f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from hsl() with comma syntax`() {
    val color = convert<Color>(DynamicFromObject("hsl(0, 100%, 50%)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from hsl() with space syntax`() {
    val color = convert<Color>(DynamicFromObject("hsl(120 100% 50%)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from hsla() with alpha`() {
    val color = convert<Color>(DynamicFromObject("hsla(240, 100%, 50%, 0.5)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.alpha()).isEqualTo(0.5f)
  }

  @Test
  fun `should convert from hsl() achromatic gray`() {
    val color = convert<Color>(DynamicFromObject("hsl(0, 0%, 50%)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(0.5f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(0.5f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(0.5f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from hwb()`() {
    val color = convert<Color>(DynamicFromObject("hwb(0 0% 0%)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from hwb() with alpha`() {
    val color = convert<Color>(DynamicFromObject("hwb(120 0% 0% / 0.5)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.alpha()).isEqualTo(0.5f)
  }

  @Test
  fun `should convert from rgba() with percentage alpha`() {
    val color = convert<Color>(DynamicFromObject("rgba(255, 0, 0, 50%)"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(0.5f)
  }

  @Test
  fun `should convert from 3-digit hex shorthand`() {
    val color = convert<Color>(DynamicFromObject("#f00"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from 4-digit hex shorthand with alpha`() {
    val color = convert<Color>(DynamicFromObject("#f008"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isWithin(1e-2f).of(0.533f)
  }

  @Test
  fun `should convert from 8-digit hex with CSS byte order`() {
    val color = convert<Color>(DynamicFromObject("#ff000080"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isWithin(1e-2f).of(0.502f)
  }

  @Test
  fun `should convert from hsl() with negative hue`() {
    // hsl(-120, 100%, 50%) should be same as hsl(240, 100%, 50%) = blue
    val color = convert<Color>(DynamicFromObject("hsl(-120, 100%, 50%)"))

    Truth.assertThat(color.red()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.green()).isWithin(1e-3f).of(0f)
    Truth.assertThat(color.blue()).isWithin(1e-3f).of(1f)
    Truth.assertThat(color.alpha()).isEqualTo(1f)
  }

  @Test
  fun `should convert from rgba() with decimal without leading zero`() {
    val color = convert<Color>(DynamicFromObject("rgba(255, 0, 0, .5)"))

    Truth.assertThat(color.red()).isEqualTo(1f)
    Truth.assertThat(color.green()).isEqualTo(0f)
    Truth.assertThat(color.blue()).isEqualTo(0f)
    Truth.assertThat(color.alpha()).isEqualTo(0.5f)
  }

  @Test
  fun `should throw when color components array has fewer than 3 values`() {
    val shortArrays = listOf(
      JavaOnlyArray(),
      JavaOnlyArray().apply { pushDouble(1.0) },
      JavaOnlyArray().apply {
        pushDouble(1.0)
        pushDouble(0.5)
      }
    )

    for (array in shortArrays) {
      assertThrows<InvalidColorComponentsException> {
        convert<Color>(DynamicFromObject(array))
      }
    }
  }
}
