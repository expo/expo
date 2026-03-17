package expo.modules.calendar.next.domain.dto.event

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.wrappers.EventId

// This class represents an exception for a recurring event.
// It can be used to cancel a single instance of a recurring event or to modify it in the future (not implemented).
sealed interface EventExceptionInput {
  val instanceStartDate: Long // in milliseconds
  fun toContentValues(): ContentValues

  data class Cancellation(override val instanceStartDate: Long) : EventExceptionInput {
    override fun toContentValues(): ContentValues {
      return ContentValues().apply {
        put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, instanceStartDate)
        put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)
      }
    }
  }
}
