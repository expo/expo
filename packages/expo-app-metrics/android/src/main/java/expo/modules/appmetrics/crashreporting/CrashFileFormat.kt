package expo.modules.appmetrics.crashreporting

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * The on-disk contract for pending-crash files, shared by `CrashFileWriter` and
 * `CrashFileReader`. Each file is a JSON-encoded `PendingJvmCrashPayload`; keeping
 * the format and its `Json` instance in one place means the writer and reader
 * can't drift apart.
 */
internal object CrashFileFormat {
  /** Encodes/decodes the pending-crash payload. Lenient so an older file still parses. */
  val json = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
  }

  /**
   * Matches a finished pending-crash file (`crash-{pid}-{timestamp}.json`). The writer commits
   * through `AtomicFile`, so the final `.json` only appears after the atomic rename — an interrupted
   * write never matches this, and the reader only ever parses complete files.
   */
  val FILE_NAME_PATTERN = Regex("""crash-\d+-\d+\.json""")

  /**
   * Matches any non-final sibling of a crash file: a `crash-{pid}-{timestamp}.json` base name with
   * an extra extension. `AtomicFile` stages and backs up under suffixes like `.new`/`.bak`, but
   * rather than enumerate them, anything carrying a crash base name that isn't the final `.json` is
   * a temp the reader can sweep. Group 1 is the pid, so the current process's in-flight temp is
   * spared.
   */
  val TEMP_FILE_PATTERN = Regex("""crash-(\d+)-\d+\.json\..+""")

  /**
   * The canonical pending-crash directory — `noBackupFilesDir` so stale crash
   * files never ride along in device-to-device restores. Shared by `CrashFileWriter`
   * and `CrashFileReader` so the two always agree on where crashes live.
   */
  fun crashesDir(context: android.content.Context): java.io.File =
    java.io.File(context.noBackupFilesDir, "expo-app-metrics/crashes")
}

/**
 * The JSON shape persisted for a pending JVM crash. Written on the crash path by
 * `CrashFileWriter` and read back on the next launch by `CrashFileReader`.
 */
@Serializable
data class PendingJvmCrashPayload(
  /** Session that crashed, or `null` when the crash predated the session identity. */
  val sessionId: String? = null,
  val pid: Int,
  val crashedAtMillis: Long,
  /** Fully-qualified throwable class name. */
  val exceptionClass: String,
  /** `Throwable.toString()` plus the `Caused by:` chain. */
  val composedMessage: String,
  val threadName: String? = null,
  /** Symbolic frames of the primary exception, crash site first. */
  val stackFrames: List<String>
)
