package expo.modules.notifications.tokens

import android.content.Context
import android.os.Bundle
import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.notifications.tokens.interfaces.PushTokenListener
import expo.modules.notifications.tokens.interfaces.PushTokenManager

private const val NEW_TOKEN_EVENT_NAME = "onDevicePushToken"
private const val NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken"
private const val REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED"
private const val UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE = "E_UNREGISTER_FOR_NOTIFICATIONS_FAILED"

class PushTokenModule(context: Context) : ExportedModule(context), PushTokenListener {
  private lateinit var tokenManager: PushTokenManager
  private var eventEmitter: EventEmitter? = null
  override fun getName(): String = "ExpoPushTokenManager"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

    // Register the module as a listener in PushTokenManager singleton module.
    // Deregistration happens in onDestroy callback.
    tokenManager = requireNotNull(
      moduleRegistry.getSingletonModule("PushTokenManager", PushTokenManager::class.java)
    )
    tokenManager.addListener(this)
  }

  override fun onDestroy() {
    tokenManager.removeListener(this)
  }

  /**
   * Fetches Firebase push token and resolves the promise.
   *
   * @param promise Promise to be resolved with the token.
   */
  @ExpoMethod
  fun getDevicePushTokenAsync(promise: Promise) {
    FirebaseMessaging.getInstance().token
      .addOnCompleteListener { task ->
        if (!task.isSuccessful) {
          val exception = task.exception
          if (exception == null) {
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed.")
          } else {
            promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed: ${exception.message}", exception)
          }
          return@addOnCompleteListener
        }
        val token = task.result
        if (token == null) {
          promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed. Invalid token.")
          return@addOnCompleteListener
        }

        promise.resolve(token)
        onNewToken(token)
      }
  }

  @ExpoMethod
  fun unregisterForNotificationsAsync(promise: Promise) {
    FirebaseMessaging.getInstance().deleteToken()
      .addOnCompleteListener { task ->
        if (!task.isSuccessful) {
          val exception = task.exception
          if (exception == null) {
            promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Unregistering for notifications failed.")
          } else {
            promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Unregistering for notifications failed: ${exception.message}", exception)
          }
          return@addOnCompleteListener
        }
        promise.resolve(null)
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
