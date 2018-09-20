package expo.modules.firebase.notifications;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import android.support.annotation.Nullable;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.firebase.app.Utils;
import expo.modules.firebase.messaging.BundleJSONConverter;

public class FirebaseNotificationManager {
  public static final String SCHEDULED_NOTIFICATION_EVENT = "notifications-scheduled-notification";
  private static final String PREFERENCES_KEY = "EXFNotifications";
  private static final String TAG = FirebaseNotificationManager.class.getCanonicalName();
  private AlarmManager alarmManager;
  private Context context;
  private ModuleRegistry mModuleRegistry;
  private NotificationManager notificationManager;
  private SharedPreferences preferences;

  public FirebaseNotificationManager(Context context, ModuleRegistry mModuleRegistry) {
    this.mModuleRegistry = mModuleRegistry;
    this.alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    this.context = context;
    this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    this.preferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
  }

  public static int getResourceId(Context context, String type, String image) {
    return context.getResources().getIdentifier(image, type, context.getPackageName());
  }

  public static Uri getSound(Context context, String sound) {
    if (sound == null) {
      return null;
    } else if (sound.contains("://")) {
      return Uri.parse(sound);
    } else if (sound.equalsIgnoreCase("default")) {
      return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    } else {
      int soundResourceId = getResourceId(context, "raw", sound);
      if (soundResourceId == 0) {
        soundResourceId = getResourceId(context, "raw", sound.substring(0, sound.lastIndexOf('.')));
      }
      return Uri.parse("android.resource://" + context.getPackageName() + "/" + soundResourceId);
    }
  }

  public void cancelAllNotifications(Promise promise) {
    try {
      Map<String, ?> notifications = preferences.getAll();

      for (String notificationId : notifications.keySet()) {
        cancelAlarm(notificationId);
      }
      preferences.edit().clear().apply();
      promise.resolve(null);
    } catch (SecurityException e) {
      // TODO: Identify what these situations are
      // In some devices/situations cancelAllLocalNotifications can throw a
      // SecurityException.
      Log.e(TAG, e.getMessage());
      promise.reject("notification/cancel_notifications_error", "Could not cancel notifications", e);
    }
  }

  public void cancelNotification(String notificationId, Promise promise) {
    try {
      cancelAlarm(notificationId);
      preferences.edit().remove(notificationId).apply();
      promise.resolve(null);
    } catch (SecurityException e) {
      // TODO: Identify what these situations are
      // In some devices/situations cancelAllLocalNotifications can throw a
      // SecurityException.
      Log.e(TAG, e.getMessage());
      promise.reject("notification/cancel_notification_error", "Could not cancel notifications", e);
    }
  }

