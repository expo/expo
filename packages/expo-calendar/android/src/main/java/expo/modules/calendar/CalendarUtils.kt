package expo.modules.calendar

import android.Manifest
import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.content.Intent
import android.database.Cursor
import android.os.Bundle
import android.provider.CalendarContract
import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.calendar.EventRecurrenceUtils.createRecurrenceRule
import expo.modules.calendar.EventRecurrenceUtils.extractRecurrence
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*

object CalendarUtils {

  val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
    timeZone = TimeZone.getTimeZone("GMT")
  }

  @JvmStatic
  fun optStringFromCursor(cursor: Cursor, columnName: String): String? {
    val index = cursor.getColumnIndex(columnName)
    return if (index == -1) {
      null
    } else {
      cursor.getString(index)
    }
  }

  @JvmStatic
  fun stringFromCursor(cursor: Cursor, columnName: String): String {
    val index = cursor.getColumnIndex(columnName)
    if (index == -1) {
      throw Exception("String not found")
    } else {
      return cursor.getString(index)
    }
  }

  @JvmStatic
  fun optIntFromCursor(cursor: Cursor, columnName: String): Int {
    val index = cursor.getColumnIndex(columnName)
    return if (index == -1) {
      0
    } else {
      cursor.getInt(index)
    }
  }

  @JvmStatic
  fun findEvents(contentResolver: ContentResolver, startDate: Any, endDate: Any, calendars: List<String>): Cursor {
    val eStartDate = Calendar.getInstance()
    val eEndDate = Calendar.getInstance()
    try {
      setDateInCalendar(eStartDate, startDate)
      setDateInCalendar(eEndDate, endDate)
    } catch (e: ParseException) {
      Log.e(TAG, "error parsing", e)
    } catch (e: Exception) {
      Log.e(TAG, "misc error parsing", e)
    }
    val uriBuilder = CalendarContract.Instances.CONTENT_URI.buildUpon()
    ContentUris.appendId(uriBuilder, eStartDate.timeInMillis)
    ContentUris.appendId(uriBuilder, eEndDate.timeInMillis)
    val uri = uriBuilder.build()
    var selection =
      "((${CalendarContract.Instances.BEGIN} >= ${eStartDate.timeInMillis}) " +
        "AND (${CalendarContract.Instances.END} <= ${eEndDate.timeInMillis}) " +
        "AND (${CalendarContract.Instances.VISIBLE} = 1) "
    if (calendars.isNotEmpty()) {
      var calendarQuery = "AND ("
      for (i in calendars.indices) {
        calendarQuery += CalendarContract.Instances.CALENDAR_ID + " = '" + calendars[i] + "'"
        if (i != calendars.size - 1) {
          calendarQuery += " OR "
        }
      }
      calendarQuery += ")"
      selection += calendarQuery
    }
    selection += ")"
    val sortOrder = "${CalendarContract.Instances.BEGIN} ASC"
    val cursor = contentResolver.query(
      uri,
      findEventsQueryParameters,
      selection,
      null,
      sortOrder
    )

    requireNotNull(cursor) { "Cursor shouldn't be null" }
    return cursor
  }

  private fun setDateInCalendar(calendar: Calendar, date: Any) {
    when (date) {
      is String -> {
        val parsedDate = sdf.parse(date)
        if (parsedDate != null) {
          calendar.time = parsedDate
        } else {
          Log.e(TAG, "Parsed date is null")
        }
      }

      is Number -> {
        calendar.timeInMillis = date.toLong()
      }

      else -> {
        Log.e(TAG, "date has unsupported type")
      }
    }
  }

  @Throws(SecurityException::class)
  internal fun removeRemindersForEvent(contentResolver: ContentResolver, eventID: Int) {
    val cursor = CalendarContract.Reminders.query(
      contentResolver,
      eventID.toLong(),
      arrayOf(
        CalendarContract.Reminders._ID
      )
    )
    while (cursor.moveToNext()) {
      val reminderUri = ContentUris.withAppendedId(CalendarContract.Reminders.CONTENT_URI, cursor.getLong(0))
      contentResolver.delete(reminderUri, null, null)
    }
  }
}
