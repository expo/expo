package expo.modules.notifications.notifications.model

import android.app.PendingIntent
import android.os.Parcelable
import androidx.core.app.NotificationCompat
import kotlinx.parcelize.Parcelize
import java.io.Serializable

/**
 * A class representing a single notification action button.
 */
@Parcelize
open class NotificationAction(open val identifier: String, open val title: String?, open val opensAppToForeground: Boolean) : Parcelable, Serializable {
  open fun toNativeAction(intent: PendingIntent, icon: Int): NotificationCompat.Action {
    return NotificationCompat.Action.Builder(icon, title, intent).build()
  }
}