  public void createChannel(Map<String, Object> channelMap) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel = parseChannelMap(channelMap);
      notificationManager.createNotificationChannel(channel);
    }
  }

  public void createChannelGroup(Map<String, Object> channelGroupMap) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannelGroup channelGroup = parseChannelGroupMap(channelGroupMap);
      notificationManager.createNotificationChannelGroup(channelGroup);
    }
  }

  public void createChannelGroups(List channelGroupsArray) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      List<NotificationChannelGroup> channelGroups = new ArrayList<>();
      for (int i = 0; i < channelGroupsArray.size(); i++) {
        NotificationChannelGroup channelGroup = parseChannelGroupMap((Map<String, Object>) channelGroupsArray.get(i));
        channelGroups.add(channelGroup);
      }
      notificationManager.createNotificationChannelGroups(channelGroups);
    }
  }

  public void createChannels(List channelsArray) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      List<NotificationChannel> channels = new ArrayList<>();
      for (int i = 0; i < channelsArray.size(); i++) {
        NotificationChannel channel = parseChannelMap((Map<String, Object>) channelsArray.get(i));
        channels.add(channel);
      }
      notificationManager.createNotificationChannels(channels);
    }
  }

  public void deleteChannelGroup(String groupId) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.deleteNotificationChannelGroup(groupId);
    }
  }

  public void deleteChannel(String channelId) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.deleteNotificationChannel(channelId);
    }
  }

  public void displayNotification(Map<String, Object> notification, Promise promise) {
    Bundle notificationBundle = Utils.readableMapToWritableMap(notification);
    displayNotification(notificationBundle, promise);
  }

  public void displayScheduledNotification(Bundle notification) {
    // If this isn't a repeated notification, clear it from the scheduled
    // notifications list
    if (!notification.getBundle("schedule").containsKey("repeated")
        || !notification.getBundle("schedule").getBoolean("repeated")) {
      String notificationId = notification.getString("notificationId");
      preferences.edit().remove(notificationId).apply();
    }

    if (Utils.isAppInForeground(context)) {
      // If the app is in the foregound, broadcast the notification to the RN
      // Application
      // It is up to the JS to decide whether to display the notification
      Intent scheduledNotificationEvent = new Intent(SCHEDULED_NOTIFICATION_EVENT);
      scheduledNotificationEvent.putExtra("notification", notification);
      LocalBroadcastManager.getInstance(context).sendBroadcast(scheduledNotificationEvent);
    } else {
      // If the app is in the background, then we display it automatically
      displayNotification(notification, null);
    }
  }

  public ArrayList<Bundle> getScheduledNotifications() {
    ArrayList<Bundle> array = new ArrayList<>();

    Map<String, ?> notifications = preferences.getAll();

    for (String notificationId : notifications.keySet()) {
      try {
        JSONObject json = new JSONObject((String) notifications.get(notificationId));
        Bundle bundle = BundleJSONConverter.convertToBundle(json);
        array.add(bundle);
      } catch (JSONException e) {
        Log.e(TAG, e.getMessage());
      }
    }
    return array;
  }

  public void removeAllDeliveredNotifications(Promise promise) {
    notificationManager.cancelAll();
    promise.resolve(null);
  }

  public void removeDeliveredNotification(String notificationId, Promise promise) {
    notificationManager.cancel(notificationId.hashCode());
    promise.resolve(null);
  }

  public void removeDeliveredNotificationsByTag(String tag, Promise promise) {
    StatusBarNotification[] statusBarNotifications = notificationManager.getActiveNotifications();
    for (StatusBarNotification statusBarNotification : statusBarNotifications) {
      if (statusBarNotification.getTag() == tag) {
        notificationManager.cancel(statusBarNotification.getTag(), statusBarNotification.getId());
      }
    }
    promise.resolve(null);
  }

  public void rescheduleNotifications() {
    ArrayList<Bundle> bundles = getScheduledNotifications();
    for (Bundle bundle : bundles) {
      scheduleNotification(bundle, null);
    }
  }

  public void scheduleNotification(Map<String, Object> notification, Promise promise) {
    Bundle notificationBundle = Utils.readableMapToWritableMap(notification);

    scheduleNotification(notificationBundle, promise);
  }

  private void cancelAlarm(String notificationId) {
    Intent notificationIntent = new Intent(context, FirebaseNotificationReceiver.class);
    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notificationId.hashCode(), notificationIntent,
        PendingIntent.FLAG_UPDATE_CURRENT);
    alarmManager.cancel(pendingIntent);
  }

  private void displayNotification(Bundle notification, Promise promise) {
    new DisplayNotificationTask(context, mModuleRegistry, notificationManager, notification, promise).execute();
  }

  private NotificationChannelGroup parseChannelGroupMap(Map<String, Object> channelGroupMap) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String groupId = (String) channelGroupMap.get("groupId");
      String name = (String) channelGroupMap.get("name");

      return new NotificationChannelGroup(groupId, name);
    }
    return null;
  }

  private NotificationChannel parseChannelMap(Map<String, Object> channelMap) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String channelId = (String) channelMap.get("channelId");
      String name = (String) channelMap.get("name");
      int importance = (int) channelMap.get("importance");

      NotificationChannel channel = new NotificationChannel(channelId, name, importance);
      if (channelMap.containsKey("bypassDnd")) {
        channel.setBypassDnd((Boolean) channelMap.get("bypassDnd"));
      }
      if (channelMap.containsKey("description")) {
        channel.setDescription((String) channelMap.get("description"));
      }
      if (channelMap.containsKey("group")) {
        channel.setGroup((String) channelMap.get("group"));
      }
      if (channelMap.containsKey("lightColor")) {
        String lightColor = (String) channelMap.get("lightColor");
        channel.setLightColor(Color.parseColor(lightColor));
      }
      if (channelMap.containsKey("lightsEnabled")) {
        channel.enableLights((Boolean) channelMap.get("lightsEnabled"));
      }
      if (channelMap.containsKey("lockScreenVisibility")) {
        channel.setLockscreenVisibility((Integer) channelMap.get("lockScreenVisibility"));
      }
      if (channelMap.containsKey("showBadge")) {
        channel.setShowBadge((Boolean) channelMap.get("showBadge"));
      }
      if (channelMap.containsKey("sound")) {
        Uri sound = getSound(context, (String) channelMap.get("sound"));
        channel.setSound(sound, null);
      }
      if (channelMap.containsKey("vibrationEnabled")) {
        channel.enableVibration((Boolean) channelMap.get("vibrationEnabled"));
      }
      if (channelMap.containsKey("vibrationPattern")) {
        List vibrationArray = (List) channelMap.get("vibrationPattern");
        long[] vibration = new long[] {};
        for (int i = 0; i < vibrationArray.size(); i++) {
          vibration[i] = (long) vibrationArray.get(i);
        }
        channel.setVibrationPattern(vibration);
      }
      return channel;
    }
    return null;
  }

  private void scheduleNotification(Bundle notification, @Nullable Promise promise) {
    if (!notification.containsKey("notificationId")) {
      if (promise == null) {
        Log.e(TAG, "Missing notificationId");
      } else {
        promise.reject("notification/schedule_notification_error", "Missing notificationId");
      }
      return;
    }

    if (!notification.containsKey("schedule")) {
      if (promise == null) {
        Log.e(TAG, "Missing schedule information");
      } else {
        promise.reject("notification/schedule_notification_error", "Missing schedule information");
      }
      return;
    }

    String notificationId = notification.getString("notificationId");
    Bundle schedule = notification.getBundle("schedule");

    // fireDate may be stored in the Bundle as 2 different types that we need to
    // handle:
    // 1. Double - when a call comes directly from Expo
    // 2. Long - when notifications are rescheduled from boot service (Bundle is
    // loaded from prefences).
    // At the end we need Long value (timestamp) for the scheduler
    Long fireDate = -1L;
    Object fireDateObject = schedule.get("fireDate");
    if (fireDateObject instanceof Long) {
      fireDate = (Long) fireDateObject;
    } else if (fireDateObject instanceof Double) {
      Double fireDateDouble = (Double) fireDateObject;
      fireDate = fireDateDouble.longValue();
    }

    if (fireDate == -1) {
      if (promise == null) {
        Log.e(TAG, "Missing schedule information");
      } else {
        promise.reject("notification/schedule_notification_error", "Missing fireDate information");
      }
      return;
    }

    // Scheduled alarms are cleared on restart
    // We store them so that they can be re-scheduled when the phone restarts in
    // EXFirebaseNotificationsRebootReceiver
    try {
      JSONObject json = BundleJSONConverter.convertToJSON(notification);
      preferences.edit().putString(notificationId, json.toString()).apply();
    } catch (JSONException e) {
      if (promise == null) {
        Log.e(TAG, "Failed to store notification");
      } else {
        promise.reject("notification/schedule_notification_error", "Failed to store notification", e);
      }
      return;
    }

    Intent notificationIntent = new Intent(context, FirebaseNotificationReceiver.class);
    notificationIntent.putExtras(notification);
    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notificationId.hashCode(), notificationIntent,
        PendingIntent.FLAG_UPDATE_CURRENT);

    if (schedule.containsKey("repeatInterval")) {
      // If fireDate you specify is in the past, the alarm triggers immediately.
      // So we need to adjust the time for correct operation.
      if (fireDate < System.currentTimeMillis()) {
        Log.w(TAG, "Scheduled notification date is in the past, will adjust it to be in future");
        Calendar newFireDate = Calendar.getInstance();
        Calendar pastFireDate = Calendar.getInstance();
        pastFireDate.setTimeInMillis(fireDate);

        newFireDate.set(Calendar.SECOND, pastFireDate.get(Calendar.SECOND));

        switch (schedule.getString("repeatInterval")) {
        case "minute":
          newFireDate.add(Calendar.MINUTE, 1);
          break;
        case "hour":
          newFireDate.set(Calendar.MINUTE, pastFireDate.get(Calendar.MINUTE));
          newFireDate.add(Calendar.HOUR, 1);
          break;
        case "day":
          newFireDate.set(Calendar.MINUTE, pastFireDate.get(Calendar.MINUTE));
          newFireDate.set(Calendar.HOUR_OF_DAY, pastFireDate.get(Calendar.HOUR_OF_DAY));
          newFireDate.add(Calendar.DATE, 1);
          break;
        case "week":
          newFireDate.set(Calendar.MINUTE, pastFireDate.get(Calendar.MINUTE));
          newFireDate.set(Calendar.HOUR_OF_DAY, pastFireDate.get(Calendar.HOUR_OF_DAY));
          newFireDate.set(Calendar.DATE, pastFireDate.get(Calendar.DATE));
          newFireDate.add(Calendar.DATE, 7);
          break;
        }

        fireDate = newFireDate.getTimeInMillis();
      }

      Long interval = null;
      switch (schedule.getString("repeatInterval")) {
      case "minute":
        interval = 60000L;
        break;
      case "hour":
        interval = AlarmManager.INTERVAL_HOUR;
        break;
      case "day":
        interval = AlarmManager.INTERVAL_DAY;
        break;
      case "week":
        interval = AlarmManager.INTERVAL_DAY * 7;
        break;
      default:
        Log.e(TAG, "Invalid interval: " + schedule.getString("interval"));
        break;
      }

      if (interval == null) {
        if (promise == null) {
          Log.e(TAG, "Invalid interval");
        } else {
          promise.reject("notification/schedule_notification_error", "Invalid interval");
        }
        return;
      }

      alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, fireDate, interval, pendingIntent);
    } else {
      if (schedule.containsKey("exact") && schedule.getBoolean("exact")
          && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
        alarmManager.setExact(AlarmManager.RTC_WAKEUP, fireDate, pendingIntent);
      } else {
        alarmManager.set(AlarmManager.RTC_WAKEUP, fireDate, pendingIntent);
      }
    }

    if (promise != null) {
      promise.resolve(null);
    }
  }
}
