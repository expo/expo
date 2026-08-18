package expo.modules.filesystem.legacy

import android.util.Base64
import java.io.InputStream

// `encoding` is nullable because the record converter leaves fields absent from the JS options
// object null instead of applying the `ReadingOptions` default. Anything that is not base64 is
// read as UTF-8, which is what the module did before this function existed.
internal fun readInputStreamAsString(
  inputStream: InputStream,
  encoding: EncodingType?,
  options: ReadingOptions
): String {
  val bytes = inputStream.readBytes(options)

  return if (encoding == EncodingType.BASE64) {
    Base64.encodeToString(bytes, Base64.NO_WRAP)
  } else {
    String(bytes, Charsets.UTF_8)
  }
}

private fun InputStream.readBytes(options: ReadingOptions): ByteArray {
  if (options.length != null && options.position != null) {
    skipBytes(options.position.toLong())
    return readByteRange(options.length)
  }
  return readBytes()
}

private fun InputStream.skipBytes(position: Long) {
  var remaining = position
  while (remaining > 0) {
    val skipped = skip(remaining)
    if (skipped > 0) {
      remaining -= skipped
      continue
    }
    if (read() == -1) {
      break
    }
    remaining--
  }
}

private fun InputStream.readByteRange(length: Int): ByteArray {
  val buffer = ByteArray(length)
  var offset = 0
  while (offset < length) {
    val bytesRead = read(buffer, offset, length - offset)
    if (bytesRead <= 0) {
      break
    }
    offset += bytesRead
  }
  return buffer.copyOf(offset)
}
