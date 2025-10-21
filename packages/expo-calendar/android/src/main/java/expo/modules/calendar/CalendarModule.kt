package expo.modules.calendar

import android.Manifest
import android.content.ContentUris
import android.content.Intent
import android.provider.CalendarContract
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.calendar.domain.attendee.AttendeeRepository
import expo.modules.calendar.domain.attendee.records.Attendee
import expo.modules.calendar.domain.calendar.CalendarRepository
import expo.modules.calendar.domain.calendar.records.input.CalendarUpdateInput
import expo.modules.calendar.domain.calendar.records.input.NewCalendarInput
import expo.modules.calendar.domain.event.EventRepository
import expo.modules.calendar.domain.event.records.input.EventUpdateInput
import expo.modules.calendar.domain.event.records.input.NewEventInput
import expo.modules.calendar.exceptions.EventNotDeletedException
import expo.modules.calendar.exceptions.EventNotFoundException
import expo.modules.calendar.exceptions.EventNotSavedException
import expo.modules.calendar.exceptions.EventsNotFoundException
import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.domain.event.records.input.RemoveEventInput
import expo.modules.calendar.exceptions.AttendeeNotDeletedException
import expo.modules.calendar.exceptions.AttendeeNotSavedException
import expo.modules.calendar.exceptions.CalendarNotDeletedException
import expo.modules.calendar.exceptions.CalendarNotSavedException
import expo.modules.calendar.exceptions.CalendarsNotFoundException
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.utilities.ifNull
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import java.text.ParseException

@OptIn(EitherType::class)
class CalendarModule : Module() {
  private val reactContext
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var createEventLauncher: AppContextActivityResultLauncher<CreatedEventOptions, CreateEventIntentResult>
  private lateinit var viewEventLauncher: AppContextActivityResultLauncher<ViewedEventOptions, ViewEventIntentResult>

  private val calendarRepository: CalendarRepository by lazy {
    CalendarRepository(reactContext)
  }

  private val eventRepository: EventRepository by lazy {
    EventRepository(reactContext)
  }

