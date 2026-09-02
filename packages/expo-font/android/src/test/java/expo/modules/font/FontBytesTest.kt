// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.ByteBuffer
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** A font-sized run of bytes, distinctive enough that a misplaced copy shows up as a mismatch. */
private fun fontBytes(size: Int) = ByteArray(size) { ((it * 37) % 251).toByte() }

/**
 * A stream that misreports `available()` by [skew] and hands out at most [chunk] bytes per read,
 * modelling the two ways a real stream can defeat a buffer sized from `available()`.
 */
private class SkewedStream(
  data: ByteArray,
  private val skew: Int = 0,
  private val chunk: Int = Int.MAX_VALUE
) : InputStream() {
  private val inner = ByteArrayInputStream(data)
  override fun read(): Int = inner.read()
  override fun read(b: ByteArray, off: Int, len: Int): Int = inner.read(b, off, minOf(len, chunk))
  override fun available(): Int = (inner.available() + skew).coerceAtLeast(0)
}

private fun contentsOf(buffer: ByteBuffer): ByteArray {
  val bytes = ByteArray(buffer.remaining())
  buffer.duplicate().get(bytes)
  return bytes
}

class ReadAtMostTest {
  @Test
  fun `bounds the buffer to the whole read`() {
    val font = fontBytes(1000)
    val prefix = SkewedStream(font).readAtMost(400)

    assertEquals(0, prefix.position())
    assertEquals(400, prefix.limit())
    assertArrayEquals(font.copyOf(400), contentsOf(prefix))
  }

  @Test
  fun `bounds the buffer to a stream that ends early`() {
    // The array is the requested size, so the limit is the only thing saying where the font stops.
    // Reading past it would hand the unread tail of zeros to the fvar parser as if it were data.
    val prefix = SkewedStream(fontBytes(100)).readAtMost(4092)

    assertEquals(100, prefix.limit())
    assertEquals(4092, prefix.capacity())
    assertArrayEquals(fontBytes(100), contentsOf(prefix))
  }

  @Test
  fun `keeps reading when the stream returns less than asked for`() {
    val font = fontBytes(1000)
    val prefix = SkewedStream(font, chunk = 7).readAtMost(1000)

    assertEquals(1000, prefix.limit())
    assertArrayEquals(font, contentsOf(prefix))
  }
}

class ReadWholeFontTest {
  private fun assertRebuildsFont(font: ByteArray, stream: SkewedStream, prefixSize: Int = 4092) {
    val prefix = stream.readAtMost(prefixSize)
    val whole = readWholeFont(prefix, stream)

    // `Font.Builder` reads a direct buffer's whole capacity, so the size has to be exact — a limit
    // short of the capacity would still hand the trailing bytes to the font parser.
    assertTrue("must be direct for Font.Builder", whole.isDirect)
    assertEquals("capacity has to match the font exactly", font.size, whole.capacity())
    assertEquals(0, whole.position())
    assertArrayEquals(font, contentsOf(whole))
  }

  @Test
  fun `reads the font when available() is exact`() {
    val font = fontBytes(50_000)
    assertRebuildsFont(font, SkewedStream(font))
  }

  @Test
  fun `corrects an available() that under-reports`() {
    // The buffer fills before the font ends, so the remainder would be lost without the correction.
    val font = fontBytes(50_000)
    assertRebuildsFont(font, SkewedStream(font, skew = -10_000))
  }

  @Test
  fun `corrects an available() that over-reports`() {
    // The stream ends before the buffer fills, leaving a tail of zeros past the font's last table.
    val font = fontBytes(50_000)
    assertRebuildsFont(font, SkewedStream(font, skew = 10_000))
  }

  @Test
  fun `keeps reading when the stream returns less than asked for`() {
    val font = fontBytes(50_000)
    assertRebuildsFont(font, SkewedStream(font, chunk = 1000))
  }

  @Test
  fun `reads a font no longer than the prefix already read`() {
    val font = fontBytes(300)
    assertRebuildsFont(font, SkewedStream(font))
  }
}
