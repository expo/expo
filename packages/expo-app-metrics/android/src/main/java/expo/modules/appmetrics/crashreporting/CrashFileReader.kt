package expo.modules.appmetrics.crashreporting

import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.serialization.decodeFromString
import java.io.File

/**
 * Next-launch read side of the pending-crash store written by `CrashFileWriter`. Runs where
 * allocation is safe, so unlike the write path it can parse freely and assemble the structured
 * `PendingJvmCrash`. Decodes the JSON `PendingJvmCrashPayload` defined by `CrashFileFormat`.
 */
class CrashFileReader(private val directory: File) {
  /**
   * Parses every pending-crash file in the directory. Corrupt or partially
   * written files are skipped (a `.tmp` that never got renamed is invisible by
   * construction, and is later reclaimed by `deleteOrphanedTempFiles`).
   */
  fun listPendingCrashes(): List<PendingJvmCrash> = finalCrashFiles().mapNotNull { parse(it) }

  /**
   * Deletes `.tmp` files orphaned by a process that died mid-write.
   *
   * A completed write atomically renames its temp to a `.json`, so any `.tmp` still on disk is dead
   * weight the reader will never parse. Skips temp files for `currentPid`, which may belong to an
   * in-flight crash write happening right now — deleting it would drop a live crash report.
   */
  fun deleteOrphanedTempFiles(currentPid: Int = android.os.Process.myPid()) {
    val files = directory.listFiles() ?: return
    for (file in files) {
      val match = CrashFileFormat.TEMP_FILE_PATTERN.matchEntire(file.name) ?: continue
      if (match.groupValues[1].toIntOrNull() != currentPid) {
        file.delete()
      }
    }
  }

  fun delete(pendingCrash: PendingJvmCrash) {
    pendingCrash.file.delete()
  }

  /**
   * Deletes corrupt final `.json` files — ones that fail to decode because a crash-path IO failure
   * truncated them before the atomic rename. The reader skips them forever otherwise, so the
   * processor reclaims them on the same run. Needs no current-pid guard like
   * `deleteOrphanedTempFiles`: a `.json` exists only after the rename, so a live crash file is
   * always complete and parses fine — only genuinely corrupt files, which hold no recoverable
   * report, are removed.
   */
  fun deleteMalformedFiles() {
    for (file in finalCrashFiles()) {
      if (parse(file) == null) {
        file.delete()
      }
    }
  }

  /** Final pending-crash files (`.json`); excludes `.tmp` and unrelated files by name. */
  private fun finalCrashFiles(): List<File> =
    directory.listFiles { file -> CrashFileFormat.FILE_NAME_PATTERN.matches(file.name) }?.toList() ?: emptyList()

  private fun parse(file: File): PendingJvmCrash? =
    runCatching {
      val payload = CrashFileFormat.json.decodeFromString<PendingJvmCrashPayload>(file.readText())
      PendingJvmCrash(
        sessionId = payload.sessionId,
        pid = payload.pid,
        crashedAtMillis = payload.crashedAtMillis,
        exceptionClass = payload.exceptionClass,
        composedMessage = payload.composedMessage,
        threadName = payload.threadName,
        stackFrames = payload.stackFrames,
        file = file
      )
    }.getOrNull()

  companion object {
    fun forContext(context: android.content.Context): CrashFileReader =
      CrashFileReader(CrashFileFormat.crashesDir(context))
  }
}

/**
 * A crash captured by `JvmCrashHandler` in a previous process, parsed back from
 * its pending file on the next launch.
 */
data class PendingJvmCrash(
  /** Session that crashed, or `null` when the crash predated the session identity. */
  val sessionId: String?,
  val pid: Int,
  val crashedAtMillis: Long,
  /** Fully-qualified throwable class name. */
  val exceptionClass: String,
  /** `Throwable.toString()` plus the `Caused by:` chain. */
  val composedMessage: String,
  val threadName: String?,
  /** Symbolic frames of the primary exception, crash site first. */
  val stackFrames: List<String>,
  val file: File
) {
  /**
   * Normalizes the parsed file into the cross-platform `CrashReport` shape.
   * Timestamps use the package's millisecond ISO format so they compare
   * lexicographically against session rows. (iOS emits whole-second ISO in the
   * same fields — both are valid ISO 8601 and consumers must parse, not
   * string-compare, across platforms.)
   */
  fun toCrashReport(ingestedAt: String, appVersion: String): CrashReport {
    val crashTimestamp = TimeUtils.millisToTimestamp(crashedAtMillis)
    return CrashReport(
      exceptionReason = composedMessage,
      callStackTree = CallStackTreeBuilder.fromSymbols(stackFrames),
      appVersion = appVersion,
      timestampBegin = crashTimestamp,
      timestampEnd = crashTimestamp,
      ingestedAt = ingestedAt
    )
  }
}
