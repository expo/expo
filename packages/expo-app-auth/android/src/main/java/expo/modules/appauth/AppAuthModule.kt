package expo.modules.appauth

import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import de.greenrobot.event.EventBus
import expo.modules.appauth.AppAuthBrowserActivity.OAuthResultEvent
import expo.modules.interfaces.constants.ConstantsInterface
import net.openid.appauth.AppAuthConfiguration
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.AuthorizationService
import net.openid.appauth.AuthorizationService.TokenResponseCallback
import net.openid.appauth.AuthorizationServiceConfiguration
import net.openid.appauth.AuthorizationServiceConfiguration.RetrieveConfigurationCallback
import net.openid.appauth.ClientAuthentication
import net.openid.appauth.ClientSecretBasic
import net.openid.appauth.ResponseTypeValues
import net.openid.appauth.TokenRequest
import net.openid.appauth.connectivity.ConnectionBuilder
import net.openid.appauth.connectivity.DefaultConnectionBuilder
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.services.UIManager
import java.util.*
import kotlin.collections.HashMap

class AppAuthModule(context: Context?) : ExportedModule(context) {
  private var mModuleRegistry: ModuleRegistry? = null
  private val mAuthTask = AuthTask()
  private var mShouldMakeHTTPCalls: Boolean? = null
  private var mAdditionalParametersMap: Map<String, String>? = null
  private var mClientSecret: String? = null
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
  }

  override fun getName(): String {
    return TAG
  }

  private val currentActivity: Activity?
    get() {
      val activityProvider = mModuleRegistry?.getModule(ActivityProvider::class.java)
      return activityProvider?.currentActivity
    }

  private fun createOAuthServiceConfiguration(config: Map<String, String>): AuthorizationServiceConfiguration {
    return AuthorizationServiceConfiguration(
      Uri.parse(config[AppAuthConstants.Props.AUTHORIZATION_ENDPOINT]),
      Uri.parse(config[AppAuthConstants.Props.TOKEN_ENDPOINT]),
      if (config.containsKey(AppAuthConstants.Props.REGISTRATION_ENDPOINT))
        Uri.parse(config[AppAuthConstants.Props.REGISTRATION_ENDPOINT])
      else null
    )
  }

  private fun refreshAsync(
    issuer: String?,
    clientSecret: String?,
    redirectUrl: String?,
    scopes: ArrayList<*>?,
    clientId: String?,
    refreshToken: String?,
    serviceConfig: Map<String, String>?
  ) {
    val builder = if (mShouldMakeHTTPCalls == true) UnsafeConnectionBuilder.INSTANCE else DefaultConnectionBuilder.INSTANCE
    val authConfig = AppAuthConfiguration.Builder()
      .setConnectionBuilder(builder)
      .build()
    val finalAdditionalParametersMap = mAdditionalParametersMap
    if (serviceConfig != null) {
      refreshWithConfig(
        createOAuthServiceConfiguration(serviceConfig),
        authConfig,
        refreshToken,
        clientId,
        scopes,
        redirectUrl,
        finalAdditionalParametersMap,
        clientSecret
      )
    } else {
      AuthorizationServiceConfiguration.fetchFromUrl(
        Uri.parse(issuer).buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build(),
        RetrieveConfigurationCallback { authorizationServiceConfiguration, authorizationException ->
          if (authorizationException != null) {
            mAuthTask.reject(authorizationException)
            return@RetrieveConfigurationCallback
          }
          refreshWithConfig(
            authorizationServiceConfiguration,
            authConfig,
            refreshToken,
            clientId,
            scopes,
            redirectUrl,
            finalAdditionalParametersMap,
            clientSecret
          )
        },
        builder
      )
    }
  }

  private fun authAsync(
    params: MutableMap<String, String>?,
    issuer: String?,
    clientSecret: String?,
    redirectUrl: String?,
    scopes: ArrayList<*>?,
    clientId: String?,
    serviceConfig: Map<String, String>?
  ) {
    if (EventBus.getDefault().isRegistered(this)) {
      mAuthTask.reject(AppAuthConstants.Error.DEFAULT, "Cannot start a new task while another task is currently in progress")
      return
    }
    val builder = if (mShouldMakeHTTPCalls == true) UnsafeConnectionBuilder.INSTANCE else DefaultConnectionBuilder.INSTANCE
    val authConfig = AppAuthConfiguration.Builder()
      .setConnectionBuilder(builder)
      .build()
    mClientSecret = clientSecret
    if (serviceConfig != null) {
      authWithConfiguration(
        authConfig,
        clientId,
        redirectUrl,
        scopes as ArrayList<String>?,
        createOAuthServiceConfiguration(serviceConfig),
        params
      )
    } else {
      AuthorizationServiceConfiguration.fetchFromUrl(
        Uri.parse(issuer).buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build(),
        object : RetrieveConfigurationCallback {
          override fun onFetchConfigurationCompleted(
            authorizationServiceConfiguration: AuthorizationServiceConfiguration?,
            authorizationException: AuthorizationException?) {
            if (authorizationException != null) {
              // config fetch failed
              mAuthTask.reject(authorizationException)
              return
            }
            if (EventBus.getDefault().isRegistered(this)) {
              mAuthTask.reject(AppAuthConstants.Error.DEFAULT, "Cannot start a new task while another task is currently in progress")
              return
            }
            authWithConfiguration(
              authConfig,
              clientId,
              redirectUrl,
              scopes as ArrayList<String>?,
              authorizationServiceConfiguration,
              params
            )
          }
        },
        builder
      )
    }
  }

  @ExpoMethod
  fun executeAsync(
    options: Map<String?, Any?>,
    promise: Promise // TODO: check if this parameter is nullable
  ) {
    mModuleRegistry!!.getModule(UIManager::class.java).runOnUiQueueThread {
      val issuer = options[AppAuthConstants.Props.ISSUER] as String?
      val redirectUrl = options[AppAuthConstants.Props.REDIRECT_URL] as String?
      val clientId = options[AppAuthConstants.Props.CLIENT_ID] as String?
      val clientSecret = options[AppAuthConstants.Props.CLIENT_SECRET] as String?
      val refreshToken = options[AppAuthConstants.Props.REFRESH_TOKEN] as String?

      val shouldMakeHTTPCalls = if (options.containsKey(AppAuthConstants.Props.CAN_MAKE_INSECURE_REQUESTS)) options[AppAuthConstants.Props.CAN_MAKE_INSECURE_REQUESTS] as Boolean? else false
      val isRefresh = if (options.containsKey(AppAuthConstants.Props.IS_REFRESH)) options[AppAuthConstants.Props.IS_REFRESH] as Boolean? else false

      val scopes: ArrayList<String>? = options[AppAuthConstants.Props.SCOPES] as ArrayList<String>?

      var params: MutableMap<String, String>? = HashMap()
      if (options.containsKey(AppAuthConstants.Props.ADDITIONAL_PARAMETERS) && options[AppAuthConstants.Props.ADDITIONAL_PARAMETERS] is Map<*, *>) {
        params = Serialization.jsonToStrings(options[AppAuthConstants.Props.ADDITIONAL_PARAMETERS] as Map<String, Any>)
      }
      var serviceConfig: Map<String, String>? = null
      if (options.containsKey(AppAuthConstants.Props.SERVICE_CONFIGURATION) && options[AppAuthConstants.Props.SERVICE_CONFIGURATION] is Map<*, *>) {
        serviceConfig = Serialization.jsonToStrings(options[AppAuthConstants.Props.SERVICE_CONFIGURATION] as Map<String, Any>)
      }
      mAdditionalParametersMap = params
      mShouldMakeHTTPCalls = shouldMakeHTTPCalls
      mAuthTask.update(promise, "Get Auth")
      if (isRefresh == true) {
        refreshAsync(issuer, clientSecret, redirectUrl, scopes, clientId, refreshToken, serviceConfig)
      } else {
        authAsync(params, issuer, clientSecret, redirectUrl, scopes, clientId, serviceConfig)
      }
    }
  }

  override fun getConstants(): Map<String, Any> {
    val constants: MutableMap<String, Any> = HashMap()
    constants["OAuthRedirect"] = context.applicationContext.packageName
    return constants
  }

  private val tokenCallback: TokenResponseCallback
    private get() = TokenResponseCallback { resp, authorizationException ->
      if (resp == null) {
        if (authorizationException != null) {
          mAuthTask.reject(authorizationException)
        }
        return@TokenResponseCallback
      }
      mAuthTask.resolve(Serialization.tokenResponseNativeToJSON(resp))
    }

  private fun authWithConfiguration(
    authConfig: AppAuthConfiguration,
    clientId: String?,
    redirectUrl: String?,
    scopes: ArrayList<String>?,
    serviceConfig: AuthorizationServiceConfiguration?,
    parameters: MutableMap<String, String>?
  ) {
    var responseType = ResponseTypeValues.CODE
    if (parameters!!.containsKey("response_type")) {
      val responseTypeString = parameters.remove("response_type")
      if ("token" == responseTypeString) {
        responseType = ResponseTypeValues.TOKEN
      } else if ("id_token" == responseTypeString) {
        responseType = ResponseTypeValues.ID_TOKEN
      }
    }
    try {
      val authReqBuilder = AuthorizationRequest.Builder(serviceConfig!!, clientId!!, responseType, Uri.parse(redirectUrl))
      if (scopes != null) {
        val scopesString = Serialization.scopesToString(scopes)
        authReqBuilder.setScope(scopesString)
      }
      if (parameters.containsKey(AppAuthConstants.HTTPS.DISPLAY)) {
        authReqBuilder.setDisplay(parameters[AppAuthConstants.HTTPS.DISPLAY])
        parameters.remove(AppAuthConstants.HTTPS.DISPLAY)
      }
      if (parameters.containsKey(AppAuthConstants.HTTPS.PROMPT)) {
        authReqBuilder.setPrompt(parameters[AppAuthConstants.HTTPS.PROMPT])
        parameters.remove(AppAuthConstants.HTTPS.PROMPT)
      }
      if (parameters.containsKey(AppAuthConstants.HTTPS.LOGIN_HINT)) {
        authReqBuilder.setLoginHint(parameters[AppAuthConstants.HTTPS.LOGIN_HINT])
        parameters.remove(AppAuthConstants.HTTPS.LOGIN_HINT)
      }
      authReqBuilder.setAdditionalParameters(parameters)


      // TODO: Bacon: Prevent double register - this is fatal
      EventBus.getDefault().register(this)
      val activity = currentActivity
      val postAuthIntent = Intent(activity, AppAuthBrowserActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      val constantsService = mModuleRegistry!!.getModule(ConstantsInterface::class.java)
      if ("standalone" != constantsService.appOwnership) {
        if (!constantsService.constants.containsKey(AppAuthConstants.MANIFEST_URL)) {
          mAuthTask.reject(AppAuthConstants.Error.DEFAULT, "Missing " + AppAuthConstants.MANIFEST_URL + " in the experience Constants")
          return
        } else {
          val experienceUrl = constantsService.constants[AppAuthConstants.MANIFEST_URL] as String?
          postAuthIntent.putExtra(AppAuthBrowserActivity.EXTRA_REDIRECT_EXPERIENCE_URL, experienceUrl)
        }
      }
      val authorizationRequest = authReqBuilder.build()
      val hash = authorizationRequest.hashCode()
      val pendingIntent = PendingIntent.getActivity(activity, hash, postAuthIntent, 0)
      val authorizationService = AuthorizationService(activity!!, authConfig)
      authorizationService.performAuthorizationRequest(authorizationRequest, pendingIntent, pendingIntent)
    } catch (e: Exception) {
      mAuthTask.reject(AppAuthConstants.Error.DEFAULT, "Encountered exception when trying to start auth request: " + e.message)
    }
  }

  fun onEvent(event: OAuthResultEvent) {
    EventBus.getDefault().unregister(this)
    if (event.exception != null) {
      mAuthTask.reject(event.exception)
      return
    }
    val connectionBuilder: ConnectionBuilder = if (mShouldMakeHTTPCalls == false) {
      DefaultConnectionBuilder.INSTANCE
    } else {
      UnsafeConnectionBuilder.INSTANCE
    }
    val authConfig = AppAuthConfiguration.Builder()
      .setConnectionBuilder(connectionBuilder)
      .build()
    val tokenReq = event.response!!.createTokenExchangeRequest(mAdditionalParametersMap!!)
    performTokenReq(tokenReq, authConfig, mClientSecret)
  }

  private fun refreshWithConfig(
    serviceConfig: AuthorizationServiceConfiguration?,
    authConfig: AppAuthConfiguration,
    refreshToken: String?,
    clientId: String?,
    scopes: ArrayList<*>?,
    redirectUrl: String?,
    params: Map<String, String>?,
    clientSecret: String?
  ) {
    var scopesString: String? = null
    if (scopes != null) {
      scopesString = Serialization.scopesToString(scopes as ArrayList<String>)
    }
    val tokenReqBuilder = TokenRequest.Builder(
      serviceConfig!!,
      clientId!!)
      .setRefreshToken(refreshToken)
      .setRedirectUri(Uri.parse(redirectUrl))
    if (scopesString != null) {
      tokenReqBuilder.setScope(scopesString)
    }
    if (params!!.isNotEmpty()) {
      tokenReqBuilder.setAdditionalParameters(params)
    }
    performTokenReq(tokenReqBuilder.build(), authConfig, clientSecret)
  }

  private fun performTokenReq(tokenReq: TokenRequest, authConfig: AppAuthConfiguration, clientSecret: String?) {
    val authorizationService = AuthorizationService(context, authConfig)
    if (clientSecret != null) {
      val clientAuth: ClientAuthentication = ClientSecretBasic(clientSecret)
      authorizationService.performTokenRequest(tokenReq, clientAuth, tokenCallback)
    } else {
      authorizationService.performTokenRequest(tokenReq, tokenCallback)
    }
  }

  companion object {
    private const val TAG = "ExpoAppAuth"
  }
}