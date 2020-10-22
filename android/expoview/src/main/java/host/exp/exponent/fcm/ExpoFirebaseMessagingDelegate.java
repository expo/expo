package host.exp.exponent.fcm;

import android.content.Context;

import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

import androidx.annotation.NonNull;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;

public class ExpoFirebaseMessagingDelegate extends FirebaseMessagingDelegate {
  public ExpoFirebaseMessagingDelegate(@NonNull Context context) {
    super(context);
  }

  @Override
  public void onNewToken(@NonNull String token) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    super.onNewToken(token);
    FcmRegistrationIntentService.registerForeground(getContext().getApplicationContext(), token);
  }

  @Override
  public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    ExperienceDBObject experienceDBObject = ExponentDB.experienceIdToExperienceSync(remoteMessage.getData().get("experienceId"));
    if (experienceDBObject != null) {
      try {
        JSONObject manifest = new JSONObject(experienceDBObject.manifest);
        int sdkVersion = ABIVersion.toNumber(manifest.getString("sdkVersion")) / 10000;

        // If an experience is on SDK newer than 39, that is SDK40 and beyond up till UNVERSIONED
        // we only use the new notifications API as it is going to be removed from SDK40.
        if (sdkVersion >= 40) {
          dispatchToNextNotificationModule(remoteMessage);
          return;
        } else if (sdkVersion == 38 || sdkVersion == 39) {
          // In SDK38 and 39 we want to let people decide which notifications API to use,
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
        EXL.e("expo-notifications", "Couldn't parse the manifest.");
      }
    } else {
      EXL.e("expo-notifications", "No experience found for id " + remoteMessage.getData().get("experienceId"));
    }
  }

  private void dispatchToNextNotificationModule(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);
  }

  private void dispatchToLegacyNotificationModule(RemoteMessage remoteMessage) {
    PushNotificationHelper.getInstance().onMessageReceived(getContext(), remoteMessage.getData().get("experienceId"), remoteMessage.getData().get("channelId"), remoteMessage.getData().get("message"), remoteMessage.getData().get("body"), remoteMessage.getData().get("title"), remoteMessage.getData().get("categoryId"));
  }

  @NonNull
  @Override
  protected NotificationRequest createNotificationRequest(@NonNull String identifier, @NonNull NotificationContent content, FirebaseNotificationTrigger notificationTrigger) {
    if (Constants.isStandaloneApp()) {
      return super.createNotificationRequest(identifier, content, notificationTrigger);
    }
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
