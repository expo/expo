package expo.modules.notifications.notifications.model

import android.app.PendingIntent
import androidx.core.app.NotificationCompat
import androidx.core.app.RemoteInput
import expo.modules.notifications.service.NotificationsService
import kotlinx.parcelize.Parcelize

/**
 * A class representing a single direct reply notification action.
 */
@Parcelize
class TextInputNotificationAction(override val identifier: String, override val title: String,
                                  override val opensAppToForeground: Boolean, val placeholder: String) : NotificationAction(identifier, title, opensAppToForeground) {

  override fun toNativeAction(intent: PendingIntent, icon: Int): NotificationCompat.Action {
    val remoteInput = RemoteInput.Builder(NotificationsService.USER_TEXT_RESPONSE_KEY)
      .setLabel(placeholder)
      .build()

    return NotificationCompat.Action.Builder(icon, title, intent)
      .addRemoteInput(remoteInput).build()
  }
}
