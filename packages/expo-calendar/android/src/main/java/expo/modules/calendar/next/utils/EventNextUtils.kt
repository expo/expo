package expo.modules.calendar.next.utils

import android.content.ContentResolver
import android.content.ContentUris
import android.provider.CalendarContract
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import java.util.Calendar

fun createRecurrenceRule(opts: RecurrenceRuleRecord): String {
  val (endDate, frequency, interval, occurrence) = opts
  var rrule: String = when (frequency) {
    "daily" -> "FREQ=DAILY"
    "weekly" -> "FREQ=WEEKLY"
    "monthly" -> "FREQ=MONTHLY"
    "yearly" -> "FREQ=YEARLY"
    else -> ""
  }
  if (interval != null) {
    rrule += ";INTERVAL=$interval"
  }
  if (endDate != null) {
    rrule += ";UNTIL=$endDate"
  } else if (occurrence != null) {
    rrule += ";COUNT=$occurrence"
  }
  return rrule
}

fun dateToMilliseconds(stringValue: String?): Long? {
  if (stringValue == null) {
    return null
  }
  val parsedDate = sdf.parse(stringValue)
    ?: return null
  val cal = Calendar.getInstance().apply {
    time = parsedDate
  }
  return cal.timeInMillis
}

fun removeRemindersForEvent(contentResolver: ContentResolver, eventID: Int) {
  val projection = arrayOf(
    CalendarContract.Reminders._ID
  )
  val cursor = CalendarContract.Reminders.query(
    contentResolver,
    eventID.toLong(),
    projection
  )

  val idIndex = cursor.getColumnIndex(CalendarContract.Reminders._ID)

  while (cursor.moveToNext()) {
    val reminderUri = ContentUris.withAppendedId(
      CalendarContract.Reminders.CONTENT_URI,
      cursor.getLong(idIndex)
    )
    contentResolver.delete(reminderUri, null, null)
  }
}
