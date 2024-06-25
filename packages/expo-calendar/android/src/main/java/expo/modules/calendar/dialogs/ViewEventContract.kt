package expo.modules.calendar.dialogs

import android.app.Activity
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract

internal class ViewEventContract : AppContextActivityResultContract<ViewedEventOptions, EventIntentResult> {

  override fun createIntent(context: Context, input: ViewedEventOptions): Intent {
    val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, input.id.toLong())
    val sendIntent = Intent(Intent.ACTION_VIEW).apply {
      data = uri
      input.startNewActivityTask?.takeIf { boolean -> boolean }?.let { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
    }
    return sendIntent
  }

  override fun parseResult(input: ViewedEventOptions, resultCode: Int, intent: Intent?): EventIntentResult =
    when (resultCode) {
      Activity.RESULT_CANCELED -> {
        EventIntentResult(action = "canceled")
      }
      Activity.RESULT_OK -> {
        EventIntentResult(action = "done")
      }
      else -> {
        EventIntentResult(action = "unknown")
      }
    }
}