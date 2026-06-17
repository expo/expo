package expo.modules.appmetrics.jserrors

import android.content.Context
import android.util.Log
import java.io.File
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Durable store for fatal JavaScript errors.
 *
 * A fatal error terminates the process moments after the `global.ErrorUtils` handler returns, so the
 * normal async (coroutine + Room) log path can race the shutdown and lose the record. Instead, the
 * fatal path writes the error to a small JSON file **synchronously** on the calling thread (no
 * coroutine, no database) before React Native tears the app down. On the next launch the pending
 * files are drained into the regular log pipeline as `exception` events.
 */
object PendingErrorStore {
  private const val TAG = "AppMetrics"

  /** Caps how many pending files are kept/ingested, so a crash-on-launch loop can't pile up files. */
  private const val MAX_PENDING_ERRORS = 5

  /**
   * The single error captured at fatal time. Carries the owning session id and timestamp resolved at
   * write time, since by drain time (next launch) the main session has rotated.
   */
  @Serializable
  data class PendingError(
    val source: String,
    val type: String? = null,
    val message: String,
    val stacktrace: String? = null,
    val sessionId: String,
    val timestamp: String
  )

  /**
   * Writes a fatal error to disk synchronously. Best-effort: any failure is swallowed (we're on the
   * way to a crash and must not throw out of the error handler).
   */
  fun write(context: Context, error: PendingError) {
    runCatching {
      val directory = directory(context)
      val fileName = "${error.timestamp}-${UUID.randomUUID()}.json"
      val target = File(directory, fileName)
      // Write to a temp file then rename, so an interrupted process never leaves a half-written file.
      val temp = File(directory, "$fileName.tmp")
      temp.writeText(Json.encodeToString(error))
      temp.renameTo(target)
    }
  }

  /**
   * Reads all pending errors oldest-first and removes their files. Returns the decoded errors so the
   * caller can ingest them. Corrupt files are deleted and skipped.
   */
  fun drain(context: Context): List<PendingError> {
    val directory = directory(context)
    val allFiles = directory.listFiles() ?: return emptyList()

    // Delete leftover temp files from a `write` whose rename didn't complete, so they can't pile up.
    allFiles.filter { it.extension == "tmp" }.forEach { it.delete() }

    // File names are prefixed with an ISO-8601 timestamp, so lexicographic order is chronological.
    val files = allFiles.filter { it.extension == "json" }.sortedBy { it.name }

    val overflow = (files.size - MAX_PENDING_ERRORS).coerceAtLeast(0)
    if (overflow > 0) {
      Log.w(TAG, "Dropping $overflow pending error file(s) past the $MAX_PENDING_ERRORS cap.")
    }

    val errors = mutableListOf<PendingError>()
    files.forEachIndexed { index, file ->
      if (index >= overflow) {
        runCatching { Json.decodeFromString<PendingError>(file.readText()) }
          .getOrNull()
          ?.let { errors.add(it) }
      }
      // Delete every file we touch (overflow and corrupt included) so the directory can't grow.
      file.delete()
    }
    return errors
  }

  /** The directory holding pending-error files, under `noBackupFilesDir` so they're not backed up. */
  private fun directory(context: Context): File =
    File(context.noBackupFilesDir, "ExpoAppMetrics/pending-errors").apply { mkdirs() }
}
