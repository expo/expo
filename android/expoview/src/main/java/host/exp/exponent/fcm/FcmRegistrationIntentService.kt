package host.exp.exponent.fcm

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import host.exp.exponent.notifications.ExponentNotificationIntentService
import host.exp.exponent.storage.ExponentSharedPreferences
import java.io.IOException

class FcmRegistrationIntentService : ExponentNotificationIntentService(TAG) {
  var mToken: String? = null

  @Throws(IOException::class)
  override fun getToken(): String {
    if (mToken == null) {
      throw IOException("No FCM token found")
    }
    Log.d("FCM Device Token", mToken!!)
    return mToken!!
  }

  override fun getSharedPrefsKey(): ExponentSharedPreferences.ExponentSharedPreferencesKey {
    return ExponentSharedPreferences.ExponentSharedPreferencesKey.FCM_TOKEN_KEY
  }

  override fun getServerType(): String {
    return "fcm"
  }

  companion object {
    private val TAG = FcmRegistrationIntentService::class.java.simpleName

    fun getTokenAndRegister(context: Context) {
      FirebaseMessaging.getInstance().token.addOnSuccessListener { instanceIdResult ->
        registerForeground(
          context,
          instanceIdResult
        )
      }
        .addOnFailureListener { e ->
          Log.e(
            "FCM Device Token",
            "Error calling getToken " + e.localizedMessage
          )
        }
    }

    fun registerForeground(context: Context, token: String) {
      FcmRegistrationIntentService().apply {
        attachBaseContext(context)
        mToken = token
        onHandleIntent(null)
      }
    }
  }
}
