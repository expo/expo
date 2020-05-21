package host.exp.exponent.fcm;

import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

import expo.modules.notifications.FirebaseListenerService;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.PushNotificationHelper;
import versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationRequest;

public class ExpoFcmMessagingService extends FirebaseListenerService {

  @Override
  public void onNewToken(String token) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    super.onNewToken(token);
    FcmRegistrationIntentService.registerForeground(getApplicationContext(), token);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    super.onMessageReceived(remoteMessage);
    PushNotificationHelper.getInstance().onMessageReceived(this, remoteMessage.getData().get("experienceId"), remoteMessage.getData().get("channelId"), remoteMessage.getData().get("message"), remoteMessage.getData().get("body"), remoteMessage.getData().get("title"), remoteMessage.getData().get("categoryId"));
  }

  @Override
  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, FirebaseNotificationTrigger notificationTrigger) {
    ExperienceId experienceId;
    Map<String, String> data = notificationTrigger.getRemoteMessage().getData();
    if (!data.containsKey("experienceId")) {
      experienceId = null;
    } else {
      experienceId = ExperienceId.create(data.get("experienceId"));
    }
    return new ScopedNotificationRequest(identifier, content, notificationTrigger, experienceId);
  }
}
