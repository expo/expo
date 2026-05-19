package expo.modules.calendar.next

import android.content.Context
import android.content.Intent
import android.content.Intent.ACTION_INSERT
import android.provider.CalendarContract
import android.provider.CalendarContract.EXTRA_EVENT_ALL_DAY
import android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME
import android.provider.CalendarContract.EXTRA_EVENT_END_TIME
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.dialogs.CreateEventIntentResult
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.records.AddEventWithFormOptionsRecord
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

internal class AddEventWithFormContract(private val eventMapper: EventMapper) :
  AppContextActivityResultContract<AddEventWithFormContract.Input, CreateEventIntentResult> {
  data class Input(
    val calendarId: String,
    val options: AddEventWithFormOptionsRecord
  ) : Serializable

  override fun createIntent(context: Context, input: Input): Intent =
    Intent(ACTION_INSERT)
      .setData(CalendarContract.Events.CONTENT_URI)
      .apply {
        input.calendarId.toLongOrNull()?.let {
          putExtra(CalendarContract.Events.CALENDAR_ID, it)
        }
        input.options.title?.let { putExtra(CalendarContract.Events.TITLE, it) }
        input.options.allDay?.let { putExtra(EXTRA_EVENT_ALL_DAY, it) }
        input.options.notes?.let { putExtra(CalendarContract.Events.DESCRIPTION, it) }
        input.options.location?.let { putExtra(CalendarContract.Events.EVENT_LOCATION, it) }
        input.options.startDate?.let {
          putExtra(EXTRA_EVENT_BEGIN_TIME, getTimestamp(it))
        }
        input.options.endDate?.let {
          putExtra(EXTRA_EVENT_END_TIME, getTimestamp(it))
        }
        input.options.timeZone?.let {
          putExtra(CalendarContract.Events.EVENT_TIMEZONE, it)
        }
        input.options.availability?.let {
          putExtra(CalendarContract.Events.AVAILABILITY, with(eventMapper) { it.toDomain().value })
        }
        input.options.recurrenceRule?.let {
          with(eventMapper) {
            it.toDomain().toRuleString()
          }
        }?.let {
          putExtra(CalendarContract.Events.RRULE, it)
        }
        input.options.startNewActivityTask.takeIf { it }?.let {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      }

  private fun getTimestamp(value: String): Long {
    val maybeTimestamp = CalendarUtils.sdf.parse(value)?.time
    return maybeTimestamp ?: throw IllegalArgumentException("Invalid date format")
  }

  override fun parseResult(input: Input, resultCode: Int, intent: Intent?): CreateEventIntentResult =
    CreateEventIntentResult()
}
