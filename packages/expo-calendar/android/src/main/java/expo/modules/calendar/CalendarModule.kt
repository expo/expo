package expo.modules.calendar

import android.Manifest
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.os.Bundle
import android.provider.CalendarContract
import android.text.TextUtils
import android.util.Log
import expo.modules.interfaces.permissions.Permissions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.arguments.ReadableArguments
import org.unimodules.core.errors.InvalidArgumentException
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.RegistryLifecycleListener
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.collections.ArrayList

class CalendarModule(private val mContext: Context) : ExportedModule(mContext), RegistryLifecycleListener {
  private var mPermissionsManager: Permissions? = null
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)
  private val contentResolver
    get() = mContext.contentResolver

  override fun getName(): String {
    return "ExpoCalendar"
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissionsManager = moduleRegistry.getModule(Permissions::class.java)
  }

  override fun onDestroy() {
    try {
      moduleCoroutineScope.cancel(ModuleDestroyedException())
    } catch (e: IllegalStateException) {
      Log.e(TAG, "The scope does not have a job in it")
    }
  }

  private val sdf: SimpleDateFormat

  init {
    val dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    sdf = SimpleDateFormat(dateFormat)
    sdf.timeZone = TimeZone.getTimeZone("GMT")
  }

  //region Exported methods
  @ExpoMethod
  fun getCalendarsAsync(type: String?, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    if (type != null && type == "reminder") {
      promise.reject("E_CALENDARS_NOT_FOUND", "Calendars of type `reminder` are not supported on Android")
      return
    }
    try {
      moduleCoroutineScope.launch {
        val calendars = findCalendars()
        promise.resolve(calendars)
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    } catch (e: Exception) {
      promise.reject("E_CALENDARS_NOT_FOUND", "Calendars could not be found", e)
    }
  }

  @ExpoMethod
  fun saveCalendarAsync(details: ReadableArguments, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        try {
          val calendarID = saveCalendar(details)
          promise.resolve(calendarID.toString())
        } catch (e: ModuleDestroyedException) {
          promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
        } catch (e: Exception) {
          promise.reject("E_CALENDAR_NOT_SAVED", "Calendar could not be saved: " + e.message, e)
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun deleteCalendarAsync(calendarID: String, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try{
      moduleCoroutineScope.launch {
        val successful = deleteCalendar(calendarID)
        if (successful) {
          promise.resolve(null)
        } else {
          promise.reject("E_CALENDAR_NOT_DELETED", "Calendar with id $calendarID could not be deleted")
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun getEventsAsync(startDate: Any, endDate: Any, calendars: List<String>, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        val results = findEvents(startDate, endDate, calendars)
        promise.resolve(results)
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    } catch (e: Exception) {
      promise.reject("E_EVENTS_NOT_FOUND", "Events could not be found", e)
    }
  }

  @ExpoMethod
  fun getEventByIdAsync(eventID: String, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        val results = findEventById(eventID)
        if (results != null) {
          promise.resolve(results)
        } else {
          promise.reject("E_EVENT_NOT_FOUND", "Event with id $eventID could not be found")
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun saveEventAsync(details: ReadableArguments, options: ReadableArguments?, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        try {
          val eventID = saveEvent(details)
          promise.resolve(eventID.toString())
        } catch (e: ParseException) {
          promise.reject("E_EVENT_NOT_SAVED", "Event could not be saved", e)
        } catch (e: EventNotSavedException) {
          promise.reject("E_EVENT_NOT_SAVED", "Event could not be saved", e)
        } catch (e: InvalidArgumentException) {
          promise.reject("E_EVENT_NOT_SAVED", "Event could not be saved", e)
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun deleteEventAsync(details: ReadableArguments, options: ReadableArguments?, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        try {
          val successful = removeEvent(details)
          if (successful) {
            promise.resolve(null)
          } else {
            promise.reject("E_EVENT_NOT_DELETED", "Event with id ${details.getString("id")} could not be deleted")
          }
        } catch (e: Exception) {
          promise.reject("E_EVENT_NOT_DELETED", "Event with id ${details.getString("id")} could not be deleted", e)
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun getAttendeesForEventAsync(eventID: String, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        val results = findAttendeesByEventId(eventID)
        promise.resolve(results)
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  // TODO: needs refactor
  @ExpoMethod
  fun saveAttendeeForEventAsync(details: ReadableArguments, eventID: String?, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        try {
          val attendeeID = saveAttendeeForEvent(details, eventID)
          promise.resolve(attendeeID.toString())
        } catch (e: Exception) {
          promise.reject("E_ATTENDEE_NOT_SAVED", "Attendees for event with id $eventID could not be saved", e)
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun deleteAttendeeAsync(attendeeID: String, promise: Promise) {
    if (!checkPermissions(promise)) {
      return
    }
    try {
      moduleCoroutineScope.launch {
        val successful = deleteAttendee(attendeeID)
        if (successful) {
          promise.resolve(null)
        } else {
          promise.reject("E_ATTENDEE_NOT_DELETED", "Attendee with id $attendeeID could not be deleted")
        }
      }
    } catch (e: ModuleDestroyedException) {
      promise.reject("E_MODULE_DESTROYED", "Module has been destroyed")
    }
  }

  @ExpoMethod
  fun openEventInCalendar(eventID: Int, promise: Promise) {
    val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
    val sendIntent = Intent(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).setData(uri)
    if (sendIntent.resolveActivity(mContext.packageManager) != null) {
      mContext.startActivity(sendIntent)
    }
    promise.resolve(null)
  }

  @ExpoMethod
  fun requestCalendarPermissionsAsync(promise: Promise?) {
    Permissions.askForPermissionsWithPermissionsManager(mPermissionsManager, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
  }

  @ExpoMethod
  fun getCalendarPermissionsAsync(promise: Promise?) {
    Permissions.getPermissionsWithPermissionsManager(mPermissionsManager, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
  }

  //endregion
  @Throws(SecurityException::class)
  private fun findCalendars(): List<Bundle> {
    val cursor: Cursor
    val uri = CalendarContract.Calendars.CONTENT_URI
    cursor = contentResolver.query(uri, arrayOf(
      CalendarContract.Calendars._ID,
      CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
      CalendarContract.Calendars.ACCOUNT_NAME,
      CalendarContract.Calendars.IS_PRIMARY,
      CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      CalendarContract.Calendars.NAME,
      CalendarContract.Calendars.ACCOUNT_TYPE,
      CalendarContract.Calendars.CALENDAR_COLOR,
      CalendarContract.Calendars.OWNER_ACCOUNT,
      CalendarContract.Calendars.CALENDAR_TIME_ZONE,
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      CalendarContract.Calendars.VISIBLE,
      CalendarContract.Calendars.SYNC_EVENTS
    ), null, null, null)!!
    return serializeEventCalendars(cursor)
  }

  private fun findEvents(startDate: Any, endDate: Any, calendars: List<String>): List<Bundle> {
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
    val cursor: Cursor
    val uriBuilder = CalendarContract.Instances.CONTENT_URI.buildUpon()
    ContentUris.appendId(uriBuilder, eStartDate.timeInMillis)
    ContentUris.appendId(uriBuilder, eEndDate.timeInMillis)
    val uri = uriBuilder.build()
    var selection: String? =
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
    cursor = contentResolver.query(uri, arrayOf(
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
    ), selection, null, null)!!
    return serializeEvents(cursor)
  }

  private fun findEventById(eventID: String): Bundle? {
    val result: Bundle?
    val cursor: Cursor
    val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toInt().toLong())
    val selection = "((${CalendarContract.Events.DELETED} != 1))"
    cursor = contentResolver.query(uri, arrayOf(
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
    ), selection, null, null)!!
    result = if (cursor.count > 0) {
      cursor.moveToFirst()
      serializeEvent(cursor)
    } else {
      null
    }
    cursor.close()
    return result
  }

  private fun findCalendarById(calendarID: String): Bundle? {
    val result: Bundle?
    val cursor: Cursor
    val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toInt().toLong())
    cursor = contentResolver.query(uri, arrayOf(
      CalendarContract.Calendars._ID,
      CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
      CalendarContract.Calendars.ACCOUNT_NAME,
      CalendarContract.Calendars.IS_PRIMARY,
      CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
      CalendarContract.Calendars.ALLOWED_AVAILABILITY,
      CalendarContract.Calendars.NAME,
      CalendarContract.Calendars.ACCOUNT_TYPE,
      CalendarContract.Calendars.CALENDAR_COLOR,
      CalendarContract.Calendars.OWNER_ACCOUNT,
      CalendarContract.Calendars.CALENDAR_TIME_ZONE,
      CalendarContract.Calendars.ALLOWED_REMINDERS,
      CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
      CalendarContract.Calendars.VISIBLE,
      CalendarContract.Calendars.SYNC_EVENTS
    ), null, null, null)!!
    result = if (cursor.count > 0) {
      cursor.moveToFirst()
      serializeEventCalendar(cursor)
    } else {
      null
    }
    cursor.close()
    return result
  }

  private fun findAttendeesByEventId(eventID: String): List<Bundle> {
    val cursor: Cursor = CalendarContract.Attendees.query(contentResolver, eventID.toLong(), arrayOf(
      CalendarContract.Attendees._ID,
      CalendarContract.Attendees.ATTENDEE_NAME,
      CalendarContract.Attendees.ATTENDEE_EMAIL,
      CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
      CalendarContract.Attendees.ATTENDEE_TYPE,
      CalendarContract.Attendees.ATTENDEE_STATUS
    ))
    return serializeAttendees(cursor)
  }

  @Throws(Exception::class)
  private fun saveCalendar(details: ReadableArguments): Int {
    val calendarValues = ContentValues()
    val putDetailsString: (calendarKey: String, detailsKey: String) -> Unit = { calendarKey, detailsKey ->
      if (details.containsKey(detailsKey)) {
        calendarValues.put(calendarKey, details.getString(detailsKey))
      }
    }
    putDetailsString(CalendarContract.Calendars.NAME, "name")
    putDetailsString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, "title")

    val putDetailsBoolean: (calendarKey: String, detailsKey: String) -> Unit = { calendarKey, detailsKey ->
      if (details.containsKey(detailsKey)) {
        calendarValues.put(calendarKey, if (details.getBoolean(detailsKey)) 1 else 0)
      }
    }
    putDetailsBoolean(CalendarContract.Calendars.VISIBLE, "isVisible")
    putDetailsBoolean(CalendarContract.Calendars.SYNC_EVENTS, "isSynced")

    return if (details.containsKey("id")) {
      val calendarID = details.getString("id").toInt()
      val updateUri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toLong())
      contentResolver.update(updateUri, calendarValues, null, null)
      calendarID
    } else {
      val checkMissingItem: (key: String) -> Unit = {
        if (!details.containsKey(it)) {
          throw Exception("new calendars require $it")
        }
      }
      checkMissingItem("name")
      checkMissingItem("title")
      checkMissingItem("source")
      checkMissingItem("color")
      checkMissingItem("accessLevel")
      checkMissingItem("ownerAccount")
      val source = details.getArguments("source")
      if (!source.containsKey("name")) {
        throw Exception("new calendars require a `source` object with a `name`")
      }
      var isLocalAccount = false
      if (source.containsKey("isLocalAccount")) {
        isLocalAccount = source.getBoolean("isLocalAccount")
      }
      if (!source.containsKey("type") && !isLocalAccount) {
        throw Exception("new calendars require a `source` object with a `type`, or `isLocalAccount`: true")
      }
      calendarValues.put(CalendarContract.Calendars.ACCOUNT_NAME, source.getString("name"))
      calendarValues.put(CalendarContract.Calendars.ACCOUNT_TYPE, if (isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else source.getString("type"))
      calendarValues.put(CalendarContract.Calendars.CALENDAR_COLOR, details.getInt("color"))
      calendarValues.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, calAccessConstantMatchingString(details.getString("accessLevel")))
      calendarValues.put(CalendarContract.Calendars.OWNER_ACCOUNT, details.getString("ownerAccount"))
      // end required fields
      if (details.containsKey("timeZone")) {
        calendarValues.put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, details.getString("timeZone"))
      }
      if (details.containsKey("allowedReminders")) {
        val array = details.getList("allowedReminders")
        val values = arrayOfNulls<Int>(array.size)
        for (i in array.indices) {
          values[i] = reminderConstantMatchingString(array[i] as String?)
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_REMINDERS, TextUtils.join(",", values))
      }
      if (details.containsKey("allowedAvailabilities")) {
        val array = details.getList("allowedAvailabilities")
        val values = arrayOfNulls<Int>(array.size)
        for (i in array.indices) {
          values[i] = availabilityConstantMatchingString(array[i] as String)
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_AVAILABILITY, TextUtils.join(",", values))
      }
      if (details.containsKey("allowedAttendeeTypes")) {
        val array = details.getList("allowedAttendeeTypes")
        val values = arrayOfNulls<Int>(array.size)
        for (i in array.indices) {
          values[i] = attendeeTypeConstantMatchingString(array[i] as String)
        }
        calendarValues.put(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES, TextUtils.join(",", values))
      }
      val uriBuilder = CalendarContract.Calendars.CONTENT_URI.buildUpon()
      uriBuilder.appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
      uriBuilder.appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, source.getString("name"))
      uriBuilder.appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, if (isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else source.getString("type"))
      val calendarsUri = uriBuilder.build()
      val calendarUri = contentResolver.insert(calendarsUri, calendarValues)
      calendarUri!!.lastPathSegment!!.toInt()
    }
  }

  @Throws(SecurityException::class)
  private fun deleteCalendar(calendarId: String): Boolean {
    val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarId.toInt().toLong())
    val rows = contentResolver.delete(uri, null, null)
    return rows > 0
  }

  @Throws(EventNotSavedException::class, ParseException::class, SecurityException::class, InvalidArgumentException::class)
  private fun saveEvent(details: ReadableArguments): Int {
    val eventValues = ContentValues()

    val putEventString: (eventKey: String, detailsKey: String) -> Unit = { eventKey, detailsKey ->
      if (details.containsKey(detailsKey)) {
        eventValues.put(eventKey, details.getString(detailsKey))
      }
    }
    putEventString(CalendarContract.Events.TITLE, "title")
    putEventString(CalendarContract.Events.DESCRIPTION, "notes")
    putEventString(CalendarContract.Events.EVENT_LOCATION, "location")
    putEventString(CalendarContract.Events.ORGANIZER, "organizerEmail")

    if (details.containsKey("startDate")) {
      val startCal = Calendar.getInstance()
      val startDate = details["startDate"]
      try {
        when (startDate) {
          is String -> {
            val parsedDate = sdf.parse(startDate)
            if (parsedDate != null) {
              startCal.time = parsedDate
              eventValues.put(CalendarContract.Events.DTSTART, startCal.timeInMillis)
            } else {
              Log.e(TAG, "Parsed date is null")
            }
          }
          is Number -> {
            eventValues.put(CalendarContract.Events.DTSTART, startDate.toLong())
          }
          else -> {
            Log.e(TAG, "startDate has unsupported type")
          }
        }
      } catch (e: ParseException) {
        Log.e(TAG, "error", e)
        throw e
      }
    }
    if (details.containsKey("endDate")) {
      val endCal = Calendar.getInstance()
      val endDate = details["endDate"]
      try {
        if (endDate is String) {
          val parsedDate = sdf.parse(endDate)
          if (parsedDate != null) {
            endCal.time = parsedDate
            eventValues.put(CalendarContract.Events.DTEND, endCal.timeInMillis)
          } else {
            Log.e(TAG, "Parsed date is null")
          }
        } else if (endDate is Number) {
          eventValues.put(CalendarContract.Events.DTEND, endDate.toLong())
        }
      } catch (e: ParseException) {
        Log.e(TAG, "error", e)
        throw e
      }
    }
    if (details.containsKey("recurrenceRule")) {
      val recurrenceRule = details.getArguments("recurrenceRule")
      if (recurrenceRule.containsKey("frequency")) {
        val frequency = recurrenceRule.getString("frequency")
        var interval: Int? = null
        var occurrence: Int? = null
        var endDate: String? = null
        if (recurrenceRule.containsKey("interval")) {
          interval = recurrenceRule.getInt("interval")
        }
        if (recurrenceRule.containsKey("occurrence")) {
          occurrence = recurrenceRule.getInt("occurrence")
        }
        if (recurrenceRule.containsKey("endDate")) {
          val format = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'")
          val endDateObj = recurrenceRule["endDate"]
          if (endDateObj is String) {
            val parsedDate = sdf.parse(endDateObj)
            if (parsedDate != null) {
              endDate = format.format(parsedDate)
            } else {
              Log.e(TAG, "endDate is null")
            }
          } else if (endDateObj is Number) {
            val calendar = Calendar.getInstance()
            calendar.timeInMillis = endDateObj.toLong()
            endDate = format.format(calendar.time)
          }
        }
        if (endDate == null && occurrence == null) {
          val eventStartDate = eventValues.getAsLong(CalendarContract.Events.DTSTART)
          val eventEndDate = eventValues.getAsLong(CalendarContract.Events.DTEND)
          val duration = (eventEndDate - eventStartDate) / 1000
          eventValues.putNull(CalendarContract.Events.LAST_DATE)
          eventValues.putNull(CalendarContract.Events.DTEND)
          eventValues.put(CalendarContract.Events.DURATION, "PT${duration}S")
        }
        val rule = createRecurrenceRule(frequency, interval, endDate, occurrence)
        eventValues.put(CalendarContract.Events.RRULE, rule)
      }
    }
    val putEventBoolean: (eventKey: String, detailsKey: String) -> Unit = { eventKey, detailsKey ->
      if (details.containsKey(detailsKey)) {
        eventValues.put(eventKey, if (details.getBoolean(detailsKey)) 1 else 0)
      }
    }
    putEventBoolean(CalendarContract.Events.ALL_DAY, "allDay")
    putEventBoolean(CalendarContract.Events.GUESTS_CAN_MODIFY, "guestsCanModify")
    putEventBoolean(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, "guestsCanInviteOthers")
    putEventBoolean(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, "guestsCanSeeGuests")
    if (details.containsKey("alarms")) {
      eventValues.put(CalendarContract.Events.HAS_ALARM, true)
    }
    if (details.containsKey("availability")) {
      eventValues.put(CalendarContract.Events.AVAILABILITY, availabilityConstantMatchingString(details.getString("availability")))
    }
    eventValues.put(CalendarContract.Events.EVENT_TIMEZONE, if (details.containsKey("timeZone")) details.getString("timeZone") else TimeZone.getDefault().id)
    eventValues.put(CalendarContract.Events.EVENT_END_TIMEZONE, if (details.containsKey("endTimeZone")) details.getString("endTimeZone") else TimeZone.getDefault().id)
    if (details.containsKey("accessLevel")) {
      eventValues.put(CalendarContract.Events.ACCESS_LEVEL, accessConstantMatchingString(details.getString("accessLevel")))
    }
    return if (details.containsKey("id")) {
      val eventID = details.getString("id").toInt()
      val updateUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      contentResolver.update(updateUri, eventValues, null, null)
      removeRemindersForEvent(eventID)
      if (details.containsKey("alarms")) {
        createRemindersForEvent(eventID, details.getList("alarms"))
      }
      eventID
    } else {
      if (details.containsKey("calendarId")) {
        val calendar = findCalendarById(details.getString("calendarId"))
        if (calendar != null) {
          eventValues.put(CalendarContract.Events.CALENDAR_ID, calendar.getString("id")!!.toInt())
        } else {
          throw InvalidArgumentException("Couldn't find calendar with given id: " + details.getString("calendarId"))
        }
      } else {
        throw InvalidArgumentException("CalendarId is required.")
      }
      val eventsUri = CalendarContract.Events.CONTENT_URI
      val eventUri = contentResolver.insert(eventsUri, eventValues)
        ?: throw EventNotSavedException()
      val eventID = eventUri.lastPathSegment!!.toInt()
      if (details.containsKey("alarms")) {
        createRemindersForEvent(eventID, details.getList("alarms"))
      }
      eventID
    }
  }

  @Throws(ParseException::class, SecurityException::class)
  private fun removeEvent(details: ReadableArguments): Boolean {
    val rows: Int
    val eventID = details.getString("id").toInt()
    if (!details.containsKey("instanceStartDate")) {
      val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      rows = contentResolver.delete(uri, null, null)
      return rows > 0
    } else {
      val exceptionValues = ContentValues()
      val startCal = Calendar.getInstance()
      val instanceStartDate = details["instanceStartDate"]
      try {
        if (instanceStartDate is String) {
          val parsedDate = sdf.parse(instanceStartDate)
          if (parsedDate != null) {
            startCal.time = parsedDate
            exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, startCal.timeInMillis)
          } else {
            Log.e(TAG, "Parsed date is null")
          }
        } else if (instanceStartDate is Number) {
          exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, instanceStartDate.toLong())
        }
      } catch (e: ParseException) {
        Log.e(TAG, "error", e)
        throw e
      }
      exceptionValues.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)
      val exceptionUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, eventID.toLong())
      contentResolver.insert(exceptionUri, exceptionValues)
    }
    return true
  }

  // TODO: needs refactor, argument `eventID` is probably redundant
  @Throws(Exception::class, SecurityException::class)
  private fun saveAttendeeForEvent(details: ReadableArguments, eventID: String?): Int {
    val attendeeValues = ContentValues()
    val isNew = !details.containsKey("id")
    if (details.containsKey("name")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_NAME, details.getString("name"))
    }
    if (details.containsKey("email")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_EMAIL, details.getString("email"))
    } else {
      if (isNew) {
        throw Exception("new attendees require `email`")
      }
    }
    if (details.containsKey("role")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, attendeeRelationshipConstantMatchingString(details.getString("role")))
    } else {
      if (isNew) {
        throw Exception("new attendees require `role`")
      }
    }
    if (details.containsKey("type")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_TYPE, attendeeTypeConstantMatchingString(details.getString("type")))
    } else {
      if (isNew) {
        throw Exception("new attendees require `type`")
      }
    }
    if (details.containsKey("status")) {
      attendeeValues.put(CalendarContract.Attendees.ATTENDEE_STATUS, attendeeStatusConstantMatchingString(details.getString("status")))
    } else {
      if (isNew) {
        throw Exception("new attendees require `status`")
      }
    }
    return if (isNew) {
      attendeeValues.put(CalendarContract.Attendees.EVENT_ID, eventID?.toInt())
      val attendeesUri = CalendarContract.Attendees.CONTENT_URI
      val attendeeUri = contentResolver.insert(attendeesUri, attendeeValues)
      attendeeUri!!.lastPathSegment!!.toInt()
    } else {
      val attendeeID = details.getString("id").toInt()
      val updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
      contentResolver.update(updateUri, attendeeValues, null, null)
      attendeeID
    }
  }

  @Throws(SecurityException::class)
  private fun deleteAttendee(attendeeID: String): Boolean {
    val rows: Int
    val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toInt().toLong())
    rows = contentResolver.delete(uri, null, null)
    return rows > 0
  }

  @Throws(SecurityException::class)
  private fun createRemindersForEvent(eventID: Int, reminders: List<*>) {
    for (i in reminders.indices) {
      val reminder = reminders[i] as Map<*, *>
      val relativeOffset = reminder["relativeOffset"]
      if (relativeOffset is Number) {
        val minutes = -relativeOffset.toInt()
        var method = CalendarContract.Reminders.METHOD_DEFAULT
        val reminderValues = ContentValues()
        if (reminder.containsKey("method")) {
          method = reminderConstantMatchingString(reminder["method"] as? String)
        }
        reminderValues.put(CalendarContract.Reminders.EVENT_ID, eventID)
        reminderValues.put(CalendarContract.Reminders.MINUTES, minutes)
        reminderValues.put(CalendarContract.Reminders.METHOD, method)
        contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues)
      }
    }
  }

  @Throws(SecurityException::class)
  private fun removeRemindersForEvent(eventID: Int) {
    val cursor = CalendarContract.Reminders.query(contentResolver, eventID.toLong(), arrayOf(
      CalendarContract.Reminders._ID
    ))
    while (cursor.moveToNext()) {
      val reminderUri = ContentUris.withAppendedId(CalendarContract.Reminders.CONTENT_URI, cursor.getLong(0))
      contentResolver.delete(reminderUri, null, null)
    }
  }

  private fun reminderStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Reminders.METHOD_ALARM -> "alarm"
      CalendarContract.Reminders.METHOD_ALERT -> "alert"
      CalendarContract.Reminders.METHOD_EMAIL -> "email"
      CalendarContract.Reminders.METHOD_SMS -> "sms"
      CalendarContract.Reminders.METHOD_DEFAULT -> "default"
      else -> "default"
    }

  private fun reminderConstantMatchingString(string: String?): Int =
    when (string) {
      "alert" -> CalendarContract.Reminders.METHOD_ALERT
      "alarm" -> CalendarContract.Reminders.METHOD_ALARM
      "email" -> CalendarContract.Reminders.METHOD_EMAIL
      "sms" -> CalendarContract.Reminders.METHOD_SMS
      else -> CalendarContract.Reminders.METHOD_DEFAULT
    }

  private fun calendarAllowedRemindersFromDBString(dbString: String?): ArrayList<String> {
    val array = ArrayList<String>()
    for (constant in dbString!!.split(",").toTypedArray()) {
      try {
        array.add(reminderStringMatchingConstant(constant.toInt()))
      } catch (e: NumberFormatException) {
        Log.e(TAG, "Couldn't convert reminder constant into an int.", e)
      }
    }
    return array
  }

  private fun calendarAllowedAvailabilitiesFromDBString(dbString: String?): ArrayList<String> {
    val availabilitiesStrings = ArrayList<String>()
    for (availabilityId in dbString!!.split(",").toTypedArray()) {
      when (availabilityId.toInt()) {
        CalendarContract.Events.AVAILABILITY_BUSY -> availabilitiesStrings.add("busy")
        CalendarContract.Events.AVAILABILITY_FREE -> availabilitiesStrings.add("free")
        CalendarContract.Events.AVAILABILITY_TENTATIVE -> availabilitiesStrings.add("tentative")
      }
    }
    return availabilitiesStrings
  }

  private fun availabilityStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Events.AVAILABILITY_BUSY -> "busy"
      CalendarContract.Events.AVAILABILITY_FREE -> "free"
      CalendarContract.Events.AVAILABILITY_TENTATIVE -> "tentative"
      else -> "busy"
    }

  private fun availabilityConstantMatchingString(string: String): Int =
    when (string) {
      "free" -> CalendarContract.Events.AVAILABILITY_FREE
      "tentative" -> CalendarContract.Events.AVAILABILITY_TENTATIVE
      else -> CalendarContract.Events.AVAILABILITY_BUSY
    }

  private fun accessStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Events.ACCESS_CONFIDENTIAL -> "confidential"
      CalendarContract.Events.ACCESS_PRIVATE -> "private"
      CalendarContract.Events.ACCESS_PUBLIC -> "public"
      CalendarContract.Events.ACCESS_DEFAULT -> "default"
      else -> "default"
    }

  private fun accessConstantMatchingString(string: String): Int =
    when (string) {
      "confidential" -> CalendarContract.Events.ACCESS_CONFIDENTIAL
      "private" -> CalendarContract.Events.ACCESS_PRIVATE
      "public" -> CalendarContract.Events.ACCESS_PUBLIC
      else -> CalendarContract.Events.ACCESS_DEFAULT
    }

  private fun calAccessStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR -> "contributor"
      CalendarContract.Calendars.CAL_ACCESS_EDITOR -> "editor"
      CalendarContract.Calendars.CAL_ACCESS_FREEBUSY -> "freebusy"
      CalendarContract.Calendars.CAL_ACCESS_OVERRIDE -> "override"
      CalendarContract.Calendars.CAL_ACCESS_OWNER -> "owner"
      CalendarContract.Calendars.CAL_ACCESS_READ -> "read"
      CalendarContract.Calendars.CAL_ACCESS_RESPOND -> "respond"
      CalendarContract.Calendars.CAL_ACCESS_ROOT -> "root"
      CalendarContract.Calendars.CAL_ACCESS_NONE -> "none"
      else -> "none"
    }

  private fun calAccessConstantMatchingString(string: String): Int =
    when (string) {
      "contributor" -> CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
      "editor" -> CalendarContract.Calendars.CAL_ACCESS_EDITOR
      "freebusy" -> CalendarContract.Calendars.CAL_ACCESS_FREEBUSY
      "override" -> CalendarContract.Calendars.CAL_ACCESS_OVERRIDE
      "owner" -> CalendarContract.Calendars.CAL_ACCESS_OWNER
      "read" -> CalendarContract.Calendars.CAL_ACCESS_READ
      "respond" -> CalendarContract.Calendars.CAL_ACCESS_RESPOND
      "root" -> CalendarContract.Calendars.CAL_ACCESS_ROOT
      else -> CalendarContract.Calendars.CAL_ACCESS_NONE
    }

  private fun attendeeRelationshipStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Attendees.RELATIONSHIP_ATTENDEE -> "attendee"
      CalendarContract.Attendees.RELATIONSHIP_ORGANIZER -> "organizer"
      CalendarContract.Attendees.RELATIONSHIP_PERFORMER -> "performer"
      CalendarContract.Attendees.RELATIONSHIP_SPEAKER -> "speaker"
      CalendarContract.Attendees.RELATIONSHIP_NONE -> "none"
      else -> "none"
    }

  private fun attendeeRelationshipConstantMatchingString(string: String): Int =
    when (string) {
      "attendee" -> CalendarContract.Attendees.RELATIONSHIP_ATTENDEE
      "organizer" -> CalendarContract.Attendees.RELATIONSHIP_ORGANIZER
      "performer" -> CalendarContract.Attendees.RELATIONSHIP_PERFORMER
      "speaker" -> CalendarContract.Attendees.RELATIONSHIP_SPEAKER
      else -> CalendarContract.Attendees.RELATIONSHIP_NONE
    }

  private fun attendeeTypeStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Attendees.TYPE_OPTIONAL -> "optional"
      CalendarContract.Attendees.TYPE_REQUIRED -> "required"
      CalendarContract.Attendees.TYPE_RESOURCE -> "resource"
      CalendarContract.Attendees.TYPE_NONE -> "none"
      else -> "none"
    }

  private fun attendeeTypeConstantMatchingString(string: String): Int =
    when (string) {
      "optional" -> CalendarContract.Attendees.TYPE_OPTIONAL
      "required" -> CalendarContract.Attendees.TYPE_REQUIRED
      "resource" -> CalendarContract.Attendees.TYPE_RESOURCE
      else -> CalendarContract.Attendees.TYPE_NONE
    }

  private fun calendarAllowedAttendeeTypesFromDBString(dbString: String?): ArrayList<String> {
    val array = ArrayList<String>()
    for (constant in dbString!!.split(",").toTypedArray()) {
      try {
        array.add(attendeeTypeStringMatchingConstant(constant.toInt()))
      } catch (e: NumberFormatException) {
        Log.e(TAG, "Couldn't convert attendee constant into an int.", e)
      }
    }
    return array
  }

  private fun attendeeStatusStringMatchingConstant(constant: Int): String =
    when (constant) {
      CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED -> "accepted"
      CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED -> "declined"
      CalendarContract.Attendees.ATTENDEE_STATUS_INVITED -> "invited"
      CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE -> "tentative"
      CalendarContract.Attendees.ATTENDEE_STATUS_NONE -> "none"
      else -> "none"
    }

  private fun attendeeStatusConstantMatchingString(string: String): Int =
    when (string) {
      "accepted" -> CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED
      "declined" -> CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED
      "invited" -> CalendarContract.Attendees.ATTENDEE_STATUS_INVITED
      "tentative" -> CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE
      else -> CalendarContract.Attendees.ATTENDEE_STATUS_NONE
    }

  private fun createRecurrenceRule(recurrence: String, interval: Int?, endDate: String?, occurrence: Int?): String {
    var rrule: String = when (recurrence) {
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

  private fun serializeEvents(cursor: Cursor?): List<Bundle> {
    val results: MutableList<Bundle> = ArrayList()
    while (cursor!!.moveToNext()) {
      results.add(serializeEvent(cursor))
    }
    cursor.close()
    return results
  }

  private fun serializeEvent(cursor: Cursor?): Bundle {
    val event = Bundle()
    val foundStartDate = Calendar.getInstance()
    val foundEndDate = Calendar.getInstance()
    var startDateUTC: String? = ""
    var endDateUTC: String? = ""

    // may be CalendarContract.Instances.BEGIN or CalendarContract.Events.DTSTART (which have different string values)
    val startDate = cursor!!.getString(3)
    if (startDate != null) {
      foundStartDate.timeInMillis = startDate.toLong()
      startDateUTC = sdf.format(foundStartDate.time)
    }

    // may be CalendarContract.Instances.END or CalendarContract.Events.DTEND (which have different string values)
    val endDate = cursor.getString(4)
    if (endDate != null) {
      foundEndDate.timeInMillis = endDate.toLong()
      endDateUTC = sdf.format(foundEndDate.time)
    }
    val rrule = optStringFromCursor(cursor, CalendarContract.Events.RRULE)
    if (rrule != null) {
      val recurrenceRule = Bundle()
      val recurrenceRules = rrule.split(";").toTypedArray()
      recurrenceRule.putString("frequency", recurrenceRules[0].split("=").toTypedArray()[1].toLowerCase())
      if (recurrenceRules.size >= 2 && recurrenceRules[1].split("=").toTypedArray()[0] == "INTERVAL") {
        recurrenceRule.putInt("interval", recurrenceRules[1].split("=").toTypedArray()[1].toInt())
      }
      if (recurrenceRules.size >= 3) {
        val terminationRules = recurrenceRules[2].split("=").toTypedArray()
        if (terminationRules.size >= 2) {
          if (terminationRules[0] == "UNTIL") {
            try {
              recurrenceRule.putString("endDate", sdf.parse(terminationRules[1])?.toString())
            } catch (e: ParseException) {
              Log.e(TAG, "Couldn't parse the `endDate` property.", e)
            } catch (e: NullPointerException) {
              Log.e(TAG, "endDate is null", e)
            }
          } else if (terminationRules[0] == "COUNT") {
            recurrenceRule.putInt("occurrence", recurrenceRules[2].split("=").toTypedArray()[1].toInt())
          }
        }
        Log.e(TAG, "Couldn't parse termination rules: '${recurrenceRules[2]}'.", null)
      }
      event.putBundle("recurrenceRule", recurrenceRule)
    }


    // may be CalendarContract.Instances.EVENT_ID or CalendarContract.Events._ID (which have different string values)
    event.putString("id", cursor.getString(0))
    event.putString("calendarId", optStringFromCursor(cursor, CalendarContract.Events.CALENDAR_ID))
    event.putString("title", optStringFromCursor(cursor, CalendarContract.Events.TITLE))
    event.putString("notes", optStringFromCursor(cursor, CalendarContract.Events.DESCRIPTION))
    event.putString("startDate", startDateUTC)
    event.putString("endDate", endDateUTC)
    event.putBoolean("allDay", optIntFromCursor(cursor, CalendarContract.Events.ALL_DAY) != 0)
    event.putString("location", optStringFromCursor(cursor, CalendarContract.Events.EVENT_LOCATION))
    event.putString("availability", availabilityStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Events.AVAILABILITY)))
    event.putParcelableArrayList("alarms", serializeAlarms(cursor.getLong(0)))
    event.putString("organizerEmail", optStringFromCursor(cursor, CalendarContract.Events.ORGANIZER))
    event.putString("timeZone", optStringFromCursor(cursor, CalendarContract.Events.EVENT_TIMEZONE))
    event.putString("endTimeZone", optStringFromCursor(cursor, CalendarContract.Events.EVENT_END_TIMEZONE))
    event.putString("accessLevel", accessStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Events.ACCESS_LEVEL)))
    event.putBoolean("guestsCanModify", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_MODIFY) != 0)
    event.putBoolean("guestsCanInviteOthers", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0)
    event.putBoolean("guestsCanSeeGuests", optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0)
    event.putString("originalId", optStringFromCursor(cursor, CalendarContract.Events.ORIGINAL_ID))

    // unfortunately the string values of CalendarContract.Events._ID and CalendarContract.Instances._ID are equal
    // so we'll use the somewhat brittle column number from the query
    if (cursor.columnCount > 18) {
      event.putString("instanceId", cursor.getString(18))
    }
    return event
  }

  private fun serializeAlarms(eventID: Long): ArrayList<Bundle> {
    val alarms = ArrayList<Bundle>()
    val cursor = CalendarContract.Reminders.query(contentResolver, eventID, arrayOf(
      CalendarContract.Reminders.MINUTES,
      CalendarContract.Reminders.METHOD
    ))
    while (cursor.moveToNext()) {
      val thisAlarm = Bundle()
      thisAlarm.putInt("relativeOffset", -cursor.getInt(0))
      val method = cursor.getInt(1)
      thisAlarm.putString("method", reminderStringMatchingConstant(method))
      alarms.add(thisAlarm)
    }
    return alarms
  }

  private fun serializeEventCalendars(cursor: Cursor?): List<Bundle> {
    val results: MutableList<Bundle> = ArrayList()
    while (cursor!!.moveToNext()) {
      results.add(serializeEventCalendar(cursor))
    }
    cursor.close()
    return results
  }

  private fun serializeEventCalendar(cursor: Cursor?): Bundle {
    val calendar = Bundle().apply {
      putString("id", optStringFromCursor(cursor, CalendarContract.Calendars._ID))
      putString("title", optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
      putBoolean("isPrimary", optStringFromCursor(cursor, CalendarContract.Calendars.IS_PRIMARY) === "1")
      putStringArrayList("allowedAvailabilities", calendarAllowedAvailabilitiesFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_AVAILABILITY)))
      putString("name", optStringFromCursor(cursor, CalendarContract.Calendars.NAME))
      putString("color", String.format("#%06X", 0xFFFFFF and optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_COLOR)))
      putString("ownerAccount", optStringFromCursor(cursor, CalendarContract.Calendars.OWNER_ACCOUNT))
      putString("timeZone", optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_TIME_ZONE))
      putStringArrayList("allowedReminders", calendarAllowedRemindersFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_REMINDERS)))
      putStringArrayList("allowedAttendeeTypes", calendarAllowedAttendeeTypesFromDBString(optStringFromCursor(cursor, CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES)))
      putBoolean("isVisible", optIntFromCursor(cursor, CalendarContract.Calendars.VISIBLE) != 0)
      putBoolean("isSynced", optIntFromCursor(cursor, CalendarContract.Calendars.SYNC_EVENTS) != 0)
      val accessLevel = optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)
      putString("accessLevel", calAccessStringMatchingConstant(accessLevel))
      putBoolean(
        "allowsModifications",
        accessLevel == CalendarContract.Calendars.CAL_ACCESS_ROOT
          or CalendarContract.Calendars.CAL_ACCESS_OWNER
          or CalendarContract.Calendars.CAL_ACCESS_EDITOR
          or CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
      )
    }
    val source = Bundle().apply {
      putString("name", optStringFromCursor(cursor, CalendarContract.Calendars.ACCOUNT_NAME))
      val type = optStringFromCursor(cursor, CalendarContract.Calendars.ACCOUNT_TYPE)
      putString("type", type)
      putBoolean("isLocalAccount", type == CalendarContract.ACCOUNT_TYPE_LOCAL)
    }
    calendar.putBundle("source", source)
    return calendar
  }

  private fun serializeAttendees(cursor: Cursor): List<Bundle> {
    val results: MutableList<Bundle> = ArrayList()
    while (cursor.moveToNext()) {
      results.add(serializeAttendee(cursor))
    }
    cursor.close()
    return results
  }

  private fun serializeAttendee(cursor: Cursor): Bundle = Bundle().apply {
    putString("id", optStringFromCursor(cursor, CalendarContract.Attendees._ID))
    putString("name", optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_NAME))
    putString("email", optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_EMAIL))
    putString("role", attendeeRelationshipStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)))
    putString("type", attendeeTypeStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_TYPE)))
    putString("status", attendeeStatusStringMatchingConstant(optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_STATUS)))
  }

  private fun optStringFromCursor(cursor: Cursor?, columnName: String): String? {
    val index = cursor!!.getColumnIndex(columnName)
    return if (index == -1) {
      null
    } else cursor.getString(index)
  }

  private fun optIntFromCursor(cursor: Cursor?, columnName: String): Int {
    val index = cursor!!.getColumnIndex(columnName)
    return if (index == -1) {
      0
    } else cursor.getInt(index)
  }

  private fun checkPermissions(promise: Promise): Boolean {
    if (mPermissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module not found. Are you sure that Expo modules are properly linked?")
      return false
    }
    if (!mPermissionsManager!!.hasGrantedPermissions(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)) {
      promise.reject("E_MISSING_PERMISSIONS", "CALENDAR permission is required to do this operation.")
      return false
    }
    return true
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

  companion object {
    private val TAG = CalendarModule::class.java.simpleName
  }
}