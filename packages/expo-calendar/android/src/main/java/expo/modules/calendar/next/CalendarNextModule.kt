package expo.modules.calendar.next

import android.Manifest
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.domain.repositories.calendar.CalendarRepository
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.mappers.CalendarMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ReminderMapper
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.calendar.next.permissions.CalendarPermissionsDelegate
import expo.modules.calendar.next.records.AttendeeUpdateRecord
import expo.modules.calendar.next.records.CalendarInputRecord
import expo.modules.calendar.next.records.CalendarUpdateRecord
import expo.modules.calendar.next.records.EventInputRecord
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CalendarNextModule : Module() {
  private lateinit var createEventLauncher: AppContextActivityResultLauncher<CreatedEventOptions, CreateEventIntentResult>
  private lateinit var viewEventLauncher: AppContextActivityResultLauncher<ViewedEventOptions, ViewEventIntentResult>

  private val context
    get() = appContext.reactContext
      ?: throw Exceptions.ReactContextLost()

  private val permissionsDelegate by lazy {
    CalendarPermissionsDelegate(appContext)
  }

  private val calendarMapper = CalendarMapper()
  private val eventMapper = EventMapper()
  private val attendeeMapper = AttendeeMapper()
  private val reminderMapper = ReminderMapper()

  private val calendarRepository by lazy {
    CalendarRepository(context.contentResolver)
  }

  private val eventRepository by lazy {
    EventRepository(context.contentResolver)
  }

  private val instanceRepository by lazy {
    InstanceRepository(context.contentResolver)
  }

  private val attendeeRepository by lazy {
    AttendeeRepository(context.contentResolver)
  }

  private val reminderRepository by lazy {
    ReminderRepository(context.contentResolver)
  }

  private val expoCalendarFactory by lazy {
    ExpoCalendarFactory(
      calendarRepository = calendarRepository,
      eventRepository = eventRepository,
      instanceRepository = instanceRepository,
      reminderRepository = reminderRepository,
      eventFactory = expoCalendarEventFactory,
      eventMapper = eventMapper,
      reminderMapper = reminderMapper,
      calendarMapper = calendarMapper
    )
  }

  private val expoCalendarEventFactory by lazy {
    ExpoCalendarEventFactory(
      eventRepository = eventRepository,
      instanceRepository = instanceRepository,
      attendeeRepository = attendeeRepository,
      eventMapper = eventMapper,
      attendeeMapper = attendeeMapper,
      reminderMapper = reminderMapper,
      reminderRepository = reminderRepository
    )
  }

  override fun definition() = ModuleDefinition {
    Name("CalendarNext")

    RegisterActivityContracts {
      createEventLauncher = registerForActivityResult(
        CreateEventContract()
      )
      viewEventLauncher = registerForActivityResult(
        ViewEventContract()
      )
    }

    AsyncFunction("getCalendars") Coroutine { type: String? ->
      ExpoCalendar.getAll(type, calendarRepository, expoCalendarFactory)
    }

    AsyncFunction("getCalendarById") Coroutine { calendarId: String ->
      ExpoCalendar.getById(calendarId, calendarRepository, expoCalendarFactory)
    }

    AsyncFunction("requestCalendarPermissions") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR
      )
    }

    AsyncFunction("listEvents") Coroutine { calendarIds: List<String>, startDate: DateTimeInput, endDate: DateTimeInput ->
      ExpoCalendarEvent.findAll(instanceRepository, startDate, endDate, calendarIds, reminderRepository, expoCalendarEventFactory)
    }

    AsyncFunction("createCalendar") Coroutine { calendarInputRecord: CalendarInputRecord ->
      permissionsDelegate.requireSystemPermissions(true)
      ExpoCalendar.create(calendarInputRecord, calendarMapper, calendarRepository, expoCalendarFactory)
    }

    AsyncFunction("getEventById") Coroutine { eventId: String ->
      ExpoCalendarEvent.findById(eventId, eventRepository, reminderRepository, expoCalendarEventFactory)
    }

    Class(ExpoCalendar::class) {
      Constructor { ->
        throw IllegalArgumentException("Creating an ExpoCalendar directly from a CalendarRecord is not supported. Please use ExpoCalendar.getCalendarById or ExpoCalendar.getCalendars to retrieve calendars.")
      }

      Property("id") { expoCalendar: ExpoCalendar ->
        expoCalendar.id
      }

      Property("title") { expoCalendar: ExpoCalendar ->
        expoCalendar.title
      }

      Property("name") { expoCalendar: ExpoCalendar ->
        expoCalendar.name
      }

      Property("source") { expoCalendar: ExpoCalendar ->
        expoCalendar.source
      }

      Property("color") { expoCalendar: ExpoCalendar ->
        expoCalendar.color
      }

      Property("isVisible") { expoCalendar: ExpoCalendar ->
        expoCalendar.isVisible
      }

      Property("isSynced") { expoCalendar: ExpoCalendar ->
        expoCalendar.isSynced
      }

      Property("timeZone") { expoCalendar: ExpoCalendar ->
        expoCalendar.timeZone
      }

      Property("isPrimary") { expoCalendar: ExpoCalendar ->
        expoCalendar.isPrimary
      }

      Property("allowsModifications") { expoCalendar: ExpoCalendar ->
        expoCalendar.allowsModifications
      }

      Property("allowedAvailabilities") { expoCalendar: ExpoCalendar ->
        expoCalendar.allowedAvailabilities
      }

      Property("allowedReminders") { expoCalendar: ExpoCalendar ->
        expoCalendar.allowedReminders
      }

      Property("allowedAttendeeTypes") { expoCalendar: ExpoCalendar ->
        expoCalendar.allowedAttendeeTypes
      }

      Property("ownerAccount") { expoCalendar: ExpoCalendar ->
        expoCalendar.ownerAccount
      }

      Property("accessLevel") { expoCalendar: ExpoCalendar ->
        expoCalendar.accessLevel
      }

      AsyncFunction("listEvents") Coroutine { expoCalendar: ExpoCalendar, startDate: DateTimeInput, endDate: DateTimeInput ->
        expoCalendar.getEvents(startDate, endDate)
      }

      AsyncFunction("createEvent") Coroutine { expoCalendar: ExpoCalendar, record: EventInputRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendar.createEvent(record)
      }

      AsyncFunction("update") Coroutine { expoCalendar: ExpoCalendar, updateCalendarInput: CalendarUpdateRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendar.update(updateCalendarInput)
      }

      AsyncFunction("delete") Coroutine { expoCalendar: ExpoCalendar ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendar.delete()
      }
    }

    Class(ExpoCalendarEvent::class) {
      Constructor { ->
        throw IllegalArgumentException("Creating an ExpoCalendarEvent directly from an EventRecord is not supported. Please use ExpoCalendarEvent.findById or ExpoCalendar.getEvents to retrieve events.")
      }

      Property("id") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.id
      }

      Property("calendarId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.calendarId
      }

      Property("title") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.title
      }

      Property("notes") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.notes
      }

      Property("alarms") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.alarms
      }

      Property("recurrenceRule") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.recurrenceRule
      }

      Property("startDate") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.startDate
      }

      Property("endDate") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.endDate
      }

      Property("allDay") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.allDay
      }

      Property("location") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.location
      }

      Property("timeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.timeZone
      }

      Property("endTimeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.endTimeZone
      }

      Property("availability") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.availability
      }

      Property("status") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.status
      }

      Property("organizerEmail") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.organizerEmail
      }

      Property("accessLevel") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.accessLevel
      }

      Property("guestsCanModify") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.guestsCanModify
      }

      Property("guestsCanInviteOthers") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.guestsCanInviteOthers
      }

      Property("guestsCanSeeGuests") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.guestsCanSeeGuests
      }

      Property("originalId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.originalId
      }

      Property("instanceId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.instanceId
      }

      AsyncFunction("createAttendee") Coroutine { expoCalendarEvent: ExpoCalendarEvent, record: AttendeeRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarEvent.createAttendee(record)
      }

      AsyncFunction("openInCalendar") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions ->
        val eventId = expoCalendarEvent.eventId.value.toString()

        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams.startNewActivityTask
        )
        val result = viewEventLauncher.launch(params)

        return@Coroutine result
      }

      AsyncFunction("editInCalendar") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions? ->
        val eventId = expoCalendarEvent.eventId.value.toString()
        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams?.startNewActivityTask ?: true
        )
        viewEventLauncher.launch(params)
        val editResult = CreateEventIntentResult(id = eventId)
        return@Coroutine editResult
      }

      AsyncFunction("getAttendees") Coroutine { expoCalendarEvent: ExpoCalendarEvent ->
        permissionsDelegate.requireSystemPermissions(false)
        expoCalendarEvent.getAttendees()
      }

      Function("getOccurrenceSync") { expoCalendarEvent: ExpoCalendarEvent, options: RecurringEventOptions? ->
        permissionsDelegate.requireSystemPermissions(false)
        expoCalendarEvent.getOccurrence(options)
      }

      AsyncFunction("update") Coroutine { expoCalendarEvent: ExpoCalendarEvent, eventUpdate: EventUpdateRecord, nullableFields: List<String> ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarEvent.update(eventUpdate)
      }

      AsyncFunction("delete") Coroutine { expoCalendarEvent: ExpoCalendarEvent ->
        permissionsDelegate.requireWritePermissions()
        expoCalendarEvent.delete()
      }
    }

    Class(ExpoCalendarAttendee::class) {
      Constructor { attendeeRecord: AttendeeRecord ->
        ExpoCalendarAttendee(
          attendeeMapper.toDomain(attendeeRecord),
          attendeeMapper,
          attendeeRepository
        )
      }

      Property("id") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.id
      }

      Property("name") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.name
      }

      Property("role") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.role
      }

      Property("status") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.status
      }

      Property("type") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.type
      }

      Property("email") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.email
      }

      AsyncFunction("update") Coroutine { expoCalendarAttendee: ExpoCalendarAttendee, attendeeUpdateRecord: AttendeeUpdateRecord, nullableFields: List<String> ->
        permissionsDelegate.requireWritePermissions()
        expoCalendarAttendee.update(attendeeUpdateRecord)
      }

      AsyncFunction("delete") Coroutine { expoCalendarAttendee: ExpoCalendarAttendee ->
        permissionsDelegate.requireWritePermissions()
        expoCalendarAttendee.delete()
      }
    }

    // Available only on iOS
    Class(ExpoCalendarReminder::class) {
      Constructor { id: String ->
        ExpoCalendarReminder(id)
      }
    }
  }
}
