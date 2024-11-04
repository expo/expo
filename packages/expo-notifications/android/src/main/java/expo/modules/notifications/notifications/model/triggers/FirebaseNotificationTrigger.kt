package expo.modules.notifications.notifications.model.triggers

import android.os.Build
import android.os.Bundle
import android.os.Parcel
import android.os.Parcelable
import androidx.annotation.RequiresApi
import androidx.core.os.bundleOf
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.RemoteMessageSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger

/**
 * A trigger representing an incoming remote Firebase notification.
 */
class FirebaseNotificationTrigger(val remoteMessage: RemoteMessage) : NotificationTrigger {

  private constructor(parcel: Parcel) : this(
    parcel.readParcelable(FirebaseNotificationTrigger::class.java.classLoader)
      ?: throw IllegalArgumentException("RemoteMessage from readParcelable must not be null")
  )

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getNotificationChannel(): String? {
    val channelId = remoteMessage.notification?.channelId ?: remoteMessage.data["channelId"]
    return channelId ?: super.getNotificationChannel()
  }

  override fun toBundle(): Bundle {
    return bundleOf(
      "type" to "push",
      "remoteMessage" to RemoteMessageSerializer.toBundle(remoteMessage)
    )
  }

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    dest.writeParcelable(remoteMessage, 0)
  }

  companion object {
    @JvmField
    val CREATOR = object : Parcelable.Creator<FirebaseNotificationTrigger> {
      override fun createFromParcel(parcel: Parcel) = FirebaseNotificationTrigger(parcel)
      override fun newArray(size: Int) = arrayOfNulls<FirebaseNotificationTrigger>(size)
    }
  }
}
