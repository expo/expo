package expo.modules.calendar.dialogs

import android.content.Context
import android.content.Intent
import android.content.Intent.ACTION_INSERT
import android.provider.CalendarContract
import android.provider.CalendarContract.EXTRA_EVENT_ALL_DAY
import android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME
import android.provider.CalendarContract.EXTRA_EVENT_END_TIME
import expo.modules.calendar.EventRecurrenceUtils.createRecurrenceRule
import expo.modules.calendar.EventRecurrenceUtils.dateFormat
import expo.modules.calendar.EventRecurrenceUtils.extractRecurrence
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.kotlin.activityresult.AppContextActivityResultContract

internal class CreateEventContract : AppContextActivityResultContract<CreatedEventOptions, CreateEventIntentResult> {

  override fun createIntent(context: Context, input: CreatedEventOptions): Intent =
    Intent(ACTION_INSERT)
      .setData(CalendarContract.Events.CONTENT_URI)
      .apply {
        input.title?.let { putExtra(CalendarContract.Events.TITLE, it) }
        input.allDay?.let { putExtra(EXTRA_EVENT_ALL_DAY, it) }
        input.notes?.let { putExtra(CalendarContract.Events.DESCRIPTION, it) }
        input.location?.let { putExtra(CalendarContract.Events.EVENT_LOCATION, it) }
        input.startDate?.let {
          putExtra(EXTRA_EVENT_BEGIN_TIME, getTimestamp(it))
        }
        input.endDate?.let {
          val timestamp = getTimestamp(it)
          putExtra(EXTRA_EVENT_END_TIME, timestamp)
        }
        input.timeZone?.let {
          putExtra(CalendarContract.Events.EVENT_TIMEZONE, it)
        }
        input.availability?.let {
          val value = availabilityConstantMatchingString(it)
          putExtra(CalendarContract.Events.AVAILABILITY, value)
        }
        input.recurrenceRule?.let {
          val rule = createRecurrenceRule(extractRecurrence(it))
          putExtra(CalendarContract.Events.RRULE, rule)
        }
        input.startNewActivityTask.takeIf { it }?.let { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      }

  private fun getTimestamp(it: String): Long {
    val maybeTimestamp = dateFormat.parse(it)?.time
    return maybeTimestamp ?: throw IllegalArgumentException("Invalid date format")
  }

  override fun parseResult(input: CreatedEventOptions, resultCode: Int, intent: Intent?): CreateEventIntentResult =
    // we return the same result for all cases because on Android, there's no reliable way to tell
    // what the user really did. Even saving or deleting an event and then pressing "back" to get back to the app
    // will report `Activity.RESULT_CANCELED` even though the user made an event modification.
    CreateEventIntentResult()
}
