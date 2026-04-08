package expo.modules.filesystem

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream

class FileSystemDownloadTest {
  @Test
  fun streamWithProgressEmitsFinalEventWhenContentLengthIsUnknown() {
    val progressEvents = mutableListOf<Pair<Long, Long>>()
    val outputFile = File.createTempFile("filesystem-download", ".tmp")

    try {
      FileOutputStream(outputFile).use { output ->
        runBlocking {
          streamWithProgress(
            input = ByteArrayInputStream(byteArrayOf(1, 2, 3, 4)),
            output = output,
            contentLength = -1L,
            uuid = "download-1",
            emitProgress = { _, bytesWritten, totalBytes ->
              progressEvents += bytesWritten to totalBytes
            },
            currentTimeProvider = { 0L }
          )
        }
      }

      assertEquals(listOf(4L to -1L), progressEvents)
    } finally {
      outputFile.delete()
    }
  }
}
