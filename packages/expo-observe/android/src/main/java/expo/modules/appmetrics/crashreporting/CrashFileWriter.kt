package expo.modules.appmetrics.crashreporting

import android.util.AtomicFile
import kotlinx.serialization.encodeToString
import java.io.File

/**
 * Crash-time persistence for JVM crashes. The write path runs inside a dying
 * process, so it stays minimal: build a `PendingJvmCrashPayload`, JSON-encode it,
 * and hand it to `AtomicFile`, which stages the bytes, fsyncs, then commits.
 *
 * One file per pid+timestamp, so a crash burst (crash → relaunch → crash)
 * can't overwrite a file the processor hasn't read yet.
 */
class CrashFileWriter(private val directory: File) {
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
      // `AtomicFile` stages the bytes in a sibling temp, fsyncs, then renames it
      // onto `file`. The reader only matches the final `.json`, so it never sees a
      // half-written file; a crash mid-write leaves only an orphaned temp, swept
      // later by `deleteOrphanedTempFiles`. The fsync also survives a power loss
      // the bare rename wouldn't.
      val atomicFile = AtomicFile(file)
      val stream = atomicFile.startWrite()
      try {
        stream.write(CrashFileFormat.json.encodeToString(payload).toByteArray())
        atomicFile.finishWrite(stream)
      } catch (e: Throwable) {
        atomicFile.failWrite(stream)
        return null
      }
      file
    } catch (_: Throwable) {
      null
    }
  }

  companion object {
    fun forContext(context: android.content.Context): CrashFileWriter =
      CrashFileWriter(CrashFileFormat.crashesDir(context))
  }
}