  private val attendeeRepository: AttendeeRepository by lazy {
    AttendeeRepository(reactContext)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoCalendar")

    RegisterActivityContracts {
      createEventLauncher = registerForActivityResult(
        CreateEventContract()
      )
      viewEventLauncher = registerForActivityResult(
        ViewEventContract()
      )
    }

    AsyncFunction("getCalendarsAsync") Coroutine { type: String? ->
      checkPermissions()
      if (type != null && type == "reminder") {
        throw CalendarsNotFoundException("Calendars of type `reminder` are not supported on Android", null)
      }
      try {
        val calendars = calendarRepository.findCalendars()
        return@Coroutine calendars
      } catch (e: Exception) {
        throw CalendarsNotFoundException("Calendars could not be found", e)
      }
    }

    AsyncFunction("saveCalendarAsync") Coroutine { calendarInput: Either<NewCalendarInput, CalendarUpdateInput> ->
      checkPermissions()
      try {
        val calendarID = if (calendarInput.`is`(CalendarUpdateInput::class)) {
          calendarRepository.updateCalendar(calendarInput.second())
        } else {
          calendarRepository.createCalendar(calendarInput.first())
        }
        return@Coroutine calendarID.toString()
      } catch (e: Exception) {
        throw CalendarNotSavedException("Calendar could not be saved: " + e.message, e)
      }
    }

    AsyncFunction("deleteCalendarAsync") Coroutine { calendarID: String ->
      checkPermissions()
      val successful = calendarRepository.deleteCalendar(calendarID)
      if (successful) {
        return@Coroutine
      } else {
        throw CalendarNotDeletedException("Calendar with id $calendarID could not be deleted")
      }
    }

    AsyncFunction("getEventsAsync") Coroutine { startDate: DateTimeInput, endDate: DateTimeInput, calendars: List<String> ->
      checkPermissions()
      try {
        val results = eventRepository.findEvents(startDate, endDate, calendars)
        return@Coroutine results
      } catch (e: Exception) {
        throw EventsNotFoundException(cause = e)
      }
    }

    AsyncFunction("getEventByIdAsync") Coroutine { eventID: String ->
      checkPermissions()
      val results = eventRepository.findEventById(eventID).ifNull {
        throw EventNotFoundException("Event with id $eventID could not be found")
      }
      return@Coroutine results
    }

    AsyncFunction("saveEventAsync") Coroutine { event: Either<NewEventInput, EventUpdateInput>, _: ReadableArguments? ->
      checkPermissions()
      try {
        val eventID = saveEvent(event)
        return@Coroutine eventID.toString()
      } catch (e: ParseException) {
        throw EventNotSavedException(cause = e)
      } catch (e: InvalidArgumentException) {
        throw EventNotSavedException(cause = e)
      }
    }

    AsyncFunction("deleteEventAsync") Coroutine { details: RemoveEventInput, _: ReadableArguments? ->
      checkPermissions()
      val successful = try {
        eventRepository.removeEvent(details)
      } catch (e: Exception) {
        throw EventNotDeletedException("Event with id ${details.id} could not be deleted", e)
      }

      if (!successful) {
        throw EventNotDeletedException("Event with id ${details.id} could not be deleted")
      }
    }

    AsyncFunction("getAttendeesForEventAsync") Coroutine { eventID: String ->
      checkPermissions()
      val results = attendeeRepository.findAttendeesByEventId(eventID)
      return@Coroutine results
    }

    AsyncFunction("saveAttendeeForEventAsync") Coroutine { details: Attendee, eventID: String? ->
      checkPermissions()
      try {
        val attendeeID = attendeeRepository.saveAttendeeForEvent(details, eventID)
        return@Coroutine attendeeID.toString()
      } catch (e: Exception) {
        throw AttendeeNotSavedException("Attendees for event with id $eventID could not be saved", e)
      }
    }

    AsyncFunction("deleteAttendeeAsync") Coroutine { attendeeID: String ->
      checkPermissions()
      val successful = attendeeRepository.deleteAttendee(attendeeID)
      if (!successful) {
        throw AttendeeNotDeletedException("Attendee with id $attendeeID could not be deleted", null)
      }
    }

    AsyncFunction("createEventInCalendarAsync") Coroutine { eventOptions: CreatedEventOptions ->
      val result = createEventLauncher.launch(eventOptions)
      return@Coroutine result
    }

    AsyncFunction("openEventInCalendarAsync") Coroutine { params: ViewedEventOptions ->
      val result = viewEventLauncher.launch(params)
      return@Coroutine result
    }

    AsyncFunction("editEventInCalendarAsync") Coroutine { params: ViewedEventOptions ->
      viewEventLauncher.launch(params)
      val editResult = CreateEventIntentResult()
      return@Coroutine editResult
    }

    /**
     * @deprecated in favor of openEventInCalendarAsync
     * */
    AsyncFunction("openEventInCalendar") { eventID: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      val sendIntent = Intent(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).setData(uri)
      if (sendIntent.resolveActivity(context.packageManager) != null) {
        context.startActivity(sendIntent)
      }
    }

    AsyncFunction("requestCalendarPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
    }

    AsyncFunction("getCalendarPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
    }
  }

  //endregion

  private suspend fun saveEvent(eventInput: Either<NewEventInput, EventUpdateInput>): Int {
    return if (eventInput.`is`(EventUpdateInput::class)) {
      eventRepository.updateEvent(eventInput.second())
    } else {
      val newEvent = eventInput.first()

      calendarRepository.findCalendarById(newEvent.calendarId).ifNull {
        throw Exceptions.IllegalArgument("Couldn't find calendar with given id: ${newEvent.calendarId}")
      }

      eventRepository.createEvent(newEvent)
    }
  }

  private fun checkPermissions() {
    if (appContext.permissions?.hasGrantedPermissions(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR) != true) {
      throw CodedException("E_MISSING_PERMISSIONS", "CALENDAR permission is required to do this operation.", null)
    }
  }

  companion object {
    internal val TAG = CalendarModule::class.java.simpleName
  }
}
