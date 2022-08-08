package expo.modules.core.logging

import android.content.Context
import android.os.AsyncTask
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.lang.Error
import java.nio.charset.Charset

/**
 * A thread-safe class for reading and writing line-separated strings to a flat file
 * The main use case is for logging specific errors or events, and ensuring that the logs
 * persist across application crashes and restarts (for example, logcat can only read system logs
 * for the current process, and cannot access anything logged before the current process started).
 *
 * All write access to the file goes through asynchronous public methods managed by
 * AsyncTask.SERIAL_EXECUTOR, to ensure that multiple instances accessing the file
 * will have thread-safe access.
 *
 * The only operations supported are
 * - Read the file (synchronous)
 * - Append one or more entries to the file
 * - Filter the file (only retain entries that pass the filter check)
 * - Clear the file (remove all entries)
 *
 */
class PersistentFileLog(
  private val category: String,
  private val context: Context
) {

  /**
   * Read entries from log file
   */
  fun readEntries(): List<String> {
    if (0L == _getFileSize()) {
      return listOf()
    }
    return _readFileSync()
  }

  /**
   * Append entry to the log file
   * Since logging may not require a result handler, the handler parameter is optional
   */
  fun appendEntry(entry: String, completionHandler: ((_: Error?) -> Unit) = { error -> }) {
    AsyncTask.SERIAL_EXECUTOR.execute {
      try {
        this._ensureFileExists()
        val text = when (this._getFileSize()) {
          0L -> entry
          else -> {
            "\n" + entry
          }
        }
        this._appendTextToFile(text)
        completionHandler.invoke(null)
      } catch (e: Error) {
        completionHandler.invoke(e)
      }
    }
  }

  /**
   * Filter existing entries and remove ones where filter(entry) == false
   */
  fun filterEntries(filter: (_: String) -> Boolean, completionHandler: (_: Error?) -> Unit) {
    AsyncTask.SERIAL_EXECUTOR.execute {
      try {
        this._ensureFileExists()
        val contents = this._readFileSync()
        val reducedContents = contents.filter(filter)
        this._writeFileSync(reducedContents)
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
    AsyncTask.SERIAL_EXECUTOR.execute {
      try {
        this._deleteFileSync()
        completionHandler.invoke(null)
      } catch (e: Error) {
        completionHandler.invoke(e)
      }
    }
  }

  // Private functions

  private val filePath = context.filesDir.path + "/" + category

  private fun _ensureFileExists() {
    val fd = File(filePath)
    if (!fd.exists()) {
      val success = fd.createNewFile()
      if (!success) {
        throw IOException("Unable to create file at path $filePath")
      }
    }
  }

  private fun _getFileSize(): Long {
    val fd = File(filePath)
    if (!fd.exists()) {
      return 0L
    }
    var size = 0L
    try {
      FileInputStream(fd).use {
        size = it.channel.size()
      }
    } catch (e: IOException) {
      // File does not exist or is inaccessible
    }
    return size
  }

  private fun _appendTextToFile(text: String) {
    File(filePath).appendText(text, Charset.defaultCharset())
  }

  private fun _readFileSync(): List<String> {
    return _stringToList(File(filePath).readText(Charset.defaultCharset()))
  }

  private fun _writeFileSync(entries: List<String>) {
    File(filePath).writeText(entries.joinToString("\n"), Charset.defaultCharset())
  }

  private fun _deleteFileSync() {
    val fd = File(filePath)
    if (fd.exists()) {
      fd.delete()
    }
  }

  private fun _stringToList(text: String): List<String> {
    return when (text.length) {
      0 -> listOf<String>()
      else -> text.split("\n")
    }
  }
}
