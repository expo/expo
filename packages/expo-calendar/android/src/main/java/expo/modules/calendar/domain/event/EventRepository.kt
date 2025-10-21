package expo.modules.calendar.domain.event

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.provider.CalendarContract
import expo.modules.calendar.domain.event.extensions.extractEvent
import expo.modules.calendar.domain.event.records.Alarm
import expo.modules.calendar.domain.event.records.EventEntity
import expo.modules.calendar.domain.event.records.input.EventUpdateInput
import expo.modules.calendar.domain.event.records.input.NewEventInput
import expo.modules.calendar.exceptions.EventNotSavedException
import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.extensions.getTimeInMillis
import expo.modules.calendar.domain.event.records.input.RemoveEventInput
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference
import java.text.ParseException

class EventRepository(context: Context) {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef.get()?.contentResolver ?: throw Exceptions.ReactContextLost()

  @OptIn(EitherType::class)
  suspend fun findEvents(startDate: DateTimeInput, endDate: DateTimeInput, calendars: List<String>): List<EventEntity> =
    withContext(Dispatchers.IO) {
      val eStartDate = requireNotNull(startDate.getTimeInMillis())
      val eEndDate = requireNotNull(endDate.getTimeInMillis())

      val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().let { builder ->
        ContentUris.appendId(builder, eStartDate)
        ContentUris.appendId(builder, eEndDate)
        builder.build()
      }
      val selection = buildSelectionForEventsQuery(eStartDate, eEndDate, calendars)
      val sortOrder = "${CalendarContract.Instances.BEGIN} ASC"

      val cursor = contentResolver.query(
        uri,
        findEventsQueryParameters,
        selection,
        null,
        sortOrder
      )

      requireNotNull(cursor) { "Cursor shouldn't be null" }
      return@withContext cursor.use { cursor ->
        val results = mutableListOf<EventEntity>()
        while (cursor.moveToNext()) {
          results.add(cursor.extractEvent(contentResolver))
        }
        results
      }
    }

