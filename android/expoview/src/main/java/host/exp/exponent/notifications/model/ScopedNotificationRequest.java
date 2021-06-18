package host.exp.exponent.notifications.model;

import android.os.Parcel;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import host.exp.exponent.kernel.ExperienceKey;

public class ScopedNotificationRequest extends NotificationRequest {
  // We store String instead of ExperienceKey because ScopedNotificationRequest must be serializable.
  private String mExperienceScopeKeyString;

  public ScopedNotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger, @Nullable String experienceScopeKey) {
    super(identifier, content, trigger);
    mExperienceScopeKeyString = experienceScopeKey;
  }

  private ScopedNotificationRequest(Parcel in) {
    super(in);
    mExperienceScopeKeyString = in.readString();
  }

  public boolean checkIfBelongsToExperience(@Nullable ExperienceKey experienceKey) {
    if (mExperienceScopeKeyString == null) {
      return true;
    }
    return mExperienceScopeKeyString.equals(experienceKey.getScopeKey());
  }

  public static final Creator<ScopedNotificationRequest> CREATOR = new Creator<ScopedNotificationRequest>() {
    public ScopedNotificationRequest createFromParcel(Parcel in) {
      return new ScopedNotificationRequest(in);
    }

    public ScopedNotificationRequest[] newArray(int size) {
      return new ScopedNotificationRequest[size];
    }
  };

  @Nullable
  public String getExperienceScopeKeyString() {
    return mExperienceScopeKeyString;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeString(mExperienceScopeKeyString);
  }
}
