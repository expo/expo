package expo.modules.calendar.next.domain.dto.event

import android.content.ContentValues
import android.provider.CalendarContract
import kotlin.time.Duration

sealed interface EventExceptionInput {
  val instanceStartDate: Duration
  fun toContentValues(): ContentValues

  data class Cancellation(override val instanceStartDate: Duration) : EventExceptionInput {
    override fun toContentValues() = ContentValues().apply {
      put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, instanceStartDate.inWholeMilliseconds)
      put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)
    }
  }
}
