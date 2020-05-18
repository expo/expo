package versioned.host.exp.exponent.modules.universal.notifications;

import android.os.Parcel;
import android.os.Parcelable;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationRequest extends NotificationRequest {
  // We store String instead of ExperienceId, cause ScopedNotificationRequest must be serializable.
  private String mExperienceIdString;

  public ScopedNotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger, @Nullable ExperienceId experienceId) {
    super(identifier, content, trigger);
    if (experienceId == null) {
      mExperienceIdString = null;
    } else {
      mExperienceIdString = experienceId.get();
    }
  }

  private ScopedNotificationRequest(Parcel in) {
    super(in);
    mExperienceIdString = in.readString();
  }

  boolean checkIfBelongsToExperience(@Nonnull ExperienceId experienceId) {
    if (mExperienceIdString == null) {
      return true;
    }
    return mExperienceIdString.equals(experienceId.get());
  }

  public static final Parcelable.Creator CREATOR = new Parcelable.Creator() {
    public ScopedNotificationRequest createFromParcel(Parcel in) {
      return new ScopedNotificationRequest(in);
    }

    public ScopedNotificationRequest[] newArray(int size) {
      return new ScopedNotificationRequest[size];
    }
  };

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeString(mExperienceIdString);
  }
}
