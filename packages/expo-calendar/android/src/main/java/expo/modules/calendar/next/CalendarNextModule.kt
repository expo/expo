package expo.modules.calendar.next

import android.Manifest
import android.content.ContentValues
import android.database.Cursor
import android.provider.CalendarContract
import android.text.TextUtils
import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.calendar.ModuleDestroyedException
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.calendar.findCalendarsQueryParameters
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.ExpoCalendarEvent
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.cancel
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.interfaces.permissions.Permissions
import kotlinx.coroutines.cancel

class CalendarNextModule : Module() {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)
  public val contentResolver
    get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  private lateinit var createEventLauncher: AppContextActivityResultLauncher<CreatedEventOptions, CreateEventIntentResult>
  private lateinit var viewEventLauncher: AppContextActivityResultLauncher<ViewedEventOptions, ViewEventIntentResult>

  @OptIn(EitherType::class)
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

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }

    AsyncFunction("getCalendars") { type: String?, promise: Promise ->
      withPermissions(promise) {
        if (type != null && type == "reminder") {
          promise.reject("E_CALENDARS_NOT_FOUND", "Calendars of type `reminder` are not supported on Android", null)
          return@withPermissions
        }
        launchAsyncWithModuleScope(promise) {
          try {
            val expoCalendars = findExpoCalendars()
            promise.resolve(expoCalendars)
          } catch (e: Exception) {
            promise.reject("E_CALENDARS_NOT_FOUND", "Calendars could not be found", e)
          }
        }
      }
    }

    AsyncFunction("requestCalendarPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
    }

    AsyncFunction("listEvents") { calendarIds: List<String>, startDate: String, endDate: String, promise: Promise ->
      withPermissions(promise) {
        launchAsyncWithModuleScope(promise) {
          try {
            val allEvents = mutableListOf<ExpoCalendarEvent>()
            val cursor = CalendarUtils.findEvents(contentResolver, startDate, endDate, calendarIds)
            cursor.use {
              while (it.moveToNext()) {
                val event = ExpoCalendarEvent(appContext, it)
                allEvents.add(event)
              }
            }
            promise.resolve(allEvents)
          } catch (e: Exception) {
            promise.reject("E_EVENTS_NOT_FOUND", "Events could not be found", e)
          }
        }
      }
    }

    AsyncFunction("createCalendarNext") { calendarRecord: CalendarRecord, promise: Promise ->
      withPermissions(promise) {
        launchAsyncWithModuleScope(promise) {
          try {
            val calendarId = ExpoCalendar.saveCalendar(calendarRecord, appContext)
            val newCalendarRecord = calendarRecord.copy(id = calendarId.toString())
            val newCalendar = ExpoCalendar(appContext, newCalendarRecord)
            promise.resolve(newCalendar)
          } catch (e: Exception) {
            promise.reject("E_CALENDAR_CREATION_FAILED", "Failed to create calendar", e)
          }
        }
      }
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

      AsyncFunction("listEvents") { expoCalendar: ExpoCalendar, startDate: String, endDate: String, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            if (expoCalendar.calendarRecord?.id == null) {
              promise.reject("E_EVENTS_NOT_FOUND", "Calendar doesn't exist", Exception())
            }
            try {
              val expoCalendarEvents = expoCalendar.getEvents(startDate, endDate)
              promise.resolve(expoCalendarEvents)
            } catch (e: Exception) {
              promise.reject("E_EVENTS_NOT_FOUND", "Events could not be found", e)
            }
          }
        }
      }

      AsyncFunction("createEvent") { expoCalendar: ExpoCalendar, record: EventRecord, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val expoCalendarEvent = expoCalendar.createEvent(record)
              promise.resolve(expoCalendarEvent)
            } catch (e: Exception) {
              promise.reject("E_EVENT_NOT_CREATED", "Event could not be created", e)
            }
          }
        }
      }

      AsyncFunction("update") { expoCalendar: ExpoCalendar, details: CalendarRecord, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val updatedRecord = expoCalendar.calendarRecord?.getUpdatedRecord(details)
                ?: throw Exception("Calendar record is null")
              println("UPDATED_RECORD: ${updatedRecord.title}")
              ExpoCalendar.updateCalendar(updatedRecord, appContext, isNew = false)
              expoCalendar.calendarRecord = updatedRecord
              promise.resolve(null)
            } catch (e: Exception) {
              promise.reject("E_CALENDAR_UPDATE_FAILED", "Failed to update calendar", e)
            }
          }
        }
      }

      AsyncFunction("delete") { expoCalendar: ExpoCalendar, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val successful = expoCalendar.deleteCalendar()
              if (successful) {
                promise.resolve(null)
              } else {
                promise.reject("E_CALENDAR_NOT_DELETED", "Calendar could not be deleted", null)
              }
            } catch (e: Exception) {
              promise.reject("E_CALENDAR_NOT_DELETED", "An error occurred while deleting calendar", e)
            }
          }
        }
      }
    }

    Class(ExpoCalendarEvent::class) {
      Constructor { id: String ->
        ExpoCalendarEvent(appContext)
      }

      AsyncFunction("createAttendee") { expoCalendarEvent: ExpoCalendarEvent, record: AttendeeRecord, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val attendee = expoCalendarEvent.createAttendee(record)
              promise.resolve(attendee)
            } catch (e: Exception) {
              promise.reject("E_ATTENDEE_NOT_CREATED", "Attendee could not be created", e)
            }
          }
        }
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

      AsyncFunction("openInCalendarAsync") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions ->
        val eventId = expoCalendarEvent.eventRecord?.id;
        if (eventId == null) {
          throw Exception("Event id is null")
        }
        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams.startNewActivityTask
        )
        val result = viewEventLauncher.launch(params)
        return@Coroutine result
      }

      AsyncFunction("editInCalendarAsync") Coroutine { expoCalendarEvent: ExpoCalendarEvent, rawParams: ViewedEventOptions? ->
        val eventId = expoCalendarEvent.eventRecord?.id;
        if (eventId == null) {
          throw Exception("Event id is null")
        }
        val params = ViewedEventOptions(
          id = eventId,
          startNewActivityTask = rawParams?.startNewActivityTask ?: true
        )
        viewEventLauncher.launch(params)
        val editResult = CreateEventIntentResult()
        return@Coroutine editResult
      }

      AsyncFunction("getAttendees") { expoCalendarEvent: ExpoCalendarEvent, _: RecurringEventOptions, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val attendees = expoCalendarEvent.getAttendees()
              promise.resolve(attendees)
            } catch (e: Exception) {
              promise.reject("E_ATTENDEES_NOT_FOUND", "Attendees could not be found", e)
            }
          }
        }
      }

      AsyncFunction("update") { expoCalendarEvent: ExpoCalendarEvent, eventRecord: EventRecord, _: Any, nullableFields: List<String>, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val updatedRecord = expoCalendarEvent.eventRecord?.getUpdatedRecord(eventRecord, nullableFields)
                ?: throw Exception("Event record is null")
              expoCalendarEvent.saveEvent(updatedRecord)
              expoCalendarEvent.eventRecord = updatedRecord
              promise.resolve(null)
            } catch (e: Exception) {
              promise.reject("E_EVENT_UPDATE_FAILED", "Failed to update event", e)
            }
          }
        }
      }

      Function("delete") { expoCalendarEvent: ExpoCalendarEvent, recurringEventOptions: RecurringEventOptions ->
        withPermissions {
          try {
            expoCalendarEvent.deleteEvent(recurringEventOptions)
          } catch (e: Exception) {
            throw Exception("Event could not be deleted", e)
          }
        }
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

      AsyncFunction("update") { expoCalendarAttendee: ExpoCalendarAttendee, attendeeRecord: AttendeeRecord, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val updatedRecord = expoCalendarAttendee.attendeeRecord?.getUpdatedRecord(attendeeRecord, emptyList())
              if (updatedRecord == null) {
                throw Exception("Event record is null")
              }
              expoCalendarAttendee.saveAttendee(updatedRecord)
              expoCalendarAttendee.attendeeRecord = updatedRecord
              promise.resolve()
            } catch (e: Exception) {
              promise.reject("E_ATTENDEE_NOT_UPDATED", "Attendee could not be updated", e)
            }
          }
        }
      }

      AsyncFunction("delete") { expoCalendarAttendee: ExpoCalendarAttendee, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            try {
              val successful = expoCalendarAttendee.deleteAttendee()
              if (successful) {
                promise.resolve(null)
              } else {
                promise.reject("E_ATTENDEE_NOT_DELETED", "Attendee could not be deleted", null)
              }
            } catch (e: Exception) {
              promise.reject("E_ATTENDEE_NOT_DELETED", "An error occurred while deleting attendee", e)
            }
          }
        }
      }
    }

    Class(ExpoCalendarReminder::class) {
      Constructor { id: String ->
        ExpoCalendarReminder(id)
      }
    }
  }

  @Throws(SecurityException::class)
  private fun findExpoCalendars(): List<ExpoCalendar> {
    val uri = CalendarContract.Calendars.CONTENT_URI
    val cursor = contentResolver.query(uri, findCalendarsQueryParameters, null, null, null)
    requireNotNull(cursor) { "Cursor shouldn't be null" }
    return cursor.use(::serializeExpoCalendars)
  }

  private fun serializeExpoCalendars(cursor: Cursor): List<ExpoCalendar> {
    val results: MutableList<ExpoCalendar> = ArrayList()
    while (cursor.moveToNext()) {
      results.add(ExpoCalendar(appContext, cursor))
    }
    return results
  }

  private inline fun launchAsyncWithModuleScope(promise: Promise, crossinline block: () -> Unit) {
    moduleCoroutineScope.launch {
      try {
        block()
      } catch (e: ModuleDestroyedException) {
        promise.reject("E_CALENDAR_MODULE_DESTROYED", "Module destroyed, promise canceled", null)
      }
    }
  }

  private fun checkPermissions(promise: Promise): Boolean {
    if (appContext.permissions?.hasGrantedPermissions(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR) != true) {
      promise.reject("E_MISSING_PERMISSIONS", "CALENDAR permission is required to do this operation.", null)
      return false
    }
    return true
  }

  private fun checkPermissions(): Boolean {
    return appContext.permissions?.hasGrantedPermissions(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR) == true
  }

  private inline fun withPermissions(promise: Promise, block: () -> Unit) {
    if (!checkPermissions(promise)) {
      return
    }
    block()
  }

  private inline fun withPermissions(block: () -> Unit) {
    if (!checkPermissions()) {
      return
    }
    block()
  }
}
