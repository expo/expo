package host.exp.exponent.notifications.model

import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import android.os.Parcel
import host.exp.exponent.kernel.ExperienceKey
import android.os.Parcelable
import expo.modules.notifications.notifications.interfaces.INotificationContent

class ScopedNotificationRequest : NotificationRequest {
  // We store String instead of ExperienceKey because ScopedNotificationRequest must be serializable.
  val experienceScopeKeyString: String?

  constructor(
    identifier: String,
    content: INotificationContent,
    trigger: NotificationTrigger?,
    experienceScopeKey: String?
  ) : super(identifier, content, trigger) {
    experienceScopeKeyString = experienceScopeKey
  }

  private constructor(parcel: Parcel) : super(parcel) {
    experienceScopeKeyString = parcel.readString()
  }

  fun checkIfBelongsToExperience(experienceKey: ExperienceKey): Boolean {
    return if (experienceScopeKeyString == null) {
      true
    } else {
      experienceScopeKeyString == experienceKey.scopeKey
    }
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeString(experienceScopeKeyString)
  }

  companion object CREATOR : Parcelable.Creator<ScopedNotificationRequest> {
    override fun createFromParcel(parcel: Parcel): ScopedNotificationRequest {
      return ScopedNotificationRequest(parcel)
    }

    override fun newArray(size: Int): Array<ScopedNotificationRequest?> {
      return arrayOfNulls(size)
    }
  }
}
