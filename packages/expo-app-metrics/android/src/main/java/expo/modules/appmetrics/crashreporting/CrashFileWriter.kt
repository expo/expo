package expo.modules.appmetrics.crashreporting

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import java.io.File

/**
 * Crash-time persistence for JVM crashes. The write path runs inside a dying
 * process, so it stays minimal: build a `PendingJvmCrashPayload`, JSON-encode it,
 * write to a temp file and atomically rename.
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
      val file = File(directory, "crash-$pid-$crashedAtMillis.json")
      val tempFile = File(directory, file.name + CrashFileFormat.TEMP_SUFFIX)
      val payload = PendingJvmCrashPayload(
        sessionId = sessionId,
        pid = pid,
        crashedAtMillis = crashedAtMillis,
        exceptionClass = throwable.javaClass.name,
        composedMessage = CrashReport.composeMessage(throwable),
        threadName = threadName,
        // Same frame source `fromThrowable` uses.
        stackFrames = throwable.stackTrace.map { it.toString() }
      )
      tempFile.writeText(CrashFileFormat.json.encodeToString(payload))
      // Commit with an atomic rename: the reader only matches the final
      // `.json` name, so it never sees a half-written file. A crash mid-write
      // leaves the `.json.tmp` behind, swept later by `deleteOrphanedTempFiles`.
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
