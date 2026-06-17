package expo.modules.appmetrics.crashreporting

import android.content.Context
import expo.modules.appmetrics.AppMetricsPreferences
import expo.modules.appmetrics.utils.TimeUtils

/**
 * Where a crash report came from. Lets the attribution callback treat an id-less
 * JVM file (a crash before the session existed → orphan) differently from an
 * id-less native record (attributable to the previous session).
 */
enum class CrashOrigin {
  JVM_FILE,
  EXIT_RECORD
}

/**
 * Stores the timestamp of the newest OS exit record already turned into a crash
 * report, so each launch only processes records newer than it.
 */
interface LastProcessedExitStore {
  fun get(): Long

  fun set(timestampMillis: Long)
}

class PreferencesLastProcessedExitStore(private val context: Context) : LastProcessedExitStore {
  override fun get(): Long = AppMetricsPreferences.getLastProcessedExitTimestampMillis(context)

  override fun set(timestampMillis: Long) {
    AppMetricsPreferences.setLastProcessedExitTimestampMillis(context, timestampMillis)
  }
}

/**
 * Next-launch crash processing: turns the previous process's death evidence —
 * pending JVM crash files from `JvmCrashHandler` and OS exit records from
 * `ExitInfoProvider` — into `CrashReport`s, and hands each to `storeReport`.
 */
class CrashReportProcessor(
  private val crashFileReader: CrashFileReader,
  private val exitInfoProvider: ExitInfoProvider,
  private val lastProcessedExitStore: LastProcessedExitStore,
  private val appVersion: String?,
  private val storeReport: suspend (sessionId: String?, origin: CrashOrigin, report: CrashReport) -> Unit
) {
  suspend fun process() {
    crashFileReader.deleteOrphanedTempFiles()

    val allRecords = exitInfoProvider.getExitRecords()
    val cursor = lastProcessedExitStore.get()
    val newRecords = allRecords.filter { it.timestampMillis > cursor }
    val pendingFiles = crashFileReader.listPendingCrashes()

    if (newRecords.isNotEmpty() || pendingFiles.isNotEmpty()) {
      processCrashes(newRecords, pendingFiles)
    }

    // `processCrashes` deleted the files it parsed; sweep any corrupt final files left behind so they
    // don't sit unreadable on disk forever.
    crashFileReader.deleteMalformedFiles()

    // Advance the cursor past every record we saw; the next launch only processes
    // records newer than this.
    // Durability gap: if the process dies between a `delete(file)` above and this
    // `set`, the cursor never advances, so the next launch reprocesses that
    // record — but its JVM file is gone, so the death resurfaces once as a bare
    // EXIT_RECORD orphan. Narrow (needs a second crash on the launch path) and
    // bounded to a single duplicate, so we accept it rather than add a journal.
    val newCursor = allRecords.maxOfOrNull { it.timestampMillis } ?: cursor
    lastProcessedExitStore.set(maxOf(newCursor, cursor))
  }

  private suspend fun processCrashes(
    newRecords: List<ExitRecord>,
    pendingFiles: List<PendingJvmCrash>
  ) {
    val resolvedAppVersion = appVersion ?: "unknown"
    val ingestedAt = TimeUtils.getCurrentTimestampInISOFormat()
    val consumedRecordKeys = mutableSetOf<String>()

    // Files first: when a crash is both a file and a record, the file wins (it
    // has the stack) and its matching record is consumed below.
    for (file in pendingFiles) {
      val matchingRecord = newRecords.firstOrNull { record ->
        record.key !in consumedRecordKeys && record.matches(file)
      }
      // Consume the matching record so it isn't also delivered as its own bare report.
      matchingRecord?.let { consumedRecordKeys += it.key }

      storeReport(
        file.sessionId,
        CrashOrigin.JVM_FILE,
        file.toCrashReport(ingestedAt, resolvedAppVersion)
      )
      crashFileReader.delete(file)
    }

    // No record-vs-record dedup: the OS emits one `ApplicationExitInfo` per
    // process death, so two crash-class records (e.g. CRASH_NATIVE and SIGNALED)
    // never describe the same death. `consumedRecordKeys` only suppresses a
    // record already covered by a richer JVM file above.
    for (record in newRecords) {
      if (record.key in consumedRecordKeys || !record.isStandaloneCrash) {
        continue
      }
      storeReport(
        null,
        CrashOrigin.EXIT_RECORD,
        record.toCrashReport(ingestedAt, resolvedAppVersion)
      )
    }
  }
}
