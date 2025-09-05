package expo.modules.calendar.next

import android.Manifest
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.calendar.next.ExpoCalendar.Companion.findExpoCalendarById
import expo.modules.calendar.next.ExpoCalendar.Companion.findExpoCalendars
import expo.modules.calendar.next.ExpoCalendar.Companion.listEvents
import expo.modules.calendar.next.exceptions.CalendarCouldNotBeDeletedException
import expo.modules.calendar.next.exceptions.EventNotFoundException
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.calendar.next.exceptions.CalendarNotFoundException
import expo.modules.calendar.next.permissions.CalendarPermissionsDelegate
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CalendarNextModule : Module() {
  private lateinit var createEventLauncher: AppContextActivityResultLauncher<CreatedEventOptions, CreateEventIntentResult>
  private lateinit var viewEventLauncher: AppContextActivityResultLauncher<ViewedEventOptions, ViewEventIntentResult>
  private val permissionsDelegate by lazy {
    CalendarPermissionsDelegate(appContext)
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
      permissionsDelegate.requireSystemPermissions(false)
      findExpoCalendars(appContext, type)
    }

    AsyncFunction("getCalendarById") Coroutine { calendarId: String ->
      permissionsDelegate.requireSystemPermissions(false)
      findExpoCalendarById(appContext, calendarId)
    }

    AsyncFunction("requestCalendarPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
    }

    AsyncFunction("listEvents") Coroutine { calendarIds: List<String>, startDate: String, endDate: String ->
      permissionsDelegate.requireSystemPermissions(false)
      listEvents(appContext, calendarIds, startDate, endDate)
    }


    AsyncFunction("createCalendar") Coroutine { calendarRecord: CalendarRecord ->
      permissionsDelegate.requireSystemPermissions(true)
      val calendarId = ExpoCalendar.updateCalendar(appContext, calendarRecord, isNew = true)
      val newCalendarRecord = calendarRecord.copy(id = calendarId.toString())
      ExpoCalendar(appContext, newCalendarRecord)
    }

    AsyncFunction("getEventById") Coroutine { eventId: String ->
      permissionsDelegate.requireSystemPermissions(false)
      ExpoCalendarEvent.findEventById(eventId, appContext)
    }

    Class(ExpoCalendar::class) {
      Constructor { calendarRecord: CalendarRecord ->
        ExpoCalendar(appContext, calendarRecord)
      }

      Property("id") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.id
      }

      Property("title") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.title
      }

      Property("name") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.name
      }

      Property("source") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.source
      }

      Property("color") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.color?.let { colorInt ->
          String.format("#%06X", 0xFFFFFF and colorInt)
        }
      }

      Property("isVisible") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.isVisible
      }

      Property("isSynced") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.isSynced
      }

      Property("timeZone") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.timeZone
      }

      Property("isPrimary") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.isPrimary
      }

      Property("allowsModifications") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.allowsModifications
      }

      Property("allowedAvailabilities") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.allowedAvailabilities
      }

      Property("allowedReminders") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.allowedReminders
      }

      Property("allowedAttendeeTypes") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.allowedAttendeeTypes
      }

      Property("ownerAccount") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.ownerAccount
      }

      Property("accessLevel") { expoCalendar: ExpoCalendar ->
        expoCalendar.calendarRecord?.accessLevel
      }

      AsyncFunction("listEvents") Coroutine { expoCalendar: ExpoCalendar, startDate: String, endDate: String ->
        permissionsDelegate.requireSystemPermissions(false)
        expoCalendar.getEvents(startDate, endDate)
      }

      AsyncFunction("createEvent") Coroutine { expoCalendar: ExpoCalendar, record: EventRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendar.createEvent(record)
      }

      AsyncFunction("update") Coroutine { expoCalendar: ExpoCalendar, details: CalendarRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        val updatedRecord = expoCalendar.getUpdatedRecord(details)
        ExpoCalendar.updateCalendar(appContext, updatedRecord, isNew = false)
        expoCalendar.calendarRecord = updatedRecord
      }

      AsyncFunction("delete") Coroutine { expoCalendar: ExpoCalendar ->
        permissionsDelegate.requireSystemPermissions(true)
        check(expoCalendar.deleteCalendar()) { throw CalendarCouldNotBeDeletedException("An error occurred while deleting calendar") }
      }
    }

    Class(ExpoCalendarEvent::class) {
      Constructor { id: String ->
        ExpoCalendarEvent(appContext)
      }

      Property("id") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.id
      }

      Property("calendarId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.calendarId
      }

      Property("title") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.title
      }

      Property("notes") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.notes
      }

      Property("alarms") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.alarms
      }

      Property("recurrenceRule") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.recurrenceRule
      }

      Property("startDate") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.startDate
      }

      Property("endDate") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.endDate
      }

      Property("allDay") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.allDay
      }

      Property("location") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.location
      }

      Property("timeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.timeZone
      }

      Property("endTimeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.endTimeZone
      }

      Property("availability") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.availability?.value
      }

      Property("status") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.status?.value
      }

      Property("organizerEmail") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.organizerEmail
      }

      Property("accessLevel") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.accessLevel?.value
      }

      Property("guestsCanModify") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.guestsCanModify
      }

      Property("guestsCanInviteOthers") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.guestsCanInviteOthers
      }

      Property("guestsCanSeeGuests") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.guestsCanSeeGuests
      }

      Property("originalId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.originalId
      }

      Property("instanceId") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.eventRecord?.instanceId
      }

      AsyncFunction("createAttendee") Coroutine { expoCalendarEvent: ExpoCalendarEvent, record: AttendeeRecord ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarEvent.createAttendee(record)
      }

      AsyncFunction("openInCalendarAsync") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions ->
        val eventId = expoCalendarEvent.eventRecord?.id
          ?: throw EventNotFoundException("Event id is null")

        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams.startNewActivityTask
        )
        val result = viewEventLauncher.launch(params)

        return@Coroutine result
      }

      AsyncFunction("editInCalendarAsync") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions? ->
        val eventId = expoCalendarEvent.eventRecord?.id
          ?: throw EventNotFoundException("Event id is null")
        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams?.startNewActivityTask ?: true
        )
        viewEventLauncher.launch(params)
        val editResult = CreateEventIntentResult()
        return@Coroutine editResult
      }

      AsyncFunction("getAttendeesAsync") Coroutine { expoCalendarEvent: ExpoCalendarEvent ->
        permissionsDelegate.requireSystemPermissions(false)
        expoCalendarEvent.getAttendees()
      }

      Function("getOccurrence") { expoCalendarEvent: ExpoCalendarEvent, options: RecurringEventOptions? ->
        permissionsDelegate.requireSystemPermissions(false)
        expoCalendarEvent.getOccurrence(options)
      }

      AsyncFunction("update") Coroutine { expoCalendarEvent: ExpoCalendarEvent, eventRecord: EventRecord, nullableFields: List<String> ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarEvent.saveEvent(eventRecord, nullableFields = nullableFields)
        expoCalendarEvent.reloadEvent()
      }

      AsyncFunction("delete") Coroutine { expoCalendarEvent: ExpoCalendarEvent ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarEvent.deleteEvent()
      }
    }

    Class(ExpoCalendarAttendee::class) {
      Constructor { id: String ->
        ExpoCalendarAttendee(appContext)
      }

      Property("id") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.id
      }

      Property("name") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.name
      }

      Property("role") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.role?.value
      }

      Property("status") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.status?.value
      }

      Property("type") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.type?.value
      }

      Property("email") { expoCalendarAttendee: ExpoCalendarAttendee ->
        expoCalendarAttendee.attendeeRecord?.email
      }

      AsyncFunction("update") Coroutine { expoCalendarAttendee: ExpoCalendarAttendee, attendeeRecord: AttendeeRecord, nullableFields: List<String> ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarAttendee.saveAttendee(attendeeRecord, nullableFields = nullableFields)
        expoCalendarAttendee.reloadAttendee()
      }

      AsyncFunction("delete") Coroutine { expoCalendarAttendee: ExpoCalendarAttendee ->
        permissionsDelegate.requireSystemPermissions(true)
        expoCalendarAttendee.deleteAttendee()
      }
    }

    Class(ExpoCalendarReminder::class) {
      Constructor { id: String ->
        ExpoCalendarReminder(id)
      }
    }
  }
}
