package expo.modules.appmetrics.utils

import android.os.Process
import android.os.SystemClock
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object TimeUtils {
  fun getCurrentTimeInMillis(): Long = SystemClock.uptimeMillis()

  /**
   * Wall-clock time in milliseconds since the Unix epoch. Use this when comparing against
   * another wall-clock timestamp — HTTP `Retry-After` deadlines, server-supplied dates, file
   * modification times. For measuring elapsed intervals within the process, prefer
   * [getCurrentTimeInMillis], which is monotonic and immune to wall-clock adjustments.
   */
  fun getWallClockMillis(): Long = System.currentTimeMillis()

  /**
   * Wall-clock delta in milliseconds from `from` to `to` (positive if `to` is in the future
   * relative to `from`, negative if it's in the past). Defaults `from` to now. Used by
   * `expo-observe`'s `Retry-After` parser to compute how long the server wants us to wait.
   * Centralized here so tests can stub the time read via `mockkObject(TimeUtils)`.
   */
  fun millisUntil(to: Date, from: Date = Date()): Long = to.time - from.time

  fun getProcessStartTimeInMillis(): Long = Process.getStartUptimeMillis()

  fun getProcessStartTimestamp(): String {
    val millisFromProcessStart = getCurrentTimeInMillis() - getProcessStartTimeInMillis()
    val processStartDate = Date(System.currentTimeMillis() - millisFromProcessStart)
    return dateToTimestamp(processStartDate)
  }

  // Cannot use Instant.now() as it's only available in API 26+
  fun getCurrentTimestampInISOFormat(): String = dateToTimestamp(Date())

  fun millisToTimestamp(millis: Long): String = dateToTimestamp(Date(millis))

  fun getTimestampInISOFormatFromPast(secondsFromNow: Long): String =
    dateToTimestamp(
      Date(System.currentTimeMillis() - secondsFromNow * 1000)
    )

  fun timestampToDateNS(timestamp: String): Long {
    val date = millisFormatter.get()!!.parse(timestamp)
    if (date != null) {
      return date.time * 1_000_000L
    }
    return 0L
  }

  private fun dateToTimestamp(date: Date): String {
    return millisFormatter.get()!!.format(date)
  }

  /**
   * Formats `date` as `yyyy-MM-ddTHH:mm:ssZ` in UTC — whole-second precision, matching iOS's
   * `Date.ISO8601Format()` with the default `internetDateTime` options. Used by callers that
   * need the JS wire format to read identically on both platforms; the millisecond-precision
   * `dateToTimestamp` is reserved for internal telemetry timestamps where sub-second matters.
   */
  fun dateToIsoUtcSeconds(date: Date): String = secondsFormatter.get()!!.format(date)

  // `SimpleDateFormat` isn't thread-safe, so we stash one per thread instead of sharing one
  // instance. `java.time.DateTimeFormatter` and `ThreadLocal.withInitial` both need API 26+; we
  // support API 24, so we use the `initialValue()` override, which has been available since API 1:
  //   API 24 (no `withInitial`): https://android.googlesource.com/platform/libcore/+/refs/tags/android-7.0.0_r1/ojluni/src/main/java/java/lang/ThreadLocal.java
  //   API 26 (has `withInitial`): https://android.googlesource.com/platform/libcore/+/refs/tags/android-8.0.0_r1/ojluni/src/main/java/java/lang/ThreadLocal.java#140
  private fun utcFormatter(pattern: String) = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue() = SimpleDateFormat(pattern, Locale.US).apply {
      timeZone = TimeZone.getTimeZone("UTC")
    }
  }

  private val millisFormatter = utcFormatter("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
  private val secondsFormatter = utcFormatter("yyyy-MM-dd'T'HH:mm:ss'Z'")
}
