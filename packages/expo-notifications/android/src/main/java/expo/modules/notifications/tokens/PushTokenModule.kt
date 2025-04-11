package expo.modules.notifications.tokens

import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate.Companion.addTokenListener
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener

private const val NEW_TOKEN_EVENT_NAME = "onDevicePushToken"
private const val NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken"
private const val REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED"
private const val UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE = "E_UNREGISTER_FOR_NOTIFICATIONS_FAILED"

class PushTokenModule : Module(), FirebaseTokenListener {
  /**
   * Callback called when [FirebaseMessagingDelegate] gets notified of a new token.
   * Emits a [NEW_TOKEN_EVENT_NAME] event.
   *
   * @param token New push token.
   */
  override fun onNewToken(token: String) {
    sendEvent(
      NEW_TOKEN_EVENT_NAME,
      mapOf(
        NEW_TOKEN_EVENT_TOKEN_KEY to token
      )
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events("onDevicePushToken")

    OnCreate {
      addTokenListener(this@PushTokenModule)
    }

    /**
     * Fetches Firebase push token and resolves the promise.
     *
     * @param promise Promise to be resolved with the token.
     */
    AsyncFunction("getDevicePushTokenAsync") { promise: Promise ->
      val instance = getFirebaseMessagingInstance(promise) ?: return@AsyncFunction
      instance.token
        .addOnCompleteListener { task ->
          if (!task.isSuccessful) {
            val exception = task.exception
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed: ${exception?.message ?: "unknown"}", exception)
            return@addOnCompleteListener
          }
          val token = task.result ?: run {
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed. Invalid token.", null)
            return@addOnCompleteListener
          }

          promise.resolve(token)
          onNewToken(token)
        }
    }

    AsyncFunction("unregisterForNotificationsAsync") { promise: Promise ->
      val instance = getFirebaseMessagingInstance(promise) ?: return@AsyncFunction
      instance.deleteToken()
        .addOnCompleteListener { task ->
          if (!task.isSuccessful) {
            val exception = task.exception
            promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Unregistering for notifications failed: ${exception?.message ?: "unknown"}", exception)
            return@addOnCompleteListener
          }
          promise.resolve(null)
        }
    }
  }

  private fun getFirebaseMessagingInstance(promise: Promise): FirebaseMessaging? {
    return try {
      FirebaseMessaging.getInstance()
    } catch (e: IllegalStateException) {
      promise.reject(
        REGISTRATION_FAIL_CODE,
        "Make sure to complete the guide at https://docs.expo.dev/push-notifications/fcm-credentials/ : ${e.message}",
        e
      )
      null
    }
  }
}
