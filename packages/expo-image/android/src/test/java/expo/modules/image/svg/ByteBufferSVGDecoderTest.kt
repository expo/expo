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
    // The view box only parses once the variable is substituted, so the assertion fails if the
    // options never reach the shared parsing code.
    val withVariableViewBox = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="var(--box)"/>"""
    val options = Options().set(CustomOptions.svgVariables, mapOf("--box" to "0 0 10 20"))
    val resource = ByteBufferSVGDecoder().decode(ByteBuffer.wrap(withVariableViewBox.toByteArray()), 0, 0, options)
    val viewBox = resource!!.get().documentViewBox
    assertEquals(10f, viewBox.width())
    assertEquals(20f, viewBox.height())
  }
}
