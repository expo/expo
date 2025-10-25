package expo.modules.calendar.domain.event.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class Availability(val value: String) : Enumerable {
  FREE("free"),
  TENTATIVE("tentative"),
  BUSY("busy");

  val contentProviderValue: Int get() =
    when (this) {
      FREE -> CalendarContract.Events.AVAILABILITY_FREE
      TENTATIVE -> CalendarContract.Events.AVAILABILITY_TENTATIVE
      else -> CalendarContract.Events.AVAILABILITY_BUSY
    }

  companion object {
    fun fromContentProviderValue(constant: Int): Availability =
      when (constant) {
        CalendarContract.Events.AVAILABILITY_FREE -> FREE
        CalendarContract.Events.AVAILABILITY_TENTATIVE -> TENTATIVE
        CalendarContract.Events.AVAILABILITY_BUSY -> BUSY
        else -> BUSY
      }
  }
}
