package expo.modules.notifications.notifications.model;

import static expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder.META_DATA_LARGE_ICON_KEY;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Parcel;
import android.os.Parcelable;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.ObjectStreamException;
import java.io.Serializable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.interfaces.INotificationContent;
import kotlin.coroutines.Continuation;

/**
 * A POJO representing a local notification content: title, message, body, etc. Instances
 * should be created using {@link NotificationContent.Builder}.
 *
 * Note that it implements {@link Serializable} interfaces to store the object in the SharedPreferences.
 * Refactoring this class may require a migration strategy for the data stored in SharedPreferences.
 */
public class NotificationContent implements Parcelable, Serializable, INotificationContent {
  private String mTitle;
  private String mText;
  private String mSubtitle;
  private Number mBadgeCount;
  private boolean mShouldPlayDefaultSound;
  private Uri mSound;
  private boolean mShouldUseDefaultVibrationPattern;
  private long[] mVibrationPattern;
  private JSONObject mBody;
  private NotificationPriority mPriority;
  private Number mColor;
  private boolean mAutoDismiss;
  private String mCategoryId;
  private boolean mSticky;

  protected NotificationContent() {
  }

  public static final Creator<NotificationContent> CREATOR = new Creator<NotificationContent>() {
    @Override
    public NotificationContent createFromParcel(Parcel in) {
      return new NotificationContent(in);
    }

    @Override
    public NotificationContent[] newArray(int size) {
      return new NotificationContent[size];
    }
  };

  @Nullable
  public String getTitle() {
    return mTitle;
  }

  @Nullable
  public String getText() {
    return mText;
  }

  @Nullable
  public String getSubText() {
    return mSubtitle;
  }

  @Nullable
  public Number getBadgeCount() {
    return mBadgeCount;
  }

  @Override
  public boolean getShouldPlayDefaultSound() {
    return mShouldPlayDefaultSound;
  }

  @Override
  public boolean getShouldUseDefaultVibrationPattern() {
    return mShouldUseDefaultVibrationPattern;
  }

  @Nullable
  public String getSoundName() {
    return mSound != null ? mSound.getLastPathSegment() : null;
  }

  @Nullable
  @Override
  public Object getImage(@NonNull Context context, @NonNull Continuation<? super Bitmap> $completion) {
    try {
      ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
      if (ai.metaData.containsKey(META_DATA_LARGE_ICON_KEY)) {
        int resourceId = ai.metaData.getInt(META_DATA_LARGE_ICON_KEY);
        return BitmapFactory.decodeResource(context.getResources(), resourceId);
      }
    } catch (PackageManager.NameNotFoundException | ClassCastException e) {
      Log.e("expo-notifications", "Could not have fetched large notification icon.", e);
    }
    return null;
  }

  @Override
  public boolean containsImage() {
    return true;
  }

  @Nullable
  public long[] getVibrationPattern() {
    return mVibrationPattern;
  }

  @Nullable
  public JSONObject getBody() {
    return mBody;
  }

  @Nullable
  public NotificationPriority getPriority() {
    return mPriority;
  }

  @Nullable
  public Number getColor() {
    return mColor;
  }

  public boolean isAutoDismiss() {
    return mAutoDismiss;
  }

  public String getCategoryId() {
    return mCategoryId;
  }
  
  public boolean isSticky() {
    return mSticky;
  }

  @Override
  public int describeContents() {
    return 0;
  }

