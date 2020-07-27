package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.io.Serializable;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;

public class ChannelAwareTrigger implements NotificationTrigger, Serializable {
  @Nullable
  private String mChannelId;

  public ChannelAwareTrigger(@Nullable String channelId) {
    mChannelId = channelId;
  }

  public ChannelAwareTrigger(Parcel in) {
    mChannelId = in.readString();
  }

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel parcel, int i) {
    parcel.writeString(mChannelId);
  }

  @Nullable
  @Override
  public String getNotificationChannel() {
    return mChannelId;
  }

  public static final Creator<ChannelAwareTrigger> CREATOR = new Creator<ChannelAwareTrigger>() {
    @Override
    public ChannelAwareTrigger createFromParcel(Parcel in) {
      return new ChannelAwareTrigger(in);
    }

    @Override
    public ChannelAwareTrigger[] newArray(int size) {
      return new ChannelAwareTrigger[size];
    }
  };
}
