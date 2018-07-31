package host.exp.exponent.notifications;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationCompat;

import android.text.format.DateUtils;

import de.greenrobot.event.EventBus;
import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.RequestBody;
import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.fcm.FcmRegistrationIntentService;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExpoResponse;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.AsyncCondition;
import host.exp.exponent.utils.JSONUtils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
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

  private static String TAG = NotificationHelper.class.getSimpleName();

  public interface Listener {
    void onSuccess(int id);

    void onFailure(Exception e);
  }

  public interface TokenListener {
    void onSuccess(String token);

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

  public static void getPushNotificationToken(
      final String deviceId,
      final String experienceId,
      final ExponentNetwork exponentNetwork,
      final ExponentSharedPreferences exponentSharedPreferences,
      final TokenListener listener) {
    if (Constants.FCM_ENABLED) {
      FcmRegistrationIntentService.getTokenAndRegister(exponentSharedPreferences.getContext());
    }

    AsyncCondition.wait("devicePushToken", new AsyncCondition.AsyncConditionListener() {
      @Override
      public boolean isReady() {
        return exponentSharedPreferences.getString(Constants.FCM_ENABLED ? ExponentSharedPreferences.FCM_TOKEN_KEY : ExponentSharedPreferences.GCM_TOKEN_KEY) != null;
      }

      @Override
      public void execute() {
        String sharedPreferencesToken = exponentSharedPreferences.getString(Constants.FCM_ENABLED ? ExponentSharedPreferences.FCM_TOKEN_KEY : ExponentSharedPreferences.GCM_TOKEN_KEY);
        if (sharedPreferencesToken == null || sharedPreferencesToken.length() == 0) {
          listener.onFailure(new Exception("No device token found"));
          return;
        }

        JSONObject params = new JSONObject();
        try {
          params.put("deviceId", deviceId);
          params.put("experienceId", experienceId);
          params.put("appId", exponentSharedPreferences.getContext().getApplicationContext().getPackageName());
          params.put("deviceToken", sharedPreferencesToken);
          params.put("type", Constants.FCM_ENABLED ? "fcm" : "gcm");
          params.put("development", false);
        } catch (JSONException e) {
          listener.onFailure(new Exception("Error constructing request"));
          return;
        }

        RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), params.toString());
        Request request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/getExpoPushToken", false, true)
            .header("Content-Type", "application/json")
            .post(body)
            .build();

        exponentNetwork.getClient().call(request, new ExpoHttpCallback() {
          @Override
          public void onFailure(IOException e) {
            listener.onFailure(e);
          }

          @Override
          public void onResponse(ExpoResponse response) throws IOException {
            if (!response.isSuccessful()) {
              listener.onFailure(new Exception("Couldn't get android push token for device"));
              return;
            }

            try {
              JSONObject result = new JSONObject(response.body().string());
              JSONObject data = result.getJSONObject("data");
              listener.onSuccess(data.getString("expoPushToken"));
            } catch (Exception e) {
              listener.onFailure(e);
            }
          }
        });
      }
    });
  }

  public static void createChannel(
      Context context,
      String experienceId,
      String channelId,
      String channelName,
      HashMap details) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String description = null;
      String importance = null;
      Boolean sound = null;
      Object vibrate = null;
      Boolean badge = null;

      if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY)) {
        importance = (String) details.get(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY);
      }
      if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_SOUND)) {
        sound = (Boolean) details.get(NotificationConstants.NOTIFICATION_CHANNEL_SOUND);
      }
      if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE)) {
        vibrate = details.get(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE);
      }
      if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION)) {
        description = (String) details.get(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION);
      }
      if (details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_BADGE)) {
        badge = (Boolean) details.get(NotificationConstants.NOTIFICATION_CHANNEL_BADGE);
      }

      createChannel(
          context,
          experienceId,
          channelId,
          channelName,
          description,
          importance,
          sound,
          vibrate,
          badge
      );
    } else {
      // since channels do not exist on Android 7.1 and below, we'll save the settings in shared
      // preferences and apply them to individual notifications that have this channelId from now on
      // this is essentially a "polyfill" of notification channels for Android 7.1 and below
      // and means that devs don't have to worry about supporting both versions of Android at once
      new ExponentNotificationManager(context).saveChannelSettings(experienceId, channelId, details);
    }
  }

  public static void createChannel(
      Context context,
      String experienceId,
      String channelId,
      JSONObject details) {
    try {
      // we want to throw immediately if there is no channel name
      String channelName = details.getString(NotificationConstants.NOTIFICATION_CHANNEL_NAME);
      String description = null;
      String priority = null;
      Boolean sound = null;
      Boolean badge = null;

      if (!details.isNull(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION)) {
        description = details.optString(NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION);
      }
      if (!details.isNull(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY)) {
        priority = details.optString(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY);
      }
      if (!details.isNull(NotificationConstants.NOTIFICATION_CHANNEL_SOUND)) {
        sound = details.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_SOUND);
      }
      if (!details.isNull(NotificationConstants.NOTIFICATION_CHANNEL_BADGE)) {
        badge = details.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_BADGE, true);
      }

      Object vibrate;
      JSONArray jsonArray = details.optJSONArray(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE);
      if (jsonArray != null) {
        ArrayList<Double> vibrateArrayList = new ArrayList<>();
        for (int i = 0; i < jsonArray.length(); i++) {
          vibrateArrayList.add(jsonArray.getDouble(i));
        }
        vibrate = vibrateArrayList;
      } else {
        vibrate = details.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE, false);
      }

      createChannel(
          context,
          experienceId,
          channelId,
          channelName,
          description,
          priority,
          sound,
          vibrate,
          badge
      );
    } catch (Exception e) {
      EXL.e(TAG,"Could not create channel from stored JSON Object: " + e.getMessage());
    }
  }

  private static void createChannel(
      Context context,
      String experienceId,
      String channelId,
      String channelName,
      String description,
      String importanceString,
      Boolean sound,
      Object vibrate,
      Boolean badge) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      int importance = NotificationManager.IMPORTANCE_DEFAULT;

      if (importanceString != null) {
        switch (importanceString) {
          case NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_MAX:
            importance = NotificationManager.IMPORTANCE_MAX;
            break;
          case NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_HIGH:
            importance = NotificationManager.IMPORTANCE_HIGH;
            break;
          case NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_LOW:
            importance = NotificationManager.IMPORTANCE_LOW;
            break;
          case NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY_MIN:
            importance = NotificationManager.IMPORTANCE_MIN;
            break;
          default:
            importance = NotificationManager.IMPORTANCE_DEFAULT;
        }
      }

      NotificationChannel channel = new NotificationChannel(ExponentNotificationManager.getScopedChannelId(experienceId, channelId), channelName, importance);

      // sound is now on by default for channels
      if (sound == null || !sound) {
        channel.setSound(null, null);
      }

      if (vibrate != null) {
        if (vibrate instanceof ArrayList) {
          ArrayList vibrateArrayList = (ArrayList) vibrate;
          long[] pattern = new long[vibrateArrayList.size()];
          for (int i = 0; i < vibrateArrayList.size(); i++) {
            pattern[i] = ((Double) vibrateArrayList.get(i)).intValue();
          }
          channel.setVibrationPattern(pattern);
        } else if (vibrate instanceof Boolean && (Boolean) vibrate) {
          channel.setVibrationPattern(new long[] { 0, 500 });
        }
      }

      if (description != null) {
        channel.setDescription(description);
      }

      if (badge != null) {
        channel.setShowBadge(badge);
      }

      new ExponentNotificationManager(context).createNotificationChannel(experienceId, channel);
    }
  }

  public static void maybeCreateLegacyStoredChannel(Context context, String experienceId, String channelId, HashMap details) {
    // no version check here because if we're on Android 7.1 or below, we still want to save
    // the channel in shared preferences
    NotificationChannel existingChannel = new ExponentNotificationManager(context).getNotificationChannel(experienceId, channelId);
    if (existingChannel == null && details.containsKey(NotificationConstants.NOTIFICATION_CHANNEL_NAME)) {
      createChannel(context, experienceId, channelId, (String) details.get(NotificationConstants.NOTIFICATION_CHANNEL_NAME), details);
    }
  }

  public static void deleteChannel(Context context, String experienceId, String channelId) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      new ExponentNotificationManager(context).deleteNotificationChannel(experienceId, channelId);
    } else {
      // deleting a channel on O+ still retains all its settings, so doing nothing here emulates that
    }
  }

  public static void showNotification(
      final Context context,
      final int id,
      final HashMap details,
      final ExponentManifest exponentManifest,
      final Listener listener) {
    final ExponentNotificationManager manager = new ExponentNotificationManager(context);
    final String experienceId = (String) details.get("experienceId");
    final NotificationCompat.Builder builder = new NotificationCompat.Builder(
        context,
        ExponentNotificationManager.getScopedChannelId(experienceId, NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID));

    builder.setSmallIcon(Constants.isShellApp() ? R.drawable.shell_notification_icon : R.drawable.notification_icon);
    builder.setAutoCancel(true);

    final HashMap data = (HashMap) details.get("data");

    if (data.containsKey("channelId")) {
      String channelId = (String) data.get("channelId");
      builder.setChannelId(ExponentNotificationManager.getScopedChannelId(experienceId, channelId));

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // if we don't yet have a channel matching this ID, check shared preferences --
        // it's possible this device has just been upgraded to Android 8+ and the channel
        // needs to be created in the system
        if (manager.getNotificationChannel(experienceId, channelId) == null) {
          JSONObject storedChannelDetails = manager.readChannelSettings(experienceId, channelId);
          if (storedChannelDetails != null) {
            createChannel(context, experienceId, channelId, storedChannelDetails);
          }
        }
      } else {
        // on Android 7.1 and below, read channel settings for sound, priority, and vibrate from shared preferences
        // and apply these settings to the notification individually, since channels do not exist
        JSONObject storedChannelDetails = manager.readChannelSettings(experienceId, channelId);
        if (storedChannelDetails != null) {
          if (storedChannelDetails.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_SOUND, false)) {
            builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
          }

          String priorityString = storedChannelDetails.optString(NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY);
          int priority;
          switch (priorityString) {
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

          try {
            JSONArray vibrateJsonArray = storedChannelDetails.optJSONArray(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE);
            if (vibrateJsonArray != null) {
              long[] pattern = new long[vibrateJsonArray.length()];
              for (int i = 0; i < vibrateJsonArray.length(); i++) {
                pattern[i] = ((Double) vibrateJsonArray.getDouble(i)).intValue();
              }
              builder.setVibrate(pattern);
            } else if (storedChannelDetails.optBoolean(NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE, false)) {
              builder.setVibrate(new long[] { 0, 500 });
            }
          } catch (Exception e) {
            EXL.e(TAG, "Failed to set vibrate settings on notification from stored channel: " + e.getMessage());
          }
        } else {
          EXL.e(TAG, "No stored channel found for " + experienceId + ": " + channelId);
        }
      }
    } else {
      // make a default channel so that people don't have to explicitly create a channel to see notifications
      createChannel(
          context,
          experienceId,
          NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID,
          context.getString(R.string.default_notification_channel_group),
          new HashMap());
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

          PendingIntent contentIntent = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT);
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
