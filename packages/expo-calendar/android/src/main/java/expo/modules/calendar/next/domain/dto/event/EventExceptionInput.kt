package expo.modules.calendar.next.domain.dto.event

import android.content.ContentValues
import android.provider.CalendarContract

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
