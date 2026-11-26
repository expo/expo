package expo.modules.image.svg

import com.bumptech.glide.load.Options
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.BufferedInputStream
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.ByteBuffer

@RunWith(RobolectricTestRunner::class)
class SVGHeaderTest {
  private val svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"/>"""

  // The start of an MP4 file: a box size followed by `ftyp`.
  private val mp4 = byteArrayOf(0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32)

  private fun handlesStream(bytes: ByteArray) = SVGDecoder().handles(ByteArrayInputStream(bytes), Options())

  private fun handlesBuffer(bytes: ByteArray) = ByteBufferSVGDecoder().handles(ByteBuffer.wrap(bytes), Options())

  @Test
  fun `accepts svg documents`() {
    for (document in listOf(
      svg,
      """<?xml version="1.0" encoding="UTF-8"?>$svg""",
      "\n  \t$svg",
      "<!-- comment -->$svg",
      "﻿$svg"
    )) {
      assertTrue(document, handlesStream(document.toByteArray()))
      assertTrue(document, handlesBuffer(document.toByteArray()))
    }
  }

  @Test
  fun `accepts utf-16 documents with and without a byte order mark`() {
    for (charset in listOf(Charsets.UTF_16, Charsets.UTF_16BE, Charsets.UTF_16LE)) {
      assertTrue(charset.name(), handlesStream(svg.toByteArray(charset)))
    }
  }

  @Test
  fun `accepts gzip compressed documents`() {
    assertTrue(handlesStream(byteArrayOf(0x1F, 0x8B.toByte(), 0x08, 0x00)))
  }

  @Test
  fun `rejects a video`() {
    assertFalse(handlesStream(mp4))
    assertFalse(handlesBuffer(mp4))
  }

  @Test
  fun `rejects a raster image and empty data`() {
    val png = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    assertFalse(handlesStream(png))
    assertFalse(handlesStream(ByteArray(0)))
  }

  @Test
  fun `leaves the stream and buffer positions untouched`() {
    val stream = BufferedInputStream(ByteArrayInputStream(svg.toByteArray()))
    SVGDecoder().handles(stream, Options())
    assertEquals(svg, stream.readBytes().decodeToString())

    val buffer = ByteBuffer.wrap(svg.toByteArray())
    ByteBufferSVGDecoder().handles(buffer, Options())
    assertEquals(0, buffer.position())
  }

  @Test
  fun `accepts streams that cannot be reset, as before`() {
    val unmarkable = object : InputStream() {
      override fun read() = -1
      override fun markSupported() = false
    }
    assertTrue(SVGDecoder().handles(unmarkable, Options()))
  }
}
