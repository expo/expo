package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import java.util.Date;

/**
 * A class representing a single notification. Origin date ({@link #mOriginDate}) is time when it was sent (remote) or when it was posted (local).
 */
public class Notification implements Parcelable {
  private NotificationRequest mRequest;
  private Date mOriginDate;

  public Notification(NotificationRequest request) {
    this(request, new Date());
  }

  public Notification(NotificationRequest request, Date date) {
    mRequest = request;
    mOriginDate = date;
  }

  protected Notification(Parcel in) {
    mRequest = in.readParcelable(getClass().getClassLoader());
    mOriginDate = new Date(in.readLong());
  }

  public Date getOriginDate() {
    return mOriginDate;
  }

  public NotificationRequest getNotificationRequest() {
    return mRequest;
  }

  public static final Creator<Notification> CREATOR = new Creator<Notification>() {
    @Override
    public Notification createFromParcel(Parcel in) {
      return new Notification(in);
    }

    @Override
    public Notification[] newArray(int size) {
      return new Notification[size];
    }
  };

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeParcelable(mRequest, 0);
    dest.writeLong(mOriginDate.getTime());
  }
}
