package host.exp.exponent.fcm

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate
import host.exp.exponent.ABIVersion
import host.exp.exponent.Constants
import host.exp.exponent.analytics.EXL
import host.exp.exponent.notifications.NotificationConstants
import host.exp.exponent.notifications.PushNotificationHelper
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import host.exp.exponent.storage.ExponentDB
import org.json.JSONException

class ExpoFirebaseMessagingDelegate(context: Context) : FirebaseMessagingDelegate(context) {
  override fun onNewToken(token: String) {
    if (!Constants.FCM_ENABLED) {
      return
    }
    super.onNewToken(token)
    FcmRegistrationIntentService.registerForeground(context.applicationContext, token)
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return
    }

    val scopeKey = remoteMessage.data[NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY]
    if (scopeKey == null) {
      EXL.e("expo-notifications", "No scope key found in notification")
      return
    }

    val exponentDBObject = try {
      ExponentDB.experienceScopeKeyToExperienceSync(scopeKey)
    } catch (e: JSONException) {
      e.printStackTrace()
      EXL.e("expo-notifications", "Error getting experience for scope key $scopeKey")
      return
    }

    if (exponentDBObject == null) {
      EXL.e("expo-notifications", "No experience found for scope key $scopeKey")
      return
    }

    val sdkVersionString = exponentDBObject.manifest.getSDKVersion()
    if (sdkVersionString == null) {
      dispatchToNextNotificationModule(remoteMessage)
      return
    }

    val sdkVersion = ABIVersion.toNumber(sdkVersionString) / 10000

    // Remove the entire legacy notifications API after we drop SDK 40
    if (sdkVersion <= 40 && !exponentDBObject.manifest.shouldUseNextNotificationsApi()) {
      dispatchToLegacyNotificationModule(remoteMessage)
    } else {
      dispatchToNextNotificationModule(remoteMessage)
    }
  }

  private fun dispatchToNextNotificationModule(remoteMessage: RemoteMessage) {
    super.onMessageReceived(remoteMessage)
  }

  private fun dispatchToLegacyNotificationModule(remoteMessage: RemoteMessage) {
    PushNotificationHelper.instance.onMessageReceived(
      context,
      remoteMessage.data[NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY]!!,
      remoteMessage.data["channelId"],
      remoteMessage.data["message"],
      remoteMessage.data["body"],
      remoteMessage.data["title"],
      remoteMessage.data["categoryId"]
    )
  }

  override fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    notificationTrigger: FirebaseNotificationTrigger
  ): NotificationRequest {
    if (Constants.isStandaloneApp()) {
      return super.createNotificationRequest(identifier, content, notificationTrigger)
    }

    val data = notificationTrigger.remoteMessage.data
    return ScopedNotificationRequest(
      identifier,
      content,
      notificationTrigger,
      data[NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY]
    )
  }
}
