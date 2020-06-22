package host.exp.exponent.fcm;

import android.util.Log;

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
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.notifications.ScopedNotificationRequest;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;


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

    ExponentDB.experienceIdToExperience(remoteMessage.getData().get("experienceId"), new ExponentDB.ExperienceResultListener() {
      @Override
      public void onSuccess(ExperienceDBObject experience) {
        try {
          JSONObject manifest = new JSONObject(experience.manifest);
          int sdkVersion = ABIVersion.toNumber(manifest.getString("sdkVersion")) / 10000;

          // If an experience is on SDK newer than 38, that is SDK39 and beyond up till UNVERSIONED
          // we only use the new notifications API as it is going to be removed from SDK39.
          if (sdkVersion >= 39) {
            dispatchToNextNotificationModule(remoteMessage);
            return;
          } else if (sdkVersion == 38) {
            // In SDK38 we want to let people decide which notifications API to use,
            // the next or the legacy one.
            JSONObject androidSection = manifest.optJSONObject("android");
            if (androidSection != null) {
              boolean useNextNotificationsApi = androidSection.optBoolean("useNextNotificationsApi", false);
              if (useNextNotificationsApi) {
                dispatchToNextNotificationModule(remoteMessage);
                return;
              }
            }
          }
          // If it's an older experience or useNextNotificationsApi is set to false, let's use the legacy notifications API
          dispatchToLegacyNotificationModule(remoteMessage);
        } catch (JSONException e) {
          e.printStackTrace();
          onFailure();
        }
      }

      @Override
      public void onFailure() {
        Log.w("expo-notifications", "Couldn't get experience from remote message.", null);
        dispatchToLegacyNotificationModule(remoteMessage);
      }
    });
  }

  private void dispatchToNextNotificationModule(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);
  }

  private void dispatchToLegacyNotificationModule(RemoteMessage remoteMessage) {
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
