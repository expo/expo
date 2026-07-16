package expo.modules.filesystem.legacy

import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream

internal fun readInputStreamAsString(
  inputStream: InputStream,
  encoding: EncodingType,
  options: ReadingOptions
): String {
  val bytes = inputStream.readBytes(options)

  return when (encoding) {
    EncodingType.BASE64 -> Base64.encodeToString(bytes, Base64.NO_WRAP)
    EncodingType.UTF8 -> String(bytes, Charsets.UTF_8)
  }
}

private fun InputStream.readBytes(options: ReadingOptions): ByteArray {
  if (options.length != null && options.position != null) {
    skipBytes(options.position.toLong())
    return readByteRange(options.length)
  }
  return readAllBytesCompat()
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

@Throws(IOException::class)
private fun InputStream.readAllBytesCompat(): ByteArray {
  val byteBuffer = ByteArrayOutputStream()
  val buffer = ByteArray(1024)
  try {
    var len: Int
    while (read(buffer).also { len = it } != -1) {
      byteBuffer.write(buffer, 0, len)
    }
    return byteBuffer.toByteArray()
  } finally {
    try {
      byteBuffer.close()
    } catch (ignored: IOException) {
    }
  }
}
