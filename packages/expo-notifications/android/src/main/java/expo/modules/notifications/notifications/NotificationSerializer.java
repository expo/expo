package expo.modules.notifications.notifications;

import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;
import expo.modules.core.arguments.MapArguments;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.model.TextInputNotificationResponse;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;

import expo.modules.notifications.notifications.triggers.ChannelAwareTrigger;
import expo.modules.notifications.notifications.triggers.DailyTrigger;
import expo.modules.notifications.notifications.triggers.DateTrigger;
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger;
import expo.modules.notifications.notifications.triggers.WeeklyTrigger;
import expo.modules.notifications.notifications.triggers.YearlyTrigger;

public class NotificationSerializer {
  public static Bundle toBundle(NotificationResponse response) {
    Bundle serializedResponse = new Bundle();
    serializedResponse.putString("actionIdentifier", response.getActionIdentifier());
    serializedResponse.putBundle("notification", toBundle(response.getNotification()));
    if (response instanceof TextInputNotificationResponse) {
      serializedResponse.putString("userText", ((TextInputNotificationResponse) response).getUserText());
    }
    return serializedResponse;
  }

  public static Bundle toBundle(Notification notification) {
    Bundle serializedNotification = new Bundle();
    serializedNotification.putBundle("request", toBundle(notification.getNotificationRequest()));
    serializedNotification.putLong("date", notification.getDate().getTime());
    return serializedNotification;
  }

  public static Bundle toBundle(NotificationRequest request) {
    Bundle serializedRequest = new Bundle();
    serializedRequest.putString("identifier", request.getIdentifier());
    serializedRequest.putBundle("content", toBundle(request.getContent()));
    serializedRequest.putBundle("trigger", toBundle(request.getTrigger()));
    return serializedRequest;
  }

  public static Bundle toBundle(NotificationContent content) {
    Bundle serializedContent = new Bundle();
    serializedContent.putString("title", content.getTitle());
    serializedContent.putString("subtitle", content.getSubtitle());
    serializedContent.putString("body", content.getText());
    if (content.getColor() != null) {
      serializedContent.putString("color", String.format("#%08X", content.getColor().intValue()));
    }
    serializedContent.putBundle("data", toBundle(content.getBody()));
    if (content.getBadgeCount() != null) {
      serializedContent.putInt("badge", content.getBadgeCount().intValue());
    } else {
      serializedContent.putString("badge", null);
    }
    if (content.shouldPlayDefaultSound()) {
      serializedContent.putString("sound", "default");
    } else if (content.getSound() != null) {
      serializedContent.putString("sound", "custom");
    } else {
      serializedContent.putString("sound", null);
    }
    if (content.getPriority() != null) {
      serializedContent.putString("priority", content.getPriority().getEnumValue());
    }
    if (content.getVibrationPattern() != null) {
      double[] serializedVibrationPattern = new double[content.getVibrationPattern().length];
      for (int i = 0; i < serializedVibrationPattern.length; i++) {
        serializedVibrationPattern[i] = content.getVibrationPattern()[i];
      }
      serializedContent.putDoubleArray("vibrationPattern", serializedVibrationPattern);
    }
    serializedContent.putBoolean("autoDismiss", content.isAutoDismiss());
    if (content.getCategoryId() != null) {
      serializedContent.putString("categoryIdentifier", content.getCategoryId());
    }
    serializedContent.putBoolean("sticky", content.isSticky());
    return serializedContent;
  }

  public static Bundle toBundle(@Nullable JSONObject notification) {
    if (notification == null) {
      return null;
    }
    Map<String, Object> notificationMap = new HashMap<>(notification.length());
    Iterator<String> keyIterator = notification.keys();
    while (keyIterator.hasNext()) {
      String key = keyIterator.next();
      Object value = notification.opt(key);
      if (value instanceof JSONObject) {
        notificationMap.put(key, toBundle((JSONObject) value));
      } else if (value instanceof JSONArray) {
        notificationMap.put(key, toList((JSONArray) value));
      } else if (JSONObject.NULL.equals(value)) {
        notificationMap.put(key, null);
      } else {
        notificationMap.put(key, value);
      }
    }
    try {
      return new MapArguments(notificationMap).toBundle();
    } catch (NullPointerException e) {
      // If a NullPointerException was thrown it most probably means
      // that @unimodules/core is at < 5.1.1 where we introduced
      // support for null values in MapArguments' map). Let's go through
      // the map and remove the null values to be backwards compatible.

      Set<String> keySet = notificationMap.keySet();
      for (String key : keySet) {
        if (notificationMap.get(key) == null) {
          notificationMap.remove(key);
        }
      }
      return new MapArguments(notificationMap).toBundle();
    }
  }

  private static List<Object> toList(JSONArray array) {
    List<Object> result = new ArrayList<>(array.length());
    for (int i = 0; i < array.length(); i++) {
      if (array.isNull(i)) {
        result.add(null);
      } else if (array.optJSONObject(i) != null) {
        result.add(toBundle(array.optJSONObject(i)));
      } else if (array.optJSONArray(i) != null) {
        result.add(toList(array.optJSONArray(i)));
      } else {
        result.add(array.opt(i));
      }
    }
    return result;
  }

  private static Bundle toBundle(@Nullable NotificationTrigger trigger) {
    if (trigger == null) {
      return null;
    }
    Bundle bundle = new Bundle();
    if (trigger instanceof FirebaseNotificationTrigger) {
      bundle.putString("type", "push");
      bundle.putBundle("remoteMessage", RemoteMessageSerializer.toBundle(((FirebaseNotificationTrigger) trigger).getRemoteMessage()));
    } else if (trigger instanceof TimeIntervalTrigger) {
      bundle.putString("type", "timeInterval");
      bundle.putBoolean("repeats", ((TimeIntervalTrigger) trigger).isRepeating());
      bundle.putLong("seconds", ((TimeIntervalTrigger) trigger).getTimeInterval());
    } else if (trigger instanceof DateTrigger) {
      bundle.putString("type", "date");
      bundle.putBoolean("repeats", false);
      bundle.putLong("value", ((DateTrigger) trigger).getTriggerDate().getTime());
    } else if (trigger instanceof DailyTrigger) {
      bundle.putString("type", "daily");
      bundle.putInt("hour", ((DailyTrigger) trigger).getHour());
      bundle.putInt("minute", ((DailyTrigger) trigger).getMinute());
    } else if (trigger instanceof WeeklyTrigger) {
      bundle.putString("type", "weekly");
      bundle.putInt("weekday", ((WeeklyTrigger) trigger).getWeekday());
      bundle.putInt("hour", ((WeeklyTrigger) trigger).getHour());
      bundle.putInt("minute", ((WeeklyTrigger) trigger).getMinute());
    } else if (trigger instanceof YearlyTrigger) {
      bundle.putString("type", "yearly");
      bundle.putInt("day", ((YearlyTrigger) trigger).getDay());
      bundle.putInt("month", ((YearlyTrigger) trigger).getMonth());
      bundle.putInt("hour", ((YearlyTrigger) trigger).getHour());
      bundle.putInt("minute", ((YearlyTrigger) trigger).getMinute());
    } else {
      bundle.putString("type", "unknown");
    }
    bundle.putString("channelId", getChannelId(trigger));

    return bundle;
  }

  @Nullable
  private static String getChannelId(NotificationTrigger trigger) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      return trigger.getNotificationChannel();
    }
    return null;
  }
}
