package host.exp.exponent.notifications;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.SystemClock;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationCompat;

import android.text.format.DateUtils;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import host.exp.exponent.gcm.PushNotificationConstants;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.utils.ColorParser;
import host.exp.exponentview.R;

import static android.app.PendingIntent.FLAG_UPDATE_CURRENT;

public class NotificationsHelper {

  public interface Listener {
    void onSuccess(int id);

    void onFailure(Exception e);
  }

  public static int getColor(
      @Nullable String colorString,
      JSONObject manifest,
      ExponentManifest exponentManifest) {
    JSONObject notificationPreferences = manifest.optJSONObject(ExponentManifest.MANIFEST_NOTIFICATION_INFO_KEY);

    if (colorString == null) {
      colorString = notificationPreferences == null ? null :
          notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_COLOR_KEY);
    }

    int color;

    if (colorString != null && ColorParser.isValid(colorString)) {
      color = Color.parseColor(colorString);
    } else {
      color = exponentManifest.getColorFromManifest(manifest);
    }

    return color;
  }

  public static void loadIcon(String url,
                              JSONObject manifest,
                              ExponentManifest exponentManifest,
                              ExponentManifest.BitmapListener bitmapListener) {
    JSONObject notificationPreferences = manifest.optJSONObject(ExponentManifest.MANIFEST_NOTIFICATION_INFO_KEY);
    String iconUrl;

    if (url == null) {
      iconUrl = manifest.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);
      if (notificationPreferences != null) {
        iconUrl = notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_ICON_URL_KEY, null);
      }
    } else {
      iconUrl = url;
    }

    exponentManifest.loadIconBitmap(iconUrl, bitmapListener);
  }

  public static void showNotification(
      final Context context,
      final int id,
      final HashMap details,
      final ExponentManifest exponentManifest,
      final Listener listener) {
    final NotificationCompat.Builder builder = new NotificationCompat.Builder(context);

    builder.setSmallIcon(R.drawable.shell_notification_icon);
    builder.setAutoCancel(true);

    final String experienceId = (String) details.get("experienceId");
    final HashMap data = (HashMap) details.get("data");

    if (!(data.containsKey("silent") && (Boolean) data.get("silent"))) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    }

    if (data.containsKey("title")) {
      String title = (String) data.get("title");
      builder.setContentTitle(title);
      builder.setTicker(title);
    }

    if (data.containsKey("body")) {
      builder.setContentText((String) data.get("body"));
    }

    if (data.containsKey("count")) {
      builder.setNumber(((Double) data.get("count")).intValue());
    }

    if (data.containsKey("sticky")) {
      builder.setOngoing((Boolean) data.get("sticky"));
    }

    if (data.containsKey("priority")) {
      int priority;

      switch ((String) data.get("priority")) {
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

    if (data.containsKey("vibrate")) {
      ArrayList vibrate = (ArrayList) data.get("vibrate");
      long[] pattern = new long[vibrate.size()];
      for (int i = 0; i < vibrate.size(); i++) {
        pattern[i] = ((Double) vibrate.get(i)).intValue();
      }
      builder.setVibrate(pattern);
    }

    ExponentDB.experienceIdToExperience(experienceId, new ExponentDB.ExperienceResultListener() {
      @Override
      public void onSuccess(ExperienceDBObject experience) {
        try {
          JSONObject manifest = new JSONObject(experience.manifest);

          Intent intent;

          if (data.containsKey("link")) {
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse((String) data.get("link")));
          } else {
            try {
              Class activityClass = Class.forName(KernelConstants.MAIN_ACTIVITY_NAME);
              intent = new Intent(context, activityClass);
              intent.putExtra(KernelConstants.MANIFEST_URL_KEY, experience.manifestUrl);
            } catch (ClassNotFoundException e) {
              listener.onFailure(e);
              return;
            }
          }

          JSONObject notification = new JSONObject();
          notification.put(PushNotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY, experienceId);
          notification.put(PushNotificationConstants.NOTIFICATION_REMOTE_KEY, false);
          if (data.containsKey("data")) {
            HashMap d = (HashMap) data.get("data");
            notification.put(PushNotificationConstants.NOTIFICATION_DATA_KEY, d.toString());
          }

          intent.putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notification.toString());

          PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, FLAG_UPDATE_CURRENT);
          builder.setContentIntent(contentIntent);

          int color = NotificationsHelper.getColor(
              data.containsKey("color") ? (String) data.get("color") : null,
              manifest,
              exponentManifest);

          builder.setColor(color);

          NotificationsHelper.loadIcon(
              data.containsKey("icon") ? (String) data.get("icon") : null,
              manifest,
              exponentManifest,
              new ExponentManifest.BitmapListener() {
                @Override
                public void onLoadBitmap(Bitmap bitmap) {
                  builder.setLargeIcon(bitmap);
                  NotificationsManager manager = new NotificationsManager(context);
                  manager.notify(experienceId, id, builder.build());
                  listener.onSuccess(id);
                }
              });
        } catch (JSONException e) {
          listener.onFailure(new Exception("Couldn't deserialize JSON for experience id " + experienceId));
        }
      }

      @Override
      public void onFailure() {
        listener.onFailure(new Exception("No experience found for id " + experienceId));
      }
    });
  }

  public static void scheduleLocalNotification(
      final Context context,
      final int id,
      final ReadableMap data,
      final ReadableMap options,
      final JSONObject manifest,
      final Listener listener) {

    Class receiverClass;

    try {
      receiverClass = Class.forName(KernelConstants.SCHEDULED_NOTIFICATION_RECEIVER_NAME);
    } catch (ClassNotFoundException e) {
      listener.onFailure(e);
      return;
    }

    HashMap<String, java.io.Serializable> details = new HashMap<>();

    details.put("data", ((ReadableNativeMap) data).toHashMap());

    String experienceId;

    try {
      experienceId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      listener.onFailure(new Exception("Requires Experience Id"));
      return;
    }

    long time = 0;

    if (options.hasKey("time")) {
      try {
        DateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        time = format.parse(options.getString("time")).getTime() - System.currentTimeMillis();
      } catch (ParseException e) {
        listener.onFailure(e);
        return;
      }
    }

    time += SystemClock.elapsedRealtime();

    NotificationsManager manager = new NotificationsManager(context);

    Long interval = null;

    if (options.hasKey("repeat")) {
      switch (options.getString("repeat")) {
        case "minute":
          interval = DateUtils.MINUTE_IN_MILLIS;
          break;
        case "hour":
          interval = DateUtils.HOUR_IN_MILLIS;
          break;
        case "day":
          interval = DateUtils.DAY_IN_MILLIS;
          break;
        case "week":
          interval = DateUtils.WEEK_IN_MILLIS;
          break;
        case "month":
          interval = DateUtils.DAY_IN_MILLIS * 30;
          break;
        case "year":
          interval = DateUtils.DAY_IN_MILLIS * 365;
          break;
        default:
          listener.onFailure(new Exception("Invalid repeat interval specified"));
          return;
      }
    }

    try {
      manager.schedule(experienceId, id, details, time, interval);
      listener.onSuccess(id);
    } catch (Exception e) {
      listener.onFailure(e);
    }
  }
}
