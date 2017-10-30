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

import de.greenrobot.event.EventBus;
import host.exp.exponent.Constants;
import host.exp.exponent.utils.JSONUtils;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.TimeZone;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.utils.ColorParser;
import host.exp.expoview.R;

public class NotificationHelper {

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

    builder.setSmallIcon(Constants.isShellApp() ? R.drawable.shell_notification_icon : R.drawable.notification_icon);
    builder.setAutoCancel(true);

    final String experienceId = (String) details.get("experienceId");
    final HashMap data = (HashMap) details.get("data");

    if (data.containsKey("sound") && (Boolean) data.get("sound")) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    }

    if (data.containsKey("title")) {
      String title = (String) data.get("title");
      builder.setContentTitle(title);
      builder.setTicker(title);
    }

    if (data.containsKey("body")) {
      builder.setContentText((String) data.get("body"));
      builder.setStyle(new NotificationCompat.BigTextStyle().
          bigText((String)data.get("body")));
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
      Object vibrate = data.get("vibrate");
      if (vibrate instanceof ArrayList) {
        ArrayList vibrateArrayList = (ArrayList) data.get("vibrate");
        long[] pattern = new long[vibrateArrayList.size()];
        for (int i = 0; i < vibrateArrayList.size(); i++) {
          pattern[i] = ((Double) vibrateArrayList.get(i)).intValue();
        }
        builder.setVibrate(pattern);
      } else if (vibrate instanceof Boolean) {
        builder.setVibrate(new long[] { 0, 500 });
      }
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
            Class activityClass = KernelConstants.MAIN_ACTIVITY_CLASS;
            intent = new Intent(context, activityClass);
            intent.putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, experience.manifestUrl);
          }

          String body = data.containsKey("data") ? JSONUtils.getJSONString(data.get("data")) : "";

          final ReceivedNotificationEvent notificationEvent = new ReceivedNotificationEvent(experienceId, body, id, false, false);

          intent.putExtra(KernelConstants.NOTIFICATION_KEY, body); // deprecated
          intent.putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEvent.toJSONObject(null).toString());

          PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
          builder.setContentIntent(contentIntent);

          int color = NotificationHelper.getColor(
              data.containsKey("color") ? (String) data.get("color") : null,
              manifest,
              exponentManifest);

          builder.setColor(color);

          NotificationHelper.loadIcon(
              data.containsKey("icon") ? (String) data.get("icon") : null,
              manifest,
              exponentManifest,
              new ExponentManifest.BitmapListener() {
                @Override
                public void onLoadBitmap(Bitmap bitmap) {
                  if (data.containsKey("icon")) {
                    builder.setLargeIcon(bitmap);
                  }
                  ExponentNotificationManager manager = new ExponentNotificationManager(context);
                  manager.notify(experienceId, id, builder.build());
                  EventBus.getDefault().post(notificationEvent);
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
      final HashMap<String, Object> data,
      final HashMap options,
      final JSONObject manifest,
      final Listener listener) {

    HashMap<String, java.io.Serializable> details = new HashMap<>();

    details.put("data", data);

    String experienceId;

    try {
      experienceId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      listener.onFailure(new Exception("Requires Experience Id"));
      return;
    }

    long time = 0;

    if (options.containsKey("time")) {
      try {
        Object suppliedTime = options.get("time");
        if (suppliedTime instanceof String) {
          DateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
          format.setTimeZone(TimeZone.getTimeZone("UTC"));
          time = format.parse((String) suppliedTime).getTime() - System.currentTimeMillis();
        } else {
          time = Long.valueOf((String) suppliedTime) - System.currentTimeMillis();
        }
      } catch (ParseException e) {
        listener.onFailure(e);
        return;
      }
    }

    time += SystemClock.elapsedRealtime();

    ExponentNotificationManager manager = new ExponentNotificationManager(context);

    Long interval = null;

    if (options.containsKey("repeat")) {
      switch ((String) options.get("repeat")) {
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
    } else if (options.containsKey("intervalMs")) {
      interval = (Long) options.get("intervalMs");
    }

    try {
      manager.schedule(experienceId, id, details, time, interval);
      listener.onSuccess(id);
    } catch (Exception e) {
      listener.onFailure(e);
    }
  }
}