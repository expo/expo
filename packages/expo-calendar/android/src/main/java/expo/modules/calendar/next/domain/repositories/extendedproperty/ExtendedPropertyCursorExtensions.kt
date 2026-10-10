package expo.modules.calendar.next.domain.repositories.extendedproperty

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyEntity
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.repositories.getOptionalString
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ExtendedPropertyId

fun Cursor.toExtendedPropertyEntity(eventId: EventId) = ExtendedPropertyEntity(
  id = ExtendedPropertyId(
    getOptionalLong(CalendarContract.ExtendedProperties._ID)
      ?: throw IllegalStateException("extended property ID must not be null")
  ),
  eventId = eventId,
  name = getOptionalString(CalendarContract.ExtendedProperties.NAME),
  value = getOptionalString(CalendarContract.ExtendedProperties.VALUE)
)
