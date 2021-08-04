package host.exp.exponent.fcm;

import android.content.Context;

import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger;
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate;
import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.NotificationConstants;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentDBObject;

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

    String scopeKey = remoteMessage.getData().get(NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY);

    @Nullable ExponentDBObject exponentDBObject;
    try {
      exponentDBObject = ExponentDB.experienceScopeKeyToExperienceSync(scopeKey);
    } catch (JSONException e) {
      e.printStackTrace();
      EXL.e("expo-notifications", "Error getting experience for scope key " + scopeKey);
      return;
    }

    if (exponentDBObject == null) {
      EXL.e("expo-notifications", "No experience found for scope key " + scopeKey);
      return;
    }

    String sdkVersionString = exponentDBObject.getManifest().getSDKVersionNullable();
    if (sdkVersionString == null) {
      dispatchToNextNotificationModule(remoteMessage);
      return;
    }

    int sdkVersion = ABIVersion.toNumber(sdkVersionString) / 10000;

    // Remove the entire legacy notifications API after we drop SDK 40
    if (sdkVersion <= 40 && !exponentDBObject.getManifest().shouldUseNextNotificationsApi()) {
      dispatchToLegacyNotificationModule(remoteMessage);
    } else {
      dispatchToNextNotificationModule(remoteMessage);
    }
  }

  private void dispatchToNextNotificationModule(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);
  }

  private void dispatchToLegacyNotificationModule(RemoteMessage remoteMessage) {
    PushNotificationHelper.getInstance().onMessageReceived(getContext(), remoteMessage.getData().get(NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY), remoteMessage.getData().get("channelId"), remoteMessage.getData().get("message"), remoteMessage.getData().get("body"), remoteMessage.getData().get("title"), remoteMessage.getData().get("categoryId"));
  }

  @NonNull
  @Override
  protected NotificationRequest createNotificationRequest(@NonNull String identifier, @NonNull NotificationContent content, FirebaseNotificationTrigger notificationTrigger) {
    if (Constants.isStandaloneApp()) {
      return super.createNotificationRequest(identifier, content, notificationTrigger);
    }
    Map<String, String> data = notificationTrigger.getRemoteMessage().getData();
    return new ScopedNotificationRequest(identifier, content, notificationTrigger, data.get(NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY));
  }
}
