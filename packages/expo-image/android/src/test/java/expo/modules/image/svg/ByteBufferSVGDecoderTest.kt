package expo.modules.image.svg

import com.bumptech.glide.load.Options
import expo.modules.image.CustomOptions
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.nio.ByteBuffer

@RunWith(RobolectricTestRunner::class)
class ByteBufferSVGDecoderTest {
  private val document = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect fill="var(--a, red)"/></svg>"""

  @Test
  fun `decodes an SVG from a byte buffer`() {
    val resource = ByteBufferSVGDecoder().decode(ByteBuffer.wrap(document.toByteArray()), 0, 0, Options())
    assertNotNull(resource)
    assertEquals(20f / 10f, resource!!.get().documentViewBox.height() / resource.get().documentViewBox.width())
  }

  @Test
  fun `passes the request options through to the substitution`() {
    // The variables travel on the request options, which must reach the shared parsing code.
    val options = Options().set(CustomOptions.svgVariables, mapOf("--a" to "blue"))
    assertNotNull(ByteBufferSVGDecoder().decode(ByteBuffer.wrap(document.toByteArray()), 0, 0, options))
  }
}
