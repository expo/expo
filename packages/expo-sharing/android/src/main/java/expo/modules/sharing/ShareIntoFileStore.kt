package expo.modules.sharing

import java.io.File
import java.util.UUID

internal fun safeShareFileName(name: String?, fallback: String): String {
  val safeName = name.orEmpty().replace('/', '_').replace('\\', '_').replace('\u0000', '_')
  return if (safeName.isEmpty() || safeName == "." || safeName == "..") {
    fallback
  } else {
    safeName
  }
}

internal class ShareIntoFileStore(cacheDir: File) {
  val root = File(cacheDir, "expo-sharing")

  fun newDestination(fileName: String): File {
    val directory = File(root, UUID.randomUUID().toString())
    directory.mkdirs()
    return File(directory, fileName)
  }

  fun removeStaleFiles() {
    val threshold = System.currentTimeMillis() - STALE_FILE_AGE_MS
    root.listFiles()?.forEach { directory ->
      if (directory.lastModified() < threshold) {
        directory.deleteRecursively()
      }
    }
  }

  fun removeAll() {
    root.deleteRecursively()
  }

  companion object {
    const val STALE_FILE_AGE_MS = 24 * 60 * 60 * 1000L
  }
}
