package expo.modules.facebook

import expo.modules.core.Promise
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager

import com.facebook.CallbackManager
import com.facebook.FacebookSdk
import com.facebook.AccessToken
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.appevents.AppEventsLogger
import com.facebook.internal.AttributionIdentifiers
import com.facebook.login.LoginManager
import com.facebook.login.LoginBehavior
import com.facebook.login.LoginResult

import android.os.Bundle
import android.app.Activity
import android.content.Context
import android.content.Intent

import java.lang.Exception
import java.lang.IllegalStateException
import java.math.BigDecimal
import java.util.*

private const val ERR_FACEBOOK_MISCONFIGURED = "ERR_FACEBOOK_MISCONFIGURED"
private const val ERR_FACEBOOK_LOGIN = "ERR_FACEBOOK_LOGIN"
private const val PUSH_PAYLOAD_KEY = "fb_push_payload"
private const val PUSH_PAYLOAD_CAMPAIGN_KEY = "campaign"

open class FacebookModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {
  private val callbackManager: CallbackManager = CallbackManager.Factory.create()
  private var appEventLogger: AppEventsLogger? = null
  private var attributionIdentifiers: AttributionIdentifiers? = null
  protected var appId: String? = null
    private set
  protected var appName: String? = null
    private set
  private val uIManager: UIManager by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun getName() = "ExponentFacebook"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    uIManager.registerActivityEventListener(this)
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    callbackManager.onActivityResult(requestCode, resultCode, data)
  }

  override fun onNewIntent(intent: Intent) = Unit

  private fun bundleWithNullValuesAsStrings(parameters: ReadableArguments?): Bundle {
    return Bundle().apply {
      if (parameters != null) {
        for (key in parameters.keys()) {
          val value = parameters[key]
          when (value) {
            null -> putString(key, "null")
            is String -> putString(key, value)
            is Int -> putInt(key, value)
            is Double -> putDouble(key, value)
            is Long -> putLong(key, value)
          }
        }
      }
    }
  }

  @ExpoMethod
  fun setAutoLogAppEventsEnabledAsync(enabled: Boolean, promise: Promise) {
    FacebookSdk.setAutoLogAppEventsEnabled(enabled)
    promise.resolve(null)
  }

  @ExpoMethod
  fun setAdvertiserIDCollectionEnabledAsync(enabled: Boolean, promise: Promise) {
    FacebookSdk.setAdvertiserIDCollectionEnabled(enabled)
    promise.resolve(null)
  }

  @ExpoMethod
  open fun getAuthenticationCredentialAsync(promise: Promise) {
    val accessToken = AccessToken.getCurrentAccessToken()
    promise.resolve(accessTokenToBundle(accessToken))
  }

  private fun accessTokenToBundle(accessToken: AccessToken?): Bundle? {
    return accessToken?.let {
      Bundle().apply {
        putString("token", it.token)
        putString("userId", it.userId)
        putString("appId", it.applicationId)
        putStringArrayList("permissions", ArrayList(it.permissions))
        putStringArrayList("declinedPermissions", ArrayList(it.declinedPermissions))
        putStringArrayList("expiredPermissions", ArrayList(it.expiredPermissions))
        putDouble("expirationDate", it.expires.time.toDouble())
        putDouble("dataAccessExpirationDate", it.dataAccessExpirationTime.time.toDouble())
        putDouble("refreshDate", it.lastRefresh.time.toDouble())
        putString("tokenSource", it.source.name)
      }
    }
  }

  @ExpoMethod
  open fun initializeAsync(options: ReadableArguments, promise: Promise) {
    try {
      options.getString("appId")?.let {
        appId = it
        FacebookSdk.setApplicationId(appId)
      }
      options.getString("appName")?.let {
        appName = it
        FacebookSdk.setApplicationName(appName)
      }
      options.getString("version")?.let {
        FacebookSdk.setGraphApiVersion(it)
      }
      options.getString("domain")?.let {
        FacebookSdk.setFacebookDomain(it)
      }
      if (options.containsKey("autoLogAppEvents")) {
        FacebookSdk.setAutoLogAppEventsEnabled(options.getBoolean("isDebugEnabled"))
      }
      if (options.containsKey("isDebugEnabled")) {
        FacebookSdk.setAutoLogAppEventsEnabled(options.getBoolean("isDebugEnabled"))
      }
      FacebookSdk.sdkInitialize(context) {
        FacebookSdk.fullyInitialize()
        appId = FacebookSdk.getApplicationId()
        appName = FacebookSdk.getApplicationName()
        appEventLogger = AppEventsLogger.newLogger(context)
        attributionIdentifiers = AttributionIdentifiers.getAttributionIdentifiers(context)
        promise.resolve(null)
      }
    } catch (e: Exception) {
      promise.reject(ERR_FACEBOOK_MISCONFIGURED, "An error occurred while trying to initialize a FBSDK app", e)
    }
  }

  @ExpoMethod
  open fun logOutAsync(promise: Promise) {
    AccessToken.setCurrentAccessToken(null)
    LoginManager.getInstance().logOut()
    promise.resolve(null)
  }

  @ExpoMethod
  open fun logInWithReadPermissionsAsync(config: ReadableArguments, promise: Promise) {
    if (FacebookSdk.getApplicationId() == null) {
      promise.reject(
        ERR_FACEBOOK_MISCONFIGURED,
        "No appId configured, required for initialization. " +
          "Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside AndroidManifest.xml."
      )
      return
    }

    // Log out
    AccessToken.setCurrentAccessToken(null)
    LoginManager.getInstance().logOut()

    // Convert permissions
    val permissions = config.getList("permissions", listOf("public_profile", "email")) as List<String?>
    if (config.containsKey("behavior")) {
      val behavior = when (config.getString("behavior")) {
        "browser" -> LoginBehavior.WEB_ONLY
        "web" -> LoginBehavior.WEB_VIEW_ONLY
        else -> LoginBehavior.NATIVE_WITH_FALLBACK
      }
      LoginManager.getInstance().loginBehavior = behavior
    }
    LoginManager.getInstance().registerCallback(
      callbackManager,
      object : FacebookCallback<LoginResult> {
        override fun onSuccess(loginResult: LoginResult) {
          LoginManager.getInstance().registerCallback(callbackManager, null)

          // This is the only route through which we send an access token back. Make sure the
          // application ID is correct.
          if (appId != loginResult.accessToken.applicationId) {
            promise.reject(IllegalStateException("Logged into wrong app, try again?"))
            return
          }
          val response = accessTokenToBundle(loginResult.accessToken)?.apply {
            putString("type", "success")
          }
          promise.resolve(response)
        }

        override fun onCancel() {
          LoginManager.getInstance().registerCallback(callbackManager, null)
          promise.resolve(
            Bundle().apply {
              putString("type", "cancel")
            }
          )
        }

        override fun onError(error: FacebookException) {
          LoginManager.getInstance().registerCallback(callbackManager, null)
          promise.reject(ERR_FACEBOOK_LOGIN, "An error occurred while trying to log in to Facebook", error)
        }
      }
    )
    try {
      val activityProvider: ActivityProvider by moduleRegistry()
      LoginManager.getInstance().logInWithReadPermissions(activityProvider.currentActivity, permissions)
    } catch (e: FacebookException) {
      promise.reject(ERR_FACEBOOK_LOGIN, "An error occurred while trying to log in to Facebook", e)
    }
  }

  @ExpoMethod
  fun setFlushBehaviorAsync(flushBehavior: String, promise: Promise) {
    AppEventsLogger.setFlushBehavior(AppEventsLogger.FlushBehavior.valueOf(flushBehavior.toUpperCase(Locale.ROOT)))
    promise.resolve(null)
  }

  @ExpoMethod
  fun logEventAsync(eventName: String?, valueToSum: Double, parameters: ReadableArguments?, promise: Promise) {
    appEventLogger?.let {
      it.logEvent(eventName, valueToSum, bundleWithNullValuesAsStrings(parameters))
      promise.resolve(null)
    } ?: run {
      promise.reject("ERR_FACEBOOK_APP_EVENT_LOGGER", "appEventLogger is not initialized")
    }
  }

  @ExpoMethod
  fun logPurchaseAsync(
    purchaseAmount: Double,
    currencyCode: String?,
    parameters: ReadableArguments?,
    promise: Promise
  ) {
    appEventLogger?.let {
      it.logPurchase(
        BigDecimal.valueOf(purchaseAmount),
        Currency.getInstance(currencyCode),
        bundleWithNullValuesAsStrings(parameters)
      )
      promise.resolve(null)
    } ?: run {
      promise.reject("ERR_FACEBOOK_APP_EVENT_LOGGER", "appEventLogger is not initialized")
    }
  }

  @ExpoMethod
  fun logPushNotificationOpenAsync(campaign: String?, promise: Promise) {
    // the Android FBSDK expects the fb_push_payload to be a JSON string
    val payload = Bundle().apply {
      putString(PUSH_PAYLOAD_KEY, String.format("{\"%s\" : \"%s\"}", PUSH_PAYLOAD_CAMPAIGN_KEY, campaign))
    }
    appEventLogger?.let {
      it.logPushNotificationOpen(payload)
      promise.resolve(null)
    } ?: run {
      promise.reject("ERR_FACEBOOK_APP_EVENT_LOGGER", "appEventLogger is not initialized")
    }
  }

  @ExpoMethod
  fun setUserIDAsync(userID: String?, promise: Promise) {
    AppEventsLogger.setUserID(userID)
    promise.resolve(null)
  }

  @ExpoMethod
  fun getUserIDAsync(promise: Promise) {
    promise.resolve(AppEventsLogger.getUserID())
  }

  @ExpoMethod
  fun getAnonymousIDAsync(promise: Promise) {
    try {
      promise.resolve(AppEventsLogger.getAnonymousAppDeviceGUID(context))
    } catch (e: Exception) {
      promise.reject("ERR_FACEBOOK_ANONYMOUS_ID", "Can not get anonymousID", e)
    }
  }

  @ExpoMethod
  fun getAdvertiserIDAsync(promise: Promise) {
    attributionIdentifiers?.let {
      promise.resolve(it.androidAdvertiserId)
    } ?: run {
      promise.reject("ERR_FACEBOOK_ADVERTISER_ID", "Can not get advertiserID")
    }
  }

  @ExpoMethod
  fun getAttributionIDAsync(promise: Promise) {
    attributionIdentifiers?.let {
      promise.resolve(it.attributionId)
    } ?: run {
      promise.reject("ERR_FACEBOOK_ADVERTISER_ID", "Can not get attributionID")
    }
  }

  @ExpoMethod
  fun setUserDataAsync(userData: ReadableArguments, promise: Promise) {
    with(userData) {
      AppEventsLogger.setUserData(
        getString("email"),
        getString("firstName"),
        getString("lastName"),
        getString("phone"),
        getString("dateOfBirth"),
        getString("gender"),
        getString("city"),
        getString("state"),
        getString("zip"),
        getString("country")
      )
    }
    promise.resolve(null)
  }

  @ExpoMethod
  fun flushAsync(promise: Promise) {
    appEventLogger?.let {
      it.flush()
      promise.resolve(null)
    } ?: kotlin.run {
      promise.reject("ERR_FACEBOOK_APP_EVENT_LOGGER", "appEventLogger is not initialized")
    }
  }
}
