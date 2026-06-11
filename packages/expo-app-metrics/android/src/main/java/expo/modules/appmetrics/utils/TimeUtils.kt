package expo.modules.appmetrics.utils

import android.os.Process
import android.os.SystemClock
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object TimeUtils {
  fun getCurrentTimeInMillis(): Long = SystemClock.uptimeMillis()

  fun getProcessStartTimeInMillis(): Long = Process.getStartUptimeMillis()

  fun getProcessStartTimestamp(): String {
    val millisFromProcessStart = getCurrentTimeInMillis() - getProcessStartTimeInMillis()
    val processStartDate = Date(System.currentTimeMillis() - millisFromProcessStart)
    return dateToTimestamp(processStartDate)
  }

  // Cannot use Instant.now() as it's only available in API 26+
  fun getCurrentTimestampInISOFormat(): String = dateToTimestamp(Date())

  fun getTimestampInISOFormatFromPast(secondsFromNow: Long): String =
    dateToTimestamp(
      Date(System.currentTimeMillis() - secondsFromNow * 1000)
    )

  fun timestampToDateNS(timestamp: String): Long {
    val date = sdf().parse(timestamp)
    if (date != null) {
      return date.time * 1_000_000L
    }
    return 0L
  }

  private fun sdf(): SimpleDateFormat {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    return sdf
  }

  private fun dateToTimestamp(date: Date): String {
    return sdf().format(date)
  }

  /**
   * Formats `date` as `yyyy-MM-ddTHH:mm:ssZ` in UTC — whole-second precision, matching iOS's
   * `Date.ISO8601Format()` with the default `internetDateTime` options. Used by callers that
   * need the JS wire format to read identically on both platforms; the millisecond-precision
   * `dateToTimestamp` is reserved for internal telemetry timestamps where sub-second matters.
   */
  fun dateToIsoUtcSeconds(date: Date): String = secondsFormatter.get()!!.format(date)

  // `SimpleDateFormat` isn't thread-safe; we stash one per thread. `java.time.DateTimeFormatter`
  // would be cleaner but requires API 26+ without core-library desugaring (we avoid both, see
  // `sdf()` below for the matching choice).
  private val secondsFormatter = ThreadLocal.withInitial {
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
      timeZone = TimeZone.getTimeZone("UTC")
    }
  }
}
