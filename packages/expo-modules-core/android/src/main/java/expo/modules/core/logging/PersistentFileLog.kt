package expo.modules.core.logging

import android.content.Context
import java.io.File
import java.io.IOException
import java.nio.charset.Charset

/**
 * A thread-safe class for reading and writing line-separated strings to a flat file
 * The main use case is for logging specific errors or events, and ensuring that the logs
 * persist across application crashes and restarts (for example, logcat can only read system logs
 * for the current process, and cannot access anything logged before the current process started).
 *
 * All write access to the file goes through asynchronous public methods managed by
 * a static serial dispatch queue implemented with Kotlin coroutines. This ensures that
 * multiple instances accessing the file will have thread-safe access.
 *
 * The only operations supported are
 * - Read the file (synchronous)
 * - Append one or more entries to the file
 * - Filter the file (only retain entries that pass the filter check)
 * - Clear the file (remove all entries)
 *
 */
class PersistentFileLog(
  category: String,
  context: Context
) {

  /**
   * Read entries from log file
   */
  fun readEntries(): List<String> {
    if (0L == getFileSize()) {
      return listOf()
    }
    return readFileLinesSync()
  }

  /**
   * Append entry to the log file
   * Since logging may not require a result handler, the handler parameter is optional
   */
  fun appendEntry(entry: String, completionHandler: ((_: Error?) -> Unit) = { }) {
    queue.add {
      try {
        this.ensureFileExists()
        val text = when (this.getFileSize()) {
          0L -> entry
          else -> {
            "\n" + entry
          }
        }
        this.appendTextToFile(text)
        completionHandler.invoke(null)
      } catch (e: Error) {
        completionHandler.invoke(e)
      }
    }
  }

  /**
   * Filter existing entries and remove ones where filter(entry) == false
   */
  fun purgeEntriesNotMatchingFilter(filter: (_: String) -> Boolean, completionHandler: (_: Error?) -> Unit) {
    queue.add {
      try {
        this.ensureFileExists()
        val contents = this.readFileLinesSync()
        val reducedContents = contents.filter(filter)
        this.writeFileLinesSync(reducedContents)
        completionHandler.invoke(null)
      } catch (e: Throwable) {
        completionHandler.invoke(Error(e))
      }
    }
  }

  /**
   * Clear all entries from the log file
   */
  fun clearEntries(completionHandler: (_: Error?) -> Unit) {
    queue.add {
      try {
        this.deleteFileSync()
        completionHandler.invoke(null)
      } catch (e: Error) {
        completionHandler.invoke(e)
      }
    }
  }

  // Private functions

  private val filePath = "${context.filesDir.path}/$FILE_NAME_PREFIX.$category"

  private fun ensureFileExists() {
    val fd = File(filePath)
    if (!fd.exists()) {
      val success = fd.createNewFile()
      if (!success) {
        throw IOException("Unable to create file at path $filePath")
      }
    }
  }

  private fun getFileSize(): Long {
    val file = File(filePath)
    if (!file.exists()) {
      return 0L
    }
    return try {
      file.inputStream().use { it.channel.size() }
    } catch (e: IOException) {
      // File does not exist or is inaccessible
      0L
    }
  }

  private fun appendTextToFile(text: String) {
    File(filePath).appendText(text, Charset.defaultCharset())
  }

  private fun readFileLinesSync(): List<String> {
    return File(filePath).readLines(Charset.defaultCharset()).filter { line -> line.isNotEmpty() }
  }

  private fun writeFileLinesSync(entries: List<String>) {
    File(filePath).writeText(entries.joinToString("\n"), Charset.defaultCharset())
  }

  private fun deleteFileSync() {
    val fd = File(filePath)
    if (fd.exists()) {
      fd.delete()
    }
  }

  companion object {
    private val queue = PersistentFileLogSerialDispatchQueue()
    private const val FILE_NAME_PREFIX = "dev.expo.modules.core.logging"
  }
}
