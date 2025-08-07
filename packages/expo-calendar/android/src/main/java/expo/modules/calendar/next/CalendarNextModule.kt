package expo.modules.calendar.next

import expo.modules.calendar.dialogs.CreateEventContract
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.dialogs.CreatedEventOptions
import expo.modules.calendar.dialogs.ViewEventIntentResult
import expo.modules.calendar.dialogs.ViewEventContract
import expo.modules.calendar.dialogs.ViewedEventOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel

class CalendarNextModule : Module() {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)
  private val contentResolver
    get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  private lateinit var createEventLauncher: AppContextActivityResultLauncher<CreatedEventOptions, CreateEventIntentResult>
  private lateinit var viewEventLauncher: AppContextActivityResultLauncher<ViewedEventOptions, ViewEventIntentResult>

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

    AsyncFunction("getCalendars") { type: String?, promise: Promise ->
      try {
        promise.resolve(intArrayOf(123))
      } catch (e: Exception) {
        promise.reject("E_CALENDARS_NOT_FOUND", "Calendars could not be found", e)
      }
    }

  }
}
