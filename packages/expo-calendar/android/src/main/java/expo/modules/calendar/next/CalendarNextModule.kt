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
import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.calendar.findCalendarsQueryParameters
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.CalendarAccessLevel
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
import expo.modules.interfaces.permissions.Permissions
import kotlinx.coroutines.cancel

class CalendarNextModule : Module() {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)
  private val contentResolver
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

    AsyncFunction("createCalendarNext") { calendarRecord: CalendarRecord, promise: Promise ->
      withPermissions(promise) {
        launchAsyncWithModuleScope(promise) {
          try {
            val calendarId = ExpoCalendar.saveCalendar(calendarRecord, appContext)
            val newCalendarRecord = calendarRecord.copy(id = calendarId.toString())
            val newCalendar = ExpoCalendar(newCalendarRecord)
            promise.resolve(newCalendar)
          } catch (e: Exception) {
            promise.reject("E_CALENDAR_CREATION_FAILED", "Failed to create calendar", e)
          }
        }
      }
    }

    Class(ExpoCalendar::class) {
      Constructor { calendarRecord: CalendarRecord ->
        ExpoCalendar(calendarRecord)
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

      AsyncFunction("listEvents") { expoCalendar: ExpoCalendar, startDate: Any, endDate: Any, promise: Promise ->
        withPermissions(promise) {
          launchAsyncWithModuleScope(promise) {
            if (expoCalendar.calendarRecord?.id == null) {
              throw Exception("Calendar id is null")
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
        ExpoCalendarEvent(id)
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

      Property("availability") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.availability
      }

      Property("organizerEmail") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.organizerEmail
      }

      Property("timeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.timeZone
      }

      Property("endTimeZone") { expoCalendarEvent: ExpoCalendarEvent ->
        expoCalendarEvent.endTimeZone
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
    }

    Class(ExpoCalendarAttendee::class) {
      Constructor { id: String ->
        ExpoCalendarAttendee(id)
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
      results.add(ExpoCalendar(cursor))
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

  private inline fun withPermissions(promise: Promise, block: () -> Unit) {
    if (!checkPermissions(promise)) {
      return
    }
    block()
  }
}
