// Copyright 2015-present 650 Industries. All rights reserved.

package abi14_0_0.host.exp.exponent.modules.api;

import android.support.v4.app.NotificationManagerCompat;

import abi14_0_0.com.facebook.react.bridge.Promise;
import abi14_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi14_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi14_0_0.com.facebook.react.bridge.ReactMethod;
import abi14_0_0.com.facebook.react.bridge.ReadableMap;
import abi14_0_0.com.facebook.react.bridge.ReadableNativeMap;

import host.exp.exponent.notifications.NotificationHelper;
import host.exp.exponent.notifications.ExponentNotificationManager;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class NotificationsModule extends ReactContextBaseJavaModule {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentManifest mExponentManifest;

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
  public void getExponentPushTokenAsync(final Promise promise) {
    String uuid = mExponentSharedPreferences.getUUID();
    if (uuid == null) {
      // This should have been set by RegistrationIntentService when Activity was created/resumed.
      promise.reject("Couldn't get GCM token on device.");
      return;
    }

    com.facebook.react.bridge.WritableMap params = com.facebook.react.bridge.Arguments.createMap();
    params.putString("deviceId", uuid);
    try {
      params.putString("experienceId", mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
    } catch (JSONException e) {
      promise.reject("Requires Experience Id");
      return;
    }

    ExponentKernelModuleProvider.queueEvent("ExponentKernel.getExponentPushToken", params, new ExponentKernelModuleProvider.KernelEventCallback() {
      @Override
      public void onEventSuccess(com.facebook.react.bridge.ReadableMap result) {
        String exponentPushToken = result.getString("exponentPushToken");
        promise.resolve(exponentPushToken);
      }

      @Override
      public void onEventFailure(String errorMessage) {
        promise.reject(errorMessage);
      }
    });
  }

  @ReactMethod
  public void cancelNotification(final int notificationId) {
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(getReactApplicationContext());
    notificationManager.cancel(notificationId);
  }

  @ReactMethod
  public void presentLocalNotification(final ReadableMap data, final Promise promise) {
    HashMap<String, java.io.Serializable> details = new HashMap<>();

    details.put("data", ((ReadableNativeMap) data).toHashMap());

    try {
      details.put("experienceId", mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
    } catch (Exception e) {
      promise.reject("Requires Experience Id");
      return;
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
