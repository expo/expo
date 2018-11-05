// Copyright 2015-present 650 Industries. All rights reserved.

package abi24_0_0.host.exp.exponent.modules.api;

import android.support.v4.app.NotificationManagerCompat;

import abi24_0_0.com.facebook.react.bridge.Arguments;
import abi24_0_0.com.facebook.react.bridge.Promise;
import abi24_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi24_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi24_0_0.com.facebook.react.bridge.ReactMethod;
import abi24_0_0.com.facebook.react.bridge.ReadableMap;
import abi24_0_0.com.facebook.react.bridge.ReadableNativeMap;
import abi24_0_0.com.facebook.react.bridge.WritableMap;
import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;
import com.google.firebase.iid.FirebaseInstanceId;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.notifications.NotificationConstants;
import host.exp.exponent.notifications.NotificationHelper;
import host.exp.exponent.notifications.ExponentNotificationManager;
import org.json.JSONException;
import org.json.JSONObject;

import java.security.InvalidParameterException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class NotificationsModule extends ReactContextBaseJavaModule {

  private static final String TAG = NotificationsModule.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentNetwork mExponentNetwork;

  private final JSONObject mManifest;

  public NotificationsModule(ReactApplicationContext reactContext,
                             JSONObject manifest, Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(NotificationsModule.class, this);
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentNotifications";
  }

  @ReactMethod
  public void getDevicePushTokenAsync(final ReadableMap config, final Promise promise) {
    if (!Constants.isShellApp()) {
      promise.reject("getDevicePushTokenAsync is only accessible within standalone applications");
    }
    try {
      if (Constants.FCM_ENABLED) {
        String token = FirebaseInstanceId.getInstance().getToken();
        if (token == null) {
          promise.reject("FCM token has not been set");
        } else {
          WritableMap params = Arguments.createMap();
          params.putString("type", "fcm");
          params.putString("data", token);
          promise.resolve(params);
        }
      } else {
        InstanceID instanceID = InstanceID.getInstance(this.getReactApplicationContext());
        String gcmSenderId = config.getString("gcmSenderId");
        if (gcmSenderId == null || gcmSenderId.length() == 0) {
          throw new InvalidParameterException("GCM Sender ID is null/empty");
        }
        final String token = instanceID.getToken(gcmSenderId, GoogleCloudMessaging.INSTANCE_ID_SCOPE, null);
        if (token == null) {
          promise.reject("GCM token has not been set");
        } else {
          WritableMap params = Arguments.createMap();
          params.putString("type", "gcm");
          params.putString("data", token);
          promise.resolve(params);
        }
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e.getMessage());
    }
  }

  @ReactMethod
  public void getExponentPushTokenAsync(final Promise promise) {
    String uuid = mExponentSharedPreferences.getUUID();
    if (uuid == null) {
      // This should have been set by ExponentNotificationIntentService when Activity was created/resumed.
      promise.reject("Couldn't get GCM token on device.");
      return;
    }

    try {
      String experienceId = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      NotificationHelper.getPushNotificationToken(uuid, experienceId, mExponentNetwork, mExponentSharedPreferences, new NotificationHelper.TokenListener() {
        @Override
        public void onSuccess(String token) {
          promise.resolve(token);
        }

        @Override
        public void onFailure(Exception e) {
          promise.reject("E_GET_GCM_TOKEN_FAILED", "Couldn't get GCM token for device", e);
        }
      });
    } catch (JSONException e) {
      promise.reject("E_GET_GCM_TOKEN_FAILED", "Couldn't get GCM token for device", e);
      return;
    }
  }

  @ReactMethod
  public void cancelNotification(final int notificationId) {
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(getReactApplicationContext());
    notificationManager.cancel(notificationId);
  }

  @ReactMethod
  public void createChannel(String channelId, final ReadableMap data, final Promise promise) {
    String experienceId;
    String channelName;

    try {
      experienceId = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
    } catch (Exception e) {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Requires Experience ID");
      return;
    }

    if (data.hasKey(NotificationConstants.NOTIFICATION_CHANNEL_NAME)) {
      channelName = data.getString(NotificationConstants.NOTIFICATION_CHANNEL_NAME);
    } else {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Requires channel name");
      return;
    }

    try {
      NotificationHelper.createChannel(
          getReactApplicationContext(),
          experienceId,
          channelId,
          channelName,
          data.toHashMap());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Could not create channel", e);
    }
  }

  @ReactMethod
  public void deleteChannel(String channelId, final Promise promise) {
    String experienceId;

    try {
      experienceId = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
    } catch (Exception e) {
      promise.reject("E_FAILED_DELETING_CHANNEL", "Requires Experience ID");
      return;
    }

    try {
      NotificationHelper.deleteChannel(
          getReactApplicationContext(),
          experienceId,
          channelId);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("E_FAILED_DELETING_CHANNEL", "Could not delete channel", e);
    }
  }

  @ReactMethod
  public void presentLocalNotification(final ReadableMap data, final Promise promise) {
    presentLocalNotificationWithChannel(data, null, promise);
  }

  @ReactMethod
  public void presentLocalNotificationWithChannel(final ReadableMap data, final ReadableMap legacyChannelData, final Promise promise) {
    HashMap<String, java.io.Serializable> details = new HashMap<>();
    String experienceId;

    details.put("data", ((ReadableNativeMap) data).toHashMap());

    try {
      experienceId = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "Requires Experience ID");
      return;
    }

    if (legacyChannelData != null) {
      String channelId = data.getString("channelId");
      if (channelId == null) {
        promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "legacyChannelData was nonnull with no channelId");
        return;
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
          getReactApplicationContext(),
          experienceId,
          channelId,
          legacyChannelData.toHashMap());
    }

    int notificationId = new Random().nextInt();

    NotificationHelper.showNotification(
            getReactApplicationContext(),
            notificationId,
            details,
            mExponentManifest,
            new NotificationHelper.Listener() {
              public void onSuccess(int id) {
                promise.resolve(id);
              }
              public void onFailure(Exception e) {
                promise.reject(e);
              }
            });
  }

  @ReactMethod
  public void scheduleLocalNotification(final ReadableMap data, final ReadableMap options, final Promise promise) {
    scheduleLocalNotificationWithChannel(data, options, null, promise);
  }

  @ReactMethod
  public void scheduleLocalNotificationWithChannel(final ReadableMap data, final ReadableMap options, final ReadableMap legacyChannelData, final Promise promise) {
    if (legacyChannelData != null) {
      String experienceId = mManifest.optString(ExponentManifest.MANIFEST_ID_KEY, null);
      String channelId = data.getString("channelId");
      if (channelId == null || experienceId == null) {
        promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "legacyChannelData was nonnull with no channelId or no experienceId");
        return;
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
          getReactApplicationContext(),
          experienceId,
          channelId,
          legacyChannelData.toHashMap());
    }

    int notificationId = new Random().nextInt();

    NotificationHelper.scheduleLocalNotification(
        getReactApplicationContext(),
        notificationId,
        ((ReadableNativeMap) data).toHashMap(),
        ((ReadableNativeMap) options).toHashMap(),
        mManifest,
        new NotificationHelper.Listener() {
          public void onSuccess(int id) {
            promise.resolve(id);
          }
          public void onFailure(Exception e) {
            promise.reject(e);
          }
        });
  }

  @ReactMethod
  public void dismissNotification(final int notificationId, final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancel(
              mManifest.getString(ExponentManifest.MANIFEST_ID_KEY),
              notificationId
      );
      promise.resolve(true);
    } catch (JSONException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void dismissAllNotifications(final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelAll(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
      promise.resolve(true);
    } catch (JSONException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void cancelScheduledNotification(final int notificationId, final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelScheduled(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY), notificationId);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void cancelAllScheduledNotifications(final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelAllScheduled(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