  suspend fun findEventById(eventID: String): EventEntity? = withContext(Dispatchers.IO) {
    val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toInt().toLong())
    val selection = "((${CalendarContract.Events.DELETED} != 1))"
    val cursor = contentResolver.query(
      uri,
      findEventByIdQueryParameters,
      selection,
      null,
      null
    )
    requireNotNull(cursor) { "Cursor shouldn't be null" }
    return@withContext cursor.use { cursor ->
      cursor.takeIf { it.moveToFirst() }?.extractEvent(contentResolver)
    }
  }

  suspend fun createEvent(eventInput: NewEventInput): Int = withContext(Dispatchers.IO) {
    val payload = eventInput.toContentValues().apply {
      put(CalendarContract.Events.CALENDAR_ID, eventInput.calendarId.toInt())
    }

    val eventsUri = CalendarContract.Events.CONTENT_URI
    val eventUri = contentResolver.insert(eventsUri, payload)
      ?: throw EventNotSavedException()
    val eventID = eventUri.lastPathSegment!!.toInt()

    eventInput.alarms?.let { reminders ->
      createRemindersForEvent(eventID, reminders)
    }

    return@withContext eventID
  }

  suspend fun updateEvent(updateInput: EventUpdateInput): Int = withContext(Dispatchers.IO) {
    val eventID = updateInput.id.toInt()
    val updateUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())

    contentResolver.update(updateUri, updateInput.toContentValues(), null, null)
    removeRemindersForEvent(eventID)

    updateInput.alarms?.let { reminders ->
      createRemindersForEvent(eventID, reminders)
    }

    return@withContext eventID
  }

  @Throws(ParseException::class, SecurityException::class)
  suspend fun removeEvent(details: RemoveEventInput): Boolean = withContext(Dispatchers.IO) {
    val rows: Int
    val eventID = details.id
    val instanceStartDate = details.instanceStartDate?.getTimeInMillis()
    if (instanceStartDate == null) {
      val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      rows = contentResolver.delete(uri, null, null)
      return@withContext rows > 0
    } else {
      val exceptionValues = ContentValues().apply {
        put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, instanceStartDate)
        put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)
      }
      val exceptionUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, eventID.toLong())
      contentResolver.insert(exceptionUri, exceptionValues)
    }
    return@withContext true
  }

  private suspend fun createRemindersForEvent(eventID: Int, reminders: List<Alarm>) = withContext(Dispatchers.IO) {
    for (reminder in reminders) {
      ensureActive()
      if (reminder.relativeOffset == null) {
        continue
      }

      val minutes = -reminder.relativeOffset
      val method = reminder.method?.contentProviderValue ?: CalendarContract.Reminders.METHOD_DEFAULT

      val reminderValues = ContentValues().apply {
        put(CalendarContract.Reminders.EVENT_ID, eventID)
        put(CalendarContract.Reminders.MINUTES, minutes)
        put(CalendarContract.Reminders.METHOD, method)
      }
      contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues)
    }
  }

  private suspend fun removeRemindersForEvent(eventID: Int) = withContext(Dispatchers.IO) {
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

  companion object {
    private val findEventsQueryParameters = arrayOf(
      CalendarContract.Instances.EVENT_ID,
      CalendarContract.Instances.TITLE,
      CalendarContract.Instances.DESCRIPTION,
      CalendarContract.Instances.BEGIN,
      CalendarContract.Instances.END,
      CalendarContract.Instances.ALL_DAY,
      CalendarContract.Instances.EVENT_LOCATION,
      CalendarContract.Instances.RRULE,
      CalendarContract.Instances.CALENDAR_ID,
      CalendarContract.Instances.AVAILABILITY,
      CalendarContract.Instances.ORGANIZER,
      CalendarContract.Instances.EVENT_TIMEZONE,
      CalendarContract.Instances.EVENT_END_TIMEZONE,
      CalendarContract.Instances.ACCESS_LEVEL,
      CalendarContract.Instances.GUESTS_CAN_MODIFY,
      CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS,
      CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS,
      CalendarContract.Instances.ORIGINAL_ID,
      CalendarContract.Instances._ID
    )

    private val findEventByIdQueryParameters = arrayOf(
      CalendarContract.Events._ID,
      CalendarContract.Events.TITLE,
      CalendarContract.Events.DESCRIPTION,
      CalendarContract.Events.DTSTART,
      CalendarContract.Events.DTEND,
      CalendarContract.Events.ALL_DAY,
      CalendarContract.Events.EVENT_LOCATION,
      CalendarContract.Events.RRULE,
      CalendarContract.Events.CALENDAR_ID,
      CalendarContract.Events.AVAILABILITY,
      CalendarContract.Events.ORGANIZER,
      CalendarContract.Events.EVENT_TIMEZONE,
      CalendarContract.Events.EVENT_END_TIMEZONE,
      CalendarContract.Events.ACCESS_LEVEL,
      CalendarContract.Events.GUESTS_CAN_MODIFY,
      CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS,
      CalendarContract.Events.GUESTS_CAN_SEE_GUESTS,
      CalendarContract.Events.ORIGINAL_ID
    )
  }
}

private fun buildSelectionForEventsQuery(startDateMillis: Long, endDateMillis: Long, calendars: List<String>): String {
  val selectionConditions = mutableListOf(
    "${CalendarContract.Instances.BEGIN} >= $startDateMillis",
    "${CalendarContract.Instances.END} <= $endDateMillis",
    "${CalendarContract.Instances.VISIBLE} = 1"
  )

  if (calendars.isNotEmpty()) {
    val calendarQuery = calendars.joinToString(" OR ") { calendar ->
      "${CalendarContract.Instances.CALENDAR_ID} = '$calendar'"
    }
    selectionConditions += calendarQuery
  }

  return selectionConditions
    .joinToString(" AND ") { condition -> "($condition)" }
    .let { expr -> "($expr)" }
}
