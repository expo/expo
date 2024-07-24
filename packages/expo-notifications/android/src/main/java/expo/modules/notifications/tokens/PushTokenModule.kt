package expo.modules.notifications.tokens

import android.os.Bundle
import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException
import expo.modules.notifications.tokens.interfaces.PushTokenListener
import expo.modules.notifications.tokens.interfaces.PushTokenManager

private const val NEW_TOKEN_EVENT_NAME = "onDevicePushToken"
private const val NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken"
private const val REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED"
private const val UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE = "E_UNREGISTER_FOR_NOTIFICATIONS_FAILED"

class PushTokenModule : Module(), PushTokenListener {
  private val tokenManager: PushTokenManager? get() = appContext.legacyModuleRegistry
    .getSingletonModule("PushTokenManager", PushTokenManager::class.java)
  private var eventEmitter: EventEmitter? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events("onDevicePushToken")

    OnCreate {
      eventEmitter = appContext.legacyModule()
        ?: throw ModuleNotFoundException(EventEmitter::class)

      // Register the module as a listener in PushTokenManager singleton module.
      // Deregistration happens in onDestroy callback.
      tokenManager?.addListener(this@PushTokenModule)
    }

    OnDestroy {
      tokenManager?.removeListener(this@PushTokenModule)
    }

    /**
     * Fetches Firebase push token and resolves the promise.
     *
     * @param promise Promise to be resolved with the token.
     */
    AsyncFunction("getDevicePushTokenAsync") { promise: Promise ->
      FirebaseMessaging.getInstance().token
        .addOnCompleteListener { task ->
          if (!task.isSuccessful) {
            val exception = task.exception
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed: ${exception?.message ?: "unknown"}", exception)
            return@addOnCompleteListener
          }
          val token = task.result
          if (token == null) {
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed. Invalid token.", null)
            return@addOnCompleteListener
          }

          promise.resolve(token)
          onNewToken(token)
        }
    }

    AsyncFunction("unregisterForNotificationsAsync") { promise: Promise ->
      FirebaseMessaging.getInstance().deleteToken()
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

  /**
   * Callback called when [PushTokenManager] gets notified of a new token.
   * Emits a [NEW_TOKEN_EVENT_NAME] event.
   *
   * @param token New push token.
   */
  override fun onNewToken(token: String) {
    eventEmitter?.let {
      val eventBody = Bundle()
      eventBody.putString(NEW_TOKEN_EVENT_TOKEN_KEY, token)
      it.emit(NEW_TOKEN_EVENT_NAME, eventBody)
    }
  }
}
