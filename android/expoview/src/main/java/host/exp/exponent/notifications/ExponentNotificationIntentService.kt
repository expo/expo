package host.exp.exponent.notifications

import android.app.IntentService
import android.content.Intent
import android.util.Log
import com.facebook.soloader.SoLoader
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExponentUrls
import host.exp.exponent.network.ExpoHttpCallback
import host.exp.exponent.network.ExpoResponse
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.AsyncCondition
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import javax.inject.Inject

abstract class ExponentNotificationIntentService(name: String?) : IntentService(name) {
  @Throws(IOException::class)
  abstract fun getToken(): String?

  abstract fun getSharedPrefsKey(): ExponentSharedPreferences.ExponentSharedPreferencesKey

  abstract fun getServerType(): String

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var exponentNetwork: ExponentNetwork

  var isInitialized = false

  private fun initialize() {
    if (isInitialized) {
      return
    }
    try {
      NativeModuleDepsProvider.instance.inject(ExponentNotificationIntentService::class.java, this)
      isInitialized = true
    } catch (e: Throwable) {
    }
  }

  override fun onCreate() {
    super.onCreate()
    initialize()
  }

  /*
   *  This function MUST set AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
   *  eventually. Otherwise it's possible for us to get in a state where
   *  the AsyncCondition listeners are never called (and the promise from
   *  getExpoPushTokenAsync never resolves).
   */
  override fun onHandleIntent(intent: Intent?) {
    initialize()
    try {
      val token = getToken()
      if (token == null) {
        setTokenError("Device push token is null")
        return
      }

      val sharedPreferencesToken = exponentSharedPreferences.getString(getSharedPrefsKey())
      if (sharedPreferencesToken == token) {
        // Server already has this token, don't need to send it again.
        AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY)
        return
      }

      // Needed for Arguments.createMap
      SoLoader.init(this, false)

      val uuid = exponentSharedPreferences.getOrCreateUUID()
      try {
        val params = JSONObject().apply {
          put("deviceToken", token)
          put("deviceId", uuid)
          put("appId", applicationContext.packageName)
          put("type", getServerType())
        }

        val body = params.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        val request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/updateDeviceToken")
          .header("Content-Type", "application/json")
          .post(body)
          .build()

        exponentNetwork.client.call(
          request,
          object : ExpoHttpCallback {
            override fun onFailure(e: IOException) {
              setTokenError(e)
            }

            @Throws(IOException::class)
            override fun onResponse(response: ExpoResponse) {
              if (!response.isSuccessful) {
                setTokenError("Failed to update the native device token with the Expo push notification service")
                return
              }
              exponentSharedPreferences.setString(getSharedPrefsKey(), token)
              hasTokenError = false
              AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY)
            }
          }
        )
        Log.i(TAG, "${getServerType()} Registration Token: $token")
      } catch (e: JSONException) {
        setTokenError(e)
      }
    } catch (e: SecurityException) {
      setTokenError("Are you running in Genymotion? Follow this guide https://inthecheesefactory.com/blog/how-to-install-google-services-on-genymotion/en to install Google Play Services")
    } catch (e: IOException) {
      setTokenError(e)
    }
  }

  private fun setTokenError(e: Exception) {
    hasTokenError = true
    AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY)
    EXL.e(TAG, e)
  }

  private fun setTokenError(message: String) {
    hasTokenError = true
    AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY)
    EXL.e(TAG, message)
  }

  companion object {
    private val TAG = ExponentNotificationIntentService::class.java.simpleName

    const val DEVICE_PUSH_TOKEN_KEY = "devicePushToken"

    var hasTokenError = false
      private set
  }
}
