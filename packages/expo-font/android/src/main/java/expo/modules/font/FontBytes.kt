// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.channels.Channels

// This file uses no Android APIs. Unit tests can therefore run it on the JVM.

/**
 * Up to [count] bytes from the start of the stream. The buffer limit gives the number of bytes
 * that the function read. A caller therefore cannot read unwritten bytes as font data.
 */
internal fun InputStream.readAtMost(count: Int): ByteBuffer {
  val bytes = ByteArray(count)
  var total = 0
  while (total < count) {
    val read = read(bytes, total, count - total)
    if (read < 0) {
      break
    }
    total += read
  }
  return ByteBuffer.wrap(bytes, 0, total)
}

/**
 * [prefix] and the remainder of [rest], in one direct buffer.
 *
 * [android.graphics.fonts.Font.Builder] accepts only direct buffers, and it reads the full
 * capacity. The buffer size must therefore be exact.
 *
 * `AssetManager` gives the exact number of bytes that remain. The function therefore writes
 * the font into native memory directly, with no copy on the heap. But `available()` can give a
 * wrong number, so the function checks the size and corrects it. A number that is too small
 * truncates the font. A number that is too large adds zeros after the font.
 */
internal fun readWholeFont(prefix: ByteBuffer, rest: InputStream): ByteBuffer {
  val buffer = ByteBuffer.allocateDirect(prefix.remaining() + rest.available())
  buffer.put(prefix)

  val channel = Channels.newChannel(rest)
  while (buffer.hasRemaining() && channel.read(buffer) >= 0) {
    // One read can fill less than the full buffer.
  }

  // This is empty if `available()` gave the correct number.
  val leftover = rest.readBytes()
  if (!buffer.hasRemaining() && leftover.isEmpty()) {
    return buffer.apply { rewind() }
  }

  buffer.flip()
  val exact = ByteBuffer.allocateDirect(buffer.remaining() + leftover.size)
  exact.put(buffer)
  exact.put(leftover)
  return exact.apply { rewind() }
}
