// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.notifications;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.EXL;

public class ExponentNotification {

  private static final String TAG = ExponentNotification.class.getSimpleName();

  public final String experienceId;
  public final String body;
  public final int notificationId;
  public final boolean isMultiple;
  public final boolean isRemote;

  public ExponentNotification(final String experienceId, final String body, final int notificationId, final boolean isMultiple, final boolean isRemote) {
    this.experienceId = experienceId;
    this.body = body;
    this.notificationId = notificationId;
    this.isMultiple = isMultiple;
    this.isRemote = isRemote;
  }

  public static ExponentNotification fromJSONObjectString(final String json) {
    if (json == null) {
      return null;
    }

    try {
      JSONObject object = new JSONObject(json);
      return new ExponentNotification(object.getString(NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY), object.getString(NotificationConstants.NOTIFICATION_MESSAGE_KEY), object.getInt(NotificationConstants.NOTIFICATION_ID_KEY), object.getBoolean(NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY), object.getBoolean(NotificationConstants.NOTIFICATION_REMOTE_KEY));
    } catch (JSONException e) {
      EXL.e(TAG, e.toString());
      return null;
    }
  }

  public JSONObject toJSONObject(String origin) {
    JSONObject notification = new JSONObject();
    try {
      notification.put(NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY, experienceId);
      if (origin != null) {
        notification.put(NotificationConstants.NOTIFICATION_ORIGIN_KEY, origin);
      }
      notification.put(NotificationConstants.NOTIFICATION_MESSAGE_KEY, body); // deprecated
      notification.put(NotificationConstants.NOTIFICATION_DATA_KEY, body);
      notification.put(NotificationConstants.NOTIFICATION_ID_KEY, notificationId);
      notification.put(NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple);
      notification.put(NotificationConstants.NOTIFICATION_REMOTE_KEY, isRemote);
    } catch (JSONException e) {
      EXL.e(TAG, e.toString());
    }

    return notification;
  }

  public Object toWriteableMap(String sdkVersion, String origin) {
    RNObject args = new RNObject("com.facebook.react.bridge.Arguments").loadVersion(sdkVersion).callStaticRecursive("createMap");
    if (origin != null) {
      args.call("putString", NotificationConstants.NOTIFICATION_ORIGIN_KEY, origin);
    }
    args.call("putString", NotificationConstants.NOTIFICATION_DATA_KEY, body);
    args.call("putInt", NotificationConstants.NOTIFICATION_ID_KEY, notificationId);
    args.call("putBoolean", NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple);
    args.call("putBoolean", NotificationConstants.NOTIFICATION_REMOTE_KEY, isRemote);
    return args.get();
  }
}