  protected NotificationContent(Parcel in) {
    mTitle = in.readString();
    mText = in.readString();
    mSubtitle = in.readString();
    mBadgeCount = (Number) in.readSerializable();
    mShouldPlayDefaultSound = in.readByte() != 0;
    mSound = in.readParcelable(getClass().getClassLoader());
    mShouldUseDefaultVibrationPattern = in.readByte() != 0;
    mVibrationPattern = in.createLongArray();
    try {
      mBody = new JSONObject(in.readString());
    } catch (JSONException | NullPointerException e) {
      // do nothing
    }
    Number priorityNumber = (Number) in.readSerializable();
    if (priorityNumber != null) {
      mPriority = NotificationPriority.fromNativeValue(priorityNumber.intValue());
    }
    mColor = (Number) in.readSerializable();
    mAutoDismiss = in.readByte() == 1;
    mCategoryId = in.readString();
    mSticky = in.readByte() == 1;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mTitle);
    dest.writeString(mText);
    dest.writeString(mSubtitle);
    dest.writeSerializable(mBadgeCount);
    dest.writeByte((byte) (mShouldPlayDefaultSound ? 1 : 0));
    dest.writeParcelable(mSound, 0);
    dest.writeByte((byte) (mShouldUseDefaultVibrationPattern ? 1 : 0));
    dest.writeLongArray(mVibrationPattern);
    dest.writeString(mBody != null ? mBody.toString() : null);
    dest.writeSerializable(mPriority != null ? mPriority.getNativeValue() : null);
    dest.writeSerializable(mColor);
    dest.writeByte((byte) (mAutoDismiss ? 1 : 0));
    dest.writeString(mCategoryId);
    dest.writeByte((byte) (mSticky ? 1 : 0));
  }

  //                                           EXPONOTIFCONTENT02
  private static final long serialVersionUID = 397666843266836802L;

  private void writeObject(java.io.ObjectOutputStream out) throws IOException {
    out.writeObject(mTitle);
    out.writeObject(mText);
    out.writeObject(mSubtitle);
    out.writeObject(mBadgeCount);
    out.writeByte(mShouldPlayDefaultSound ? 1 : 0);
    out.writeObject(mSound == null ? null : mSound.toString());
    out.writeByte(mShouldUseDefaultVibrationPattern ? 1 : 0);
    if (mVibrationPattern == null) {
      out.writeInt(-1);
    } else {
      out.writeInt(mVibrationPattern.length);
      for (long duration : mVibrationPattern) {
        out.writeLong(duration);
      }
    }
    out.writeObject(mBody != null ? mBody.toString() : null);
    out.writeObject(mPriority != null ? mPriority.getNativeValue() : null);
    out.writeObject(mColor);
    out.writeByte(mAutoDismiss ? 1 : 0);
    out.writeObject(mCategoryId != null ? mCategoryId.toString() : null);
    out.writeByte(mSticky ? 1 : 0);
  }

  private void readObject(java.io.ObjectInputStream in) throws IOException, ClassNotFoundException {
    mTitle = (String) in.readObject();
    mText = (String) in.readObject();
    mSubtitle = (String) in.readObject();
    mBadgeCount = (Number) in.readObject();
    mShouldPlayDefaultSound = in.readByte() == 1;
    String soundUri = (String) in.readObject();
    if (soundUri == null) {
      mSound = null;
    } else {
      mSound = Uri.parse(soundUri);
    }
    mShouldUseDefaultVibrationPattern = in.readByte() == 1;
    int vibrationPatternLength = in.readInt();
    if (vibrationPatternLength < 0) {
      mVibrationPattern = null;
    } else {
      mVibrationPattern = new long[vibrationPatternLength];
      for (int i = 0; i < vibrationPatternLength; i++) {
        mVibrationPattern[i] = in.readLong();
      }
    }
    String bodyString = (String) in.readObject();
    if (bodyString == null) {
      mBody = null;
    } else {
      try {
        mBody = new JSONObject(bodyString);
      } catch (JSONException | NullPointerException e) {
        // do nothing
      }
    }
    Number priorityNumber = (Number) in.readObject();
    if (priorityNumber != null) {
      mPriority = NotificationPriority.fromNativeValue(priorityNumber.intValue());
    }
    mColor = (Number) in.readObject();
    mAutoDismiss = in.readByte() == 1;
    String categoryIdString = (String) in.readObject();
    if (categoryIdString == null) {
      mCategoryId = null;
    } else {
      mCategoryId = new String(categoryIdString);
    }
    mSticky = in.readByte() == 1;
  }

  private void readObjectNoData() throws ObjectStreamException {
  }

  public static class Builder {
    private final NotificationContent content;

    public Builder() {
      content = new NotificationContent();
      useDefaultSound();
      useDefaultVibrationPattern();
    }

    public Builder setTitle(String title) {
      content.mTitle = title;
      return this;
    }

    public Builder setSubtitle(String subtitle) {
      content.mSubtitle = subtitle;
      return this;
    }

    public Builder setText(String text) {
      content.mText = text;
      return this;
    }

    public Builder setBody(JSONObject body) {
      content.mBody = body;
      return this;
    }

    public Builder setPriority(NotificationPriority priority) {
      content.mPriority = priority;
      return this;
    }

    public Builder setBadgeCount(Number badgeCount) {
      content.mBadgeCount = badgeCount;
      return this;
    }

    public Builder useDefaultVibrationPattern() {
      content.mShouldUseDefaultVibrationPattern = true;
      content.mVibrationPattern = null;
      return this;
    }

    public Builder setVibrationPattern(long[] vibrationPattern) {
      content.mShouldUseDefaultVibrationPattern = false;
      content.mVibrationPattern = vibrationPattern;
      return this;
    }

    public Builder useDefaultSound() {
      content.mShouldPlayDefaultSound = true;
      content.mSound = null;
      return this;
    }

    public Builder setSound(Uri sound) {
      content.mShouldPlayDefaultSound = false;
      content.mSound = sound;
      return this;
    }

    public Builder setColor(Number color) {
      content.mColor = color;
      return this;
    }

    public Builder setAutoDismiss(boolean autoDismiss) {
      content.mAutoDismiss = autoDismiss;
      return this;
    }

    public Builder setCategoryId(String categoryId) {
      content.mCategoryId = categoryId;
      return this;
    }
    
    public Builder setSticky(boolean sticky) {
      content.mSticky = sticky;
      return this;
    }

    public NotificationContent build() {
      return content;
    }
  }
}
