package expo.modules.notifications.notifications;

import static expo.modules.notifications.UtilsKt.filteredBundleForJSTypeConverter;
import static expo.modules.notifications.UtilsKt.isValidJSONString;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.google.firebase.messaging.RemoteMessage;

import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONObject;
import expo.modules.core.arguments.MapArguments;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import expo.modules.notifications.notifications.interfaces.INotificationContent;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.model.TextInputNotificationResponse;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;

import expo.modules.notifications.notifications.triggers.DailyTrigger;
import expo.modules.notifications.notifications.triggers.DateTrigger;
import expo.modules.notifications.notifications.triggers.MonthlyTrigger;
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
    serializedNotification.putLong("date", notification.getOriginDate().getTime());
    return serializedNotification;
  }

  public static Bundle toBundle(NotificationRequest request) {
    Bundle serializedRequest = new Bundle();
    serializedRequest.putString("identifier", request.getIdentifier());
    NotificationTrigger requestTrigger = request.getTrigger();
    serializedRequest.putBundle("trigger", requestTrigger == null ? null : requestTrigger.toBundle());
    Bundle content = toBundle(request.getContent());
    Bundle existingContentData = content.getBundle("data");
    if (existingContentData == null) {
      if(requestTrigger instanceof FirebaseNotificationTrigger trigger) {
        RemoteMessage message = trigger.getRemoteMessage();
        RemoteMessage.Notification notification = message.getNotification();
        Map<String, String> data = message.getData();
        String dataBody = data.get("body");
        String notificationBody = notification != null ? notification.getBody() : null;
        if (isValidJSONString(dataBody) && notificationBody != null && notificationBody.equals(data.get("message"))) {
          // Expo sends notification.body as data.message, and JSON stringifies data.body
          content.putString("dataString", dataBody);
        } else {
          // The message was sent directly from Firebase or some other service,
          // and we copy the data as is
          content.putBundle("data", toBundle(data));
        }
      } else if(
        requestTrigger instanceof SchedulableNotificationTrigger ||
          requestTrigger == null
      ) {
        JSONObject body = request.getContent().getBody();
        if (body != null) {
          // Expo sends notification.body as data.message, and JSON stringifies data.body
          content.putString("dataString", body.toString());
        }
      }
    }
    serializedRequest.putBundle("content", content);
    return serializedRequest;
  }

  public static Bundle toBundle(Map<String, String> map) {
    Bundle result = new Bundle();
    for (String key: map.keySet()) {
      result.putString(key, map.get(key));
    }
    return result;
  }

  public static Bundle toBundle(INotificationContent content) {
    Bundle serializedContent = new Bundle();
    serializedContent.putString("title", content.getTitle());
    serializedContent.putString("subtitle", content.getSubText());
    serializedContent.putString("body", content.getText());
    if (content.getColor() != null) {
      serializedContent.putString("color", String.format("#%08X", content.getColor().intValue()));
    }

    if (content.getBadgeCount() != null) {
      serializedContent.putInt("badge", content.getBadgeCount().intValue());
    } else {
      serializedContent.putString("badge", null);
    }
    if (content.getShouldPlayDefaultSound()) {
      serializedContent.putString("sound", "default");
    } else if (content.getSoundName() != null) {
      serializedContent.putString("sound", "custom");
    } else {
      serializedContent.putString("sound", null);
    }
    if (content.getPriority() != null) {
      serializedContent.putString("priority", content.getPriority().getEnumValue());
    }
    if (content.getVibrationPattern() != null) {
      serializedContent.putIntArray("vibrationPattern", RemoteMessageSerializer.intArrayFromLongArray(content.getVibrationPattern()));
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

  @NotNull
  public static Bundle toResponseBundleFromExtras(Bundle extras) {
    Bundle serializedContent = new Bundle();
    serializedContent.putString("title", extras.getString("title"));
    String body = extras.getString("body");
    if (isValidJSONString(body) ) {
      // If the body is a JSON string,
      // the notification was sent by the Expo notification service,
      // so we do the expected remapping of fields
      serializedContent.putString("dataString", body);
      serializedContent.putString("body", extras.getString("message"));
    } else {
      // The notification came directly from Firebase or some other service,
      // so we copy the data as is from the extras bundle, after
      // ensuring it can be converted for emitting to JS
      serializedContent.putBundle("data", filteredBundleForJSTypeConverter(extras));
    }

    Bundle serializedTrigger = new Bundle();
    serializedTrigger.putString("type", "push");
    serializedTrigger.putString("channelId", extras.getString("channelId"));

    Bundle serializedRequest = new Bundle();
    serializedRequest.putString("identifier", extras.getString("google.message_id"));
    serializedRequest.putBundle("trigger", serializedTrigger);
    serializedRequest.putBundle("content", serializedContent);

    Bundle serializedNotification = new Bundle();
    serializedNotification.putLong("date", extras.getLong("google.sent_time"));
    serializedNotification.putBundle("request", serializedRequest);

    Bundle serializedResponse = new Bundle();
    serializedResponse.putString("actionIdentifier", "expo.modules.notifications.actions.DEFAULT");
    serializedResponse.putBundle("notification", serializedNotification);

    return serializedResponse;
  }

}
