package expo.modules.asset

import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

internal fun getMD5HashOfFileContent(file: File): String? {
  return try {
    val digest = MessageDigest.getInstance("MD5")
    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
    FileInputStream(file).use { inputStream ->
      while (true) {
        val bytesRead = inputStream.read(buffer)
        if (bytesRead == -1) break
        digest.update(buffer, 0, bytesRead)
      }
    }
    digest.digest().joinToString(separator = "") { "%02x".format(it) }
  } catch (e: Exception) {
    e.printStackTrace()
    null
  }
}
