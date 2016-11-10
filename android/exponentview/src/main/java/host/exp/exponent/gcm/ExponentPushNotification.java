// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.EXL;

public class ExponentPushNotification {

  private static final String TAG = ExponentPushNotification.class.getSimpleName();

  public final String experienceId;
  public final String body;
  public final int notificationId;
  public final boolean isMultiple;

  public ExponentPushNotification(final String experienceId, final String body, final int notificationId, final boolean isMultiple) {
    this.experienceId = experienceId;
    this.body = body;
    this.notificationId = notificationId;
    this.isMultiple = isMultiple;
  }

  public static ExponentPushNotification fromJSONObjectString(final String json) {
    if (json == null) {
      return null;
    }

    try {
      JSONObject object = new JSONObject(json);
      return new ExponentPushNotification(object.getString(PushNotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY), object.getString(PushNotificationConstants.NOTIFICATION_MESSAGE_KEY), object.getInt(PushNotificationConstants.NOTIFICATION_ID_KEY), object.getBoolean(PushNotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY));
    } catch (JSONException e) {
      EXL.e(TAG, e.toString());
      return null;
    }
  }

  public JSONObject toJSONObject(String origin) {
    JSONObject notification = new JSONObject();
    try {
      notification.put(PushNotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY, experienceId);
      if (origin != null) {
        notification.put(PushNotificationConstants.NOTIFICATION_ORIGIN_KEY, origin);
      }
      notification.put(PushNotificationConstants.NOTIFICATION_MESSAGE_KEY, body); // deprecated
      notification.put(PushNotificationConstants.NOTIFICATION_DATA_KEY, body);
      notification.put(PushNotificationConstants.NOTIFICATION_ID_KEY, notificationId);
      notification.put(PushNotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple);
    } catch (JSONException e) {
      EXL.e(TAG, e.toString());
    }

    return notification;
  }

  public Object toWriteableMap(String sdkVersion, String origin) {
    RNObject args = new RNObject("com.facebook.react.bridge.Arguments").loadVersion(sdkVersion).callStaticRecursive("createMap");
    if (origin != null) {
      args.call("putString", PushNotificationConstants.NOTIFICATION_ORIGIN_KEY, origin);
    }
    args.call("putString", PushNotificationConstants.NOTIFICATION_DATA_KEY, body);
    args.call("putInt", PushNotificationConstants.NOTIFICATION_ID_KEY, notificationId);
    args.call("putBoolean", PushNotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple);
    return args.get();
  }
}
