package expo.modules.notifications.notifications.model.triggers;

import android.os.Build;
import android.os.Parcel;

import com.google.firebase.messaging.RemoteMessage;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;

/**
 * A trigger representing an incoming remote Firebase notification.
 */
public class FirebaseNotificationTrigger implements NotificationTrigger {
  private RemoteMessage mRemoteMessage;

  public FirebaseNotificationTrigger(RemoteMessage remoteMessage) {
    mRemoteMessage = remoteMessage;
  }

  private FirebaseNotificationTrigger(Parcel in) {
    mRemoteMessage = in.readParcelable(getClass().getClassLoader());
  }

  public RemoteMessage getRemoteMessage() {
    return mRemoteMessage;
  }

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeParcelable(mRemoteMessage, 0);
  }

  public static final Creator<FirebaseNotificationTrigger> CREATOR = new Creator<FirebaseNotificationTrigger>() {
    @Override
    public FirebaseNotificationTrigger createFromParcel(Parcel in) {
      return new FirebaseNotificationTrigger(in);
    }

    @Override
    public FirebaseNotificationTrigger[] newArray(int size) {
      return new FirebaseNotificationTrigger[size];
    }
  };

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public String getNotificationChannel() {
    if (getRemoteMessage().getData().containsKey("channelId")) {
      return getRemoteMessage().getData().get("channelId");
    }
    return NotificationTrigger.super.getNotificationChannel();
  }
}
