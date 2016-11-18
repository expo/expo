// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;
import java.util.Random;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponentview.Exponent;

public class NotificationsModule extends ReactContextBaseJavaModule {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private final static String NO_ACTIVITY_ERROR = "NO_ACTIVITY_ERROR";

  private final JSONObject mManifest;
  private final Map<String, Object> mExperienceProperties;

  public NotificationsModule(ReactApplicationContext reactContext,
                             JSONObject manifest, Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(NotificationsModule.class, this);
    mManifest = manifest;
    mExperienceProperties = experienceProperties;
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

    WritableMap params = Arguments.createMap();
    params.putString("deviceId", uuid);
    try {
      params.putString("experienceId", mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
    } catch (JSONException e) {
      promise.reject("Requires Experience Id");
      return;
    }

    ExponentKernelModuleProvider.queueEvent("ExponentKernel.getExponentPushToken", params, new ExponentKernelModuleProvider.KernelEventCallback() {
      @Override
      public void onEventSuccess(ReadableMap result) {
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
  public void presentLocalNotification(final ReadableMap details, final Promise promise) {
    ReactApplicationContext context = getReactApplicationContext();
    NotificationCompat.Builder builder = new NotificationCompat.Builder(context);

    try {
      PackageManager pm = context.getPackageManager();
      ApplicationInfo info = pm.getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
      builder.setSmallIcon(info.icon);
    } catch (PackageManager.NameNotFoundException e) {
      builder.setSmallIcon(android.R.drawable.sym_def_app_icon);
    }

    builder.setAutoCancel(true);

    if (!(details.hasKey("silent") && details.getBoolean("silent"))) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    }

    if (details.hasKey("title")) {
      String title = details.getString("title");
      builder.setContentTitle(title);
      builder.setTicker(title);
    }

    if (details.hasKey("body")) {
      builder.setContentText(details.getString("body"));
    }

    if (details.hasKey("count")) {
      builder.setNumber(details.getInt("count"));
    }

    if (details.hasKey("sticky")) {
      builder.setOngoing(details.getBoolean("sticky"));
    }

    if (details.hasKey("priority")) {
      int priority;

      switch (details.getString("priority")) {
        case "max":
          priority = NotificationCompat.PRIORITY_MAX;
          break;
        case "high":
          priority = NotificationCompat.PRIORITY_HIGH;
          break;
        case "low":
          priority = NotificationCompat.PRIORITY_LOW;
          break;
        case "min":
          priority = NotificationCompat.PRIORITY_MIN;
          break;
        default:
          priority = NotificationCompat.PRIORITY_DEFAULT;
      }

      builder.setPriority(priority);
    }

    if (details.hasKey("vibrate")) {
      ReadableArray vibrate = details.getArray("vibrate");
      long[] pattern = new long[vibrate.size()];
      for (int i = 0; i < vibrate.size(); i++) {
        pattern[i] = vibrate.getInt(i);
      }
      builder.setVibrate(pattern);
    }

    Activity currentActivity = Exponent.getInstance().getCurrentActivity();

    if (currentActivity == null) {
      promise.reject(NO_ACTIVITY_ERROR, "Activity not found");
      return;
    }

    Class activityClass = currentActivity.getClass();
    String manifestUrl = (String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY);
    Intent intent = new Intent(getReactApplicationContext(), activityClass);

    try {
      intent.putExtra((String) activityClass.getDeclaredField("MANIFEST_URL_KEY").get(null), manifestUrl);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      promise.reject(e);
      return;
    }

    if (details.hasKey("link")) {
      intent.setAction(Intent.ACTION_VIEW);
      intent.setData(Uri.parse(details.getString("link")));
    }

    PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, 0);
    builder.setContentIntent(contentIntent);

    int notificationId = new Random().nextInt();
    getNotificationManager().notify(null, notificationId, builder.build());
    promise.resolve(notificationId);
  }

  @ReactMethod
  public void cancelNotification(final int notificationId) {
    getNotificationManager().cancel(notificationId);
  }

  private NotificationManagerCompat getNotificationManager() {
    return NotificationManagerCompat.from(getReactApplicationContext());
  }
}
