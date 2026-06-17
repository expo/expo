package expo.modules.appmetrics.crashreporting

import android.app.ActivityManager
import android.app.Application
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.appmetrics.utils.TimeUtils
import kotlin.math.abs

data class ExitRecord(
  /** One of the `ApplicationExitInfo.REASON_*` constants. */
  val reason: Int,
  val status: Int,
  val description: String?,
  val timestampMillis: Long,
  val pid: Int
) {
  /**
   * Identity for in-pass dedup: marks a record consumed once it's matched to a
   * crash file, so the same death isn't also emitted as its own bare report.
   */
  val key: String
    get() = "$timestampMillis:$pid:$reason"

  /**
   * Only true crashes count: managed (`REASON_CRASH`), native
   * (`REASON_CRASH_NATIVE`), and signal kills (`REASON_SIGNALED`, e.g. a SIGSEGV
   * the OS records as a bare signal rather than a native crash). Every other
   * reason — ANRs, low-memory kills, user-requested stops, and the rest — is
   * explicitly disregarded, matching how Play Console separates crash rate from
   * ANR rate.
   */
  val isStandaloneCrash: Boolean
    get() = reason == ApplicationExitInfo.REASON_CRASH ||
      reason == ApplicationExitInfo.REASON_CRASH_NATIVE ||
      reason == ApplicationExitInfo.REASON_SIGNALED

  /**
   * Whether this record describes the same death as a pending JVM crash file:
   * the same pid within a narrow time window.
   */
  fun matches(file: PendingJvmCrash): Boolean =
    pid == file.pid && abs(timestampMillis - file.crashedAtMillis) <= PID_TIME_WINDOW_MS

  fun toCrashReport(ingestedAt: String, appVersion: String): CrashReport {
    val crashTimestamp = TimeUtils.millisToTimestamp(timestampMillis)
    return CrashReport(
      // `status` carries the killing signal for native and signal-based deaths;
      // for a managed (`REASON_CRASH`) death it's an exit code, not a signal.
      signal = if (reason == ApplicationExitInfo.REASON_CRASH_NATIVE ||
        reason == ApplicationExitInfo.REASON_SIGNALED
      ) {
        status
      } else {
        null
      },
      terminationReason = description,
      appVersion = appVersion,
      timestampBegin = crashTimestamp,
      timestampEnd = crashTimestamp,
      ingestedAt = ingestedAt
    )
  }

  companion object {
    private const val PID_TIME_WINDOW_MS = 1 * 60 * 1000L // 1 minute
  }
}

/**
 * Abstraction over `ActivityManager.getHistoricalProcessExitReasons` so
 * `CrashReportProcessor` can be unit-tested with canned records: production uses
 * `ExitInfoProviderImpl`, tests pass a lambda returning fixture `ExitRecord`s.
 */
fun interface ExitInfoProvider {
  fun getExitRecords(): List<ExitRecord>
}

/**
 * Decouples `CrashReportProcessor` from the API-30 framework type
 * so its logic runs and tests on every SDK level.
 */
class ExitInfoProviderImpl(private val context: Context) : ExitInfoProvider {
  override fun getExitRecords(): List<ExitRecord> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return emptyList()
    }
    return runCatching { queryExitRecords() }.getOrElse { emptyList() }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun queryExitRecords(): List<ExitRecord> {
    val activityManager = context.getSystemService(ActivityManager::class.java) ?: return emptyList()
    val processName = Application.getProcessName()
    return activityManager
      .getHistoricalProcessExitReasons(context.packageName, NO_PID_FILTER, NO_MAX)
      .filter { it.processName == processName }
      .map { info ->
        ExitRecord(
          reason = info.reason,
          status = info.status,
          description = info.description,
          timestampMillis = info.timestamp,
          pid = info.pid
        )
      }
  }

  companion object {
    private const val NO_PID_FILTER = 0
    private const val NO_MAX = 0
  }
}
