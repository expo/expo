// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.channels.Channels

// No Android APIs here, so these can be unit tested on the JVM.

/**
 * Up to [count] bytes from the start of the stream. The buffer's limit is how many bytes were
 * really read, so a caller can't mistake an unread tail for font data.
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
 * [prefix] plus the rest of [rest], in one direct buffer.
 * [android.graphics.fonts.Font.Builder] takes direct buffers only, and reads the whole capacity, so
 * the size has to be exact.
 *
 * `AssetManager` reports the exact remaining length, so the font normally goes straight into native
 * memory with no heap copy. But `available()` can be wrong, so the size is checked and fixed: too
 * low truncates the font, too high leaves zeros after it.
 */
internal fun readWholeFont(prefix: ByteBuffer, rest: InputStream): ByteBuffer {
  val buffer = ByteBuffer.allocateDirect(prefix.remaining() + rest.available())
  buffer.put(prefix)

  val channel = Channels.newChannel(rest)
  while (buffer.hasRemaining() && channel.read(buffer) >= 0) {
    // One read may not fill the buffer.
  }

  // Empty if `available()` was right.
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
