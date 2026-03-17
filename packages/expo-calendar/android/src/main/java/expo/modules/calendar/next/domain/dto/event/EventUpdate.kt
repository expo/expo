package expo.modules.calendar.next.domain.dto.event

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.kotlin.types.ValueOrUndefined

class EventUpdate(
  val title: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val description: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val dtStart: ValueOrUndefined<Long?> = ValueOrUndefined.Undefined(),
  val dtEnd: ValueOrUndefined<Long?> = ValueOrUndefined.Undefined(),
  val availability: ValueOrUndefined<Availability?> = ValueOrUndefined.Undefined(),
  val allDay: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val eventLocation: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val organizer: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val guestsCanModify: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val guestsCanInviteOthers: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val guestsCanSeeGuests: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  val eventTimezone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val eventEndTimezone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  val accessLevel: ValueOrUndefined<AccessLevel?> = ValueOrUndefined.Undefined(),
  val rrule: ValueOrUndefined<RecurrenceRule?> = ValueOrUndefined.Undefined()
) {
}
