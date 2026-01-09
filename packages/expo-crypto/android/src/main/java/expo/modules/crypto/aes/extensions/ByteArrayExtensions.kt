package expo.modules.crypto.aes.extensions

import android.util.Base64
import expo.modules.crypto.aes.enums.DataFormat
import expo.modules.crypto.aes.enums.KeyEncoding
import java.nio.ByteBuffer

fun ByteBuffer.copiedArray(): ByteArray =
  ByteArray(remaining()).also { get(it) }

inline fun ByteArray.init(block: ByteBuffer.() -> Unit): ByteArray = apply {
  ByteBuffer.wrap(this).also { block(it) }
}

fun ByteArray.base64Encoded(): String =
  Base64.encodeToString(this, Base64.NO_WRAP)

fun ByteArray.hexEncoded(): String =
  joinToString("") { "%02x".format(it) }

fun ByteArray.encoded(encoding: KeyEncoding): String =
  when (encoding) {
    KeyEncoding.HEX -> this.hexEncoded()
    KeyEncoding.BASE64 -> this.base64Encoded()
  }

fun ByteArray.formatted(format: DataFormat?): Any =
  when (format) {
    DataFormat.BYTES, null -> this
    DataFormat.BASE64 -> this.base64Encoded()
  }
