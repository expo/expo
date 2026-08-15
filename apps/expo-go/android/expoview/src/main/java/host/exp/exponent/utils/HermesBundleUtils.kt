// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import java.io.File
import java.io.IOException

object HermesBundleUtils {
  // https://github.com/facebook/hermes/blob/ae8554141cd3d3f64eb98d70c97112fcc6143d34/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L26-L27
  private val HERMES_MAGIC_HEADER = byteArrayOf(
    0xc6.toByte(),
    0x1f.toByte(),
    0xbc.toByte(),
    0x03.toByte(),
    0xc1.toByte(),
    0x03.toByte(),
    0x19.toByte(),
    0x1f.toByte()
  )

  fun isHermesBundle(file: File): Boolean {
    if (!file.exists() || file.length() < HERMES_MAGIC_HEADER.size) return false
    return try {
      file.inputStream().use { input ->
        val bytes = ByteArray(HERMES_MAGIC_HEADER.size)
        val read = input.read(bytes, 0, bytes.size)
        read == HERMES_MAGIC_HEADER.size && bytes.contentEquals(HERMES_MAGIC_HEADER)
      }
    } catch (e: IOException) {
      false
    }
  }
}
