package expo.modules.location.next.locationForegroundService

import android.content.Context
import androidx.core.content.edit
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class BackgroundSessionOptions(
  @Field val notificationTitle: String? = null,
  @Field val notificationBody: String? = null,
  @Field val notificationColor: Int? = null,
  @Field val stopOnTaskRemoved: Boolean = false
) : Record {
  companion object {
    private const val PREFERENCES_NAME = "expo.modules.location.next.backgroundSession"
    private const val KEY_REQUESTED = "requested"
    private const val KEY_TITLE = "notificationTitle"
    private const val KEY_BODY = "notificationBody"
    private const val KEY_COLOR = "notificationColor"
    private const val KEY_STOP_ON_TASK_REMOVED = "stopOnTaskRemoved"

    private fun preferences(context: Context) =
      context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun persist(context: Context, options: BackgroundSessionOptions) {
      preferences(context).edit {
        putBoolean(KEY_REQUESTED, true)
        putString(KEY_TITLE, options.notificationTitle)
        putString(KEY_BODY, options.notificationBody)
        if (options.notificationColor != null) {
          putInt(KEY_COLOR, options.notificationColor)
        } else {
          remove(KEY_COLOR)
        }
        putBoolean(KEY_STOP_ON_TASK_REMOVED, options.stopOnTaskRemoved)
      }
    }

    fun clearPersisted(context: Context) {
      preferences(context).edit { clear() }
    }

    fun readPersisted(context: Context): BackgroundSessionOptions? {
      val preferences = preferences(context)
      if (!preferences.getBoolean(KEY_REQUESTED, false)) {
        return null
      }
      return BackgroundSessionOptions(
        notificationTitle = preferences.getString(KEY_TITLE, null),
        notificationBody = preferences.getString(KEY_BODY, null),
        notificationColor = if (preferences.contains(KEY_COLOR)) {
          preferences.getInt(KEY_COLOR, 0)
        } else {
          null
        },
        stopOnTaskRemoved = preferences.getBoolean(KEY_STOP_ON_TASK_REMOVED, false)
      )
    }
  }
}
