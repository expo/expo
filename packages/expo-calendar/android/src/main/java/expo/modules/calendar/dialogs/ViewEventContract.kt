package expo.modules.calendar.dialogs

import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract

internal class ViewEventContract : AppContextActivityResultContract<ViewedEventOptions, ViewEventIntentResult> {

  override fun createIntent(context: Context, input: ViewedEventOptions): Intent {
    val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, input.id.toLong())
    val sendIntent = Intent(Intent.ACTION_VIEW).apply {
      data = uri
      input.startNewActivityTask.takeIf { it }?.let { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
    }
    return sendIntent
  }

  override fun parseResult(input: ViewedEventOptions, resultCode: Int, intent: Intent?): ViewEventIntentResult =
    // we return the same result for all cases because on Android, there's no reliable way to tell
    // what the user really did. Even saving or deleting an event and then pressing "back" to get back to the app
    // will report `Activity.RESULT_CANCELED` even though the user made an event modification.
    ViewEventIntentResult()
}
