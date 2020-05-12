package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

import expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;
import host.exp.exponent.kernel.ExperienceId;

import static versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationScheduler.EXPERIENCE_ID_KEY;
import static versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationScheduler.USER_DATA_KEY;

public class ScopedNotificationsEmitter extends NotificationsEmitter {
  private ExperienceId mExperienceId;

  public ScopedNotificationsEmitter(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public void onNotificationReceived(Notification notification) {
    if (shouldHandleNotification(notification)) {
      super.onNotificationReceived(notification);
    }
  }

  @Override
  public void onNotificationResponseReceived(NotificationResponse response) {
    if (shouldHandleNotification(response.getNotification())) {
      super.onNotificationResponseReceived(response);
    }
  }

  private boolean shouldHandleNotification(Notification notification) {
    NotificationTrigger notificationTrigger = notification.getNotificationRequest().getTrigger();
    if (notificationTrigger instanceof FirebaseNotificationTrigger) {
      Map<String, String> data = ((FirebaseNotificationTrigger) notificationTrigger).getRemoteMessage().getData();
      if (!data.containsKey("experienceId")) {
        return false;
      }
      String experienceIdString = data.get("experienceId");
      return mExperienceId.get().equals(experienceIdString);
    } else {
      JSONObject body = notification.getNotificationRequest().getContent().getBody();
      if (body == null) {
        return false;
      }
      try {
        String experienceId = body.getString(EXPERIENCE_ID_KEY);
        return mExperienceId.get().equals(experienceId);
      } catch (JSONException e) {
        Log.w("NotificationsEmitter", String.format("The notification's body should contains '%s' field.", EXPERIENCE_ID_KEY), e);
      }
    }
    return false;
  }

  @Override
  protected void emitEvent(String event, Bundle eventData) {
    super.emitEvent(event, removeExpoData(eventData));
  }

  private Bundle removeExpoData(Bundle eventData) {
    if (eventData == null) {
      return null;
    }

    Bundle notificationBundle = eventData.getBundle("notification");
    if (notificationBundle == null) {
      notificationBundle = eventData;
    }

    Bundle contentBundle = getNestedBundle(notificationBundle, "request", "content");
    if (contentBundle != null) {
      Bundle userData = getNestedBundle(contentBundle, "data", USER_DATA_KEY);
      contentBundle.putBundle("data", userData);
    }

    return eventData;
  }

  private Bundle getNestedBundle(Bundle bundle, String... keys) {
    Bundle current = bundle;
    for (String key : keys) {
      current = current.getBundle(key);
      if (current == null) {
        break;
      }
    }
    return current;
  }
}
