package expo.modules.image.svg

import java.io.InputStream
import java.nio.ByteBuffer

/**
 * Tells whether data looks like an SVG document from its first bytes, so the SVG decoders don't
 * claim data they can't parse. Without this, a stream that the other decoders rejected (for example
 * a video behind a `content://` URI) was read into memory in full before failing to parse.
 */
internal object SVGHeader {
  /** How many bytes to look at. Enough to skip a byte order mark and some leading whitespace. */
  const val SNIFF_LENGTH = 256

  /**
   * Peeks at the beginning of a markable stream and resets it. Streams that can't be reset are
   * assumed to be SVG, as before, since reading from them would consume the data.
   */
  fun looksLikeSvg(source: InputStream): Boolean {
    if (!source.markSupported()) {
      return true
    }
    val header = ByteArray(SNIFF_LENGTH)
    source.mark(SNIFF_LENGTH)
    val length = try {
      readFully(source, header)
    } finally {
      source.reset()
    }
    return looksLikeSvg(header, length)
  }

  /** Peeks at the beginning of a buffer without moving its position. */
  fun looksLikeSvg(source: ByteBuffer): Boolean {
    val view = source.duplicate()
    val header = ByteArray(minOf(view.remaining(), SNIFF_LENGTH))
    view.get(header)
    return looksLikeSvg(header, header.size)
  }

  fun looksLikeSvg(bytes: ByteArray, length: Int): Boolean {
    if (length <= 0) {
      return false
    }
    // gzip-compressed SVG (SVGZ), which AndroidSVG decompresses itself.
    if (length >= 2 && bytes[0] == 0x1F.toByte() && bytes[1] == 0x8B.toByte()) {
      return true
    }
    var index = 0
    // UTF-8 byte order mark.
    if (length >= 3 && bytes[0] == 0xEF.toByte() && bytes[1] == 0xBB.toByte() && bytes[2] == 0xBF.toByte()) {
      index = 3
    } else if (length >= 2 && isUtf16ByteOrderMark(bytes[0], bytes[1])) {
      index = 2
    }
    // Skip whitespace and the NUL bytes that UTF-16 and UTF-32 interleave with ASCII characters.
    while (index < length && isWhitespaceOrNul(bytes[index])) {
      index++
    }
    return index < length && bytes[index] == '<'.code.toByte()
  }

  private fun isUtf16ByteOrderMark(first: Byte, second: Byte): Boolean =
    (first == 0xFE.toByte() && second == 0xFF.toByte()) || (first == 0xFF.toByte() && second == 0xFE.toByte())

  private fun isWhitespaceOrNul(byte: Byte): Boolean =
    byte == 0.toByte() || byte == ' '.code.toByte() || byte in 0x09..0x0D

  private fun readFully(source: InputStream, buffer: ByteArray): Int {
    var total = 0
    while (total < buffer.size) {
      val read = source.read(buffer, total, buffer.size - total)
      if (read == -1) {
        break
      }
      total += read
    }
    return total
  }
}
