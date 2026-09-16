package expo.modules.image.svg

import com.bumptech.glide.load.Options
import expo.modules.image.CustomOptions
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.ByteArrayInputStream
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
class SVGDecoderTest {
  private fun decode(bytes: ByteArray, variables: Map<String, String>? = null) =
    SVGDecoder().decode(
      ByteArrayInputStream(bytes),
      0,
      0,
      Options().apply { variables?.let { set(CustomOptions.svgVariables, it) } }
    )

  @Test
  fun `substitutes variables in a utf-8 document`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="var(--box)"/>"""
    val resource = decode(document.toByteArray(), mapOf("--box" to "0 0 10 20"))
    val viewBox = resource!!.get().documentViewBox
    assertEquals(10f, viewBox.width())
    assertEquals(20f, viewBox.height())
  }

  @Test
  fun `parses a utf-16 document with a byte order mark`() {
    // A strict UTF-8 decode accepts UTF-16, so the bytes go to the parser untouched instead.
    val document = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"/>"""
    val resource = decode(document.toByteArray(Charsets.UTF_16), mapOf("--unused" to "red"))
    assertNotNull(resource)
    val viewBox = resource!!.get().documentViewBox
    assertEquals(10f, viewBox.width())
    assertEquals(20f, viewBox.height())
  }

  @Test
  fun `leaves a utf-16 document untouched rather than substituting into it`() {
    // Unparseable either way without a mark. What matters is that we do not substitute into
    // misdecoded text, which would corrupt a document the parser could otherwise read.
    val document = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="var(--box)"/>"""
    assertThrows(IOException::class.java) {
      decode(document.toByteArray(Charsets.UTF_16LE), mapOf("--box" to "0 0 10 20"))
    }
  }
}
