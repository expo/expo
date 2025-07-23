package expo.modules.notifications.notifications;

import android.os.Bundle;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Serializes all the information available in {@link RemoteMessage}
 * to {@link Bundle}.
 */
public class RemoteMessageSerializer {
  /**
   * Serializes all the information available in {@link RemoteMessage}
   *
   * @param message {@link RemoteMessage} to serialize
   * @return Serialized message
   */
  public static @NonNull Bundle toBundle(RemoteMessage message) {
    Bundle serializedMessage = new Bundle();
    serializedMessage.putString("collapseKey", message.getCollapseKey());
    serializedMessage.putBundle("data", toBundle(message.getData()));
    serializedMessage.putString("from", message.getFrom());
    serializedMessage.putString("messageId", message.getMessageId());
    serializedMessage.putString("messageType", message.getMessageType());
    serializedMessage.putBundle("notification", toBundle(message.getNotification()));
    serializedMessage.putInt("originalPriority", message.getOriginalPriority());
    serializedMessage.putInt("priority", message.getPriority());
    serializedMessage.putLong("sentTime", message.getSentTime());
    serializedMessage.putString("to", message.getTo());
    serializedMessage.putInt("ttl", message.getTtl());
    return serializedMessage;
  }

  private static Bundle toBundle(Map<String, String> data) {
    Bundle serializedData = new Bundle();
    // we put the dataString in the bundle to achieve a cross-platform behavior
    // users can call JSON.parse() on the dataString to get the data in JS.
    // Converting to Bundle which would seem to be the equivalent of JSON.parse
    // lacks some dynamic properties of JSON.parse so we don't do it.
    serializedData.putString("dataString", data.getOrDefault("body", null));
    for (Map.Entry<String, String> dataEntry : data.entrySet()) {
      serializedData.putString(dataEntry.getKey(), dataEntry.getValue());
    }
    return serializedData;
  }

  private static Bundle toBundle(@Nullable RemoteMessage.Notification notification) {
    if (notification == null) {
      return null;
    }

    Bundle serializedNotification = new Bundle();
    serializedNotification.putString("body", notification.getBody());
    serializedNotification.putStringArray("bodyLocalizationArgs", notification.getBodyLocalizationArgs());
    serializedNotification.putString("bodyLocalizationKey", notification.getBodyLocalizationKey());
    serializedNotification.putString("channelId", notification.getChannelId());
    serializedNotification.putString("clickAction", notification.getClickAction());
    serializedNotification.putString("color", notification.getColor());
    serializedNotification.putBoolean("usesDefaultLightSettings", notification.getDefaultLightSettings());
    serializedNotification.putBoolean("usesDefaultSound", notification.getDefaultSound());
    serializedNotification.putBoolean("usesDefaultVibrateSettings", notification.getDefaultVibrateSettings());
    if (notification.getEventTime() != null) {
      serializedNotification.putLong("eventTime", notification.getEventTime());
    } else {
      serializedNotification.putString("eventTime", null);
    }
    serializedNotification.putString("icon", notification.getIcon());
    if (notification.getImageUrl() != null) {
      serializedNotification.putString("imageUrl", notification.getImageUrl().toString());
    } else {
      serializedNotification.putString("imageUrl", null);
    }
    serializedNotification.putIntArray("lightSettings", notification.getLightSettings());
    if (notification.getLink() != null) {
      serializedNotification.putString("link", notification.getLink().toString());
    } else {
      serializedNotification.putString("link", null);
    }
    serializedNotification.putBoolean("localOnly", notification.getLocalOnly());
    if (notification.getNotificationCount() != null) {
      serializedNotification.putInt("notificationCount", notification.getNotificationCount());
    } else {
      serializedNotification.putString("notificationCount", null);
    }
    if (notification.getNotificationPriority() != null) {
      serializedNotification.putInt("notificationPriority", notification.getNotificationPriority());
    } else {
      serializedNotification.putString("notificationPriority", null);
    }
    serializedNotification.putString("sound", notification.getSound());
    serializedNotification.putBoolean("sticky", notification.getSticky());
    serializedNotification.putString("tag", notification.getTag());
    serializedNotification.putString("ticker", notification.getTicker());
    serializedNotification.putString("title", notification.getTitle());
    serializedNotification.putStringArray("titleLocalizationArgs", notification.getTitleLocalizationArgs());
    serializedNotification.putString("titleLocalizationKey", notification.getTitleLocalizationKey());
    if (notification.getVibrateTimings() != null) {
      serializedNotification.putLongArray("vibrateTimings", notification.getVibrateTimings());
    }
    if (notification.getVisibility() != null) {
      serializedNotification.putInt("visibility", notification.getVisibility());
    } else {
      serializedNotification.putString("visibility", null);
    }
    return serializedNotification;
  }
}
