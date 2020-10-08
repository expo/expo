package host.exp.exponent.fcm;

import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

import expo.modules.notifications.FirebaseListenerService;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;


public class ScopedExpoFcmMessagingService extends ExpoFcmMessagingService {
  @NonNull
  @Override
  protected NotificationRequest createNotificationRequest(@NonNull String identifier, @NonNull NotificationContent content, FirebaseNotificationTrigger notificationTrigger) {
    ExperienceId experienceId;
    Map<String, String> data = notificationTrigger.getRemoteMessage().getData();
    if (!data.containsKey("experienceId")) {
      experienceId = null;
    } else {
      experienceId = ExperienceId.create(data.get("experienceId"));
    }
    String experienceIdString = experienceId == null ? null : experienceId.get();
    return new ScopedNotificationRequest(identifier, content, notificationTrigger, experienceIdString);
  }
}
