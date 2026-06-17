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
   * Suffix for the temp file the writer fills in before atomically renaming it to its final
   * `crash-{pid}-{timestamp}.json` name. The write happens on the crash path inside a dying process,
   * so a write can be truncated or orphaned at any point; staging under `.tmp` and committing with a
   * rename makes the final file appear all-at-once or not at all. Because `FILE_NAME_PATTERN` only
   * matches the final `.json` name, the reader never picks up a `.tmp` file that is still being
   * written (or was left behind by a process that died mid-write), so it only ever parses complete
   * files. An orphan left by a mid-write death is swept on the next launch by
   * `CrashFileReader.deleteOrphanedTempFiles`.
   */
  const val TEMP_SUFFIX = ".tmp"

  /** Matches a finished pending-crash file (`crash-{pid}-{timestamp}.json`); skips `.tmp` by design. */
  val FILE_NAME_PATTERN = Regex("""crash-\d+-\d+\.json""")

  /** Matches an orphaned/in-progress temp file (`crash-{pid}-{timestamp}.json.tmp`); group 1 is the pid. */
  val TEMP_FILE_PATTERN = Regex("""crash-(\d+)-\d+\.json\.tmp""")

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
