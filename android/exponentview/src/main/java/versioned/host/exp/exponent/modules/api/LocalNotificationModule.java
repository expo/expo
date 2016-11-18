
package versioned.host.exp.exponent.modules.api;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONObject;

import java.util.Random;

public class LocalNotificationModule extends ReactContextBaseJavaModule {

  private final JSONObject mManifest;

  public LocalNotificationModule(ReactApplicationContext reactContext, JSONObject manifest) {
    super(reactContext);
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentLocalNotifications";
  }

  @ReactMethod
  public void showNotification(final ReadableMap details, final Promise promise) {
    ReactApplicationContext context = getReactApplicationContext();
    Notification.Builder builder = new Notification.Builder(context);

    try {
      PackageManager pm = context.getPackageManager();
      ApplicationInfo info = pm.getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
      builder.setSmallIcon(info.icon);
    } catch (PackageManager.NameNotFoundException e) {
      builder.setSmallIcon(android.R.drawable.sym_def_app_icon);
    }

    builder.setAutoCancel(true);

    if (!(details.hasKey("silent") && details.getBoolean("silent"))) {
      builder.setDefaults(Notification.DEFAULT_SOUND);
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
          priority = Notification.PRIORITY_MAX;
          break;
        case "high":
          priority = Notification.PRIORITY_HIGH;
          break;
        case "low":
          priority = Notification.PRIORITY_LOW;
          break;
        case "min":
          priority = Notification.PRIORITY_MIN;
          break;
        default:
          priority = Notification.PRIORITY_DEFAULT;
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

    if (details.hasKey("link")) {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(details.getString("link")));
      PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, 0);
      builder.setContentIntent(contentIntent);
    }

    int notificationId = new Random().nextInt();
    getNotificationManager().notify(null, notificationId, builder.build());
    promise.resolve(notificationId);
  }

  @ReactMethod
  public void dismissNotification(final String tag, final int id) {
    getNotificationManager().cancel(tag, id);
  }

  @ReactMethod
  public void dismissAllNotifications() {
    getNotificationManager().cancelAll();
  }

  private NotificationManager getNotificationManager() {
    return (NotificationManager) getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
  }
}

