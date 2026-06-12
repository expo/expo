package expo.modules.appmetrics.crashreporting

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.BufferedWriter
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStreamWriter
import java.io.PrintWriter

/**
 * Crash-time persistence for JVM crashes. The write path runs inside a dying
 * process, so it stays minimal: a few escaped `key=value` header lines plus one
 * escaped stack frame per line, written to a temp file and atomically renamed.
 *
 * One file per pid+timestamp, so a crash burst (crash → relaunch → crash)
 * can't overwrite a file the processor hasn't read yet.
 */
class CrashFileWriter(
  private val directory: File,
  private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) {
  /**
   * Creates the crash directory, to keep the write path leaner.
   */
  fun prepare(): Job = scope.launch { runCatching { directory.mkdirs() } }

  /**
   * Writes one pending-crash file. Returns the file, or `null` on any failure —
   * this runs on the crash path and must never throw into the handler chain.
   */
  fun write(
    throwable: Throwable,
    threadName: String,
    sessionId: String?,
    pid: Int,
    crashedAtMillis: Long
  ): File? {
    return try {
      if (!directory.isDirectory && !directory.mkdirs()) {
        return null
      }
      val file = File(directory, "crash-$pid-$crashedAtMillis.txt")
      val tempFile = File(directory, file.name + CrashFileFormat.TEMP_SUFFIX)
      PrintWriter(BufferedWriter(OutputStreamWriter(FileOutputStream(tempFile), Charsets.UTF_8))).use { writer ->
        writer.append("sessionId=").append(CrashFileFormat.escape(sessionId ?: "")).append('\n')
        writer.append("pid=").append(pid.toString()).append('\n')
        writer.append("crashedAt=").append(crashedAtMillis.toString()).append('\n')
        writer.append("thread=").append(CrashFileFormat.escape(threadName)).append('\n')
        writer.append("exceptionClass=").append(CrashFileFormat.escape(throwable.javaClass.name)).append('\n')
        writer.append("composedMessage=").append(CrashFileFormat.escape(CrashReport.composeMessage(throwable))).append('\n')
        writer.append(CrashFileFormat.HEADER_SEPARATOR).append('\n')
        // One escaped frame per line, from the same source `fromThrowable` uses.
        for (element in throwable.stackTrace) {
          writer.append(CrashFileFormat.escape(element.toString())).append('\n')
        }
      }
      // Commit with an atomic rename: the reader only matches the final
      // `.txt` name, so it never sees a half-written file. A crash mid-write
      // leaves the `.txt.tmp` behind, swept later by `deleteOrphanedTempFiles`.
      if (tempFile.renameTo(file)) {
        file
      } else {
        tempFile.delete()
        null
      }
    } catch (_: Throwable) {
      null
    }
  }

  companion object {
    fun forContext(context: android.content.Context): CrashFileWriter =
      CrashFileWriter(CrashFileFormat.crashesDir(context))
  }
}
