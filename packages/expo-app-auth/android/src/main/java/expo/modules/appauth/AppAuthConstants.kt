package expo.modules.appauth

object AppAuthConstants {
  @JvmField
  var MANIFEST_URL = "experienceUrl"

  interface Error {
    companion object {
      const val DEFAULT = "ERR_APP_AUTH"
      const val CONCURRENT_TASK = "ERR_APP_AUTH_CONCURRENT_TASK"
    }
  }

  interface Props {
    companion object {
      const val TOKEN_ENDPOINT = "tokenEndpoint"
      const val AUTHORIZATION_ENDPOINT = "authorizationEndpoint"
      const val REGISTRATION_ENDPOINT = "registrationEndpoint"
      const val ISSUER = "issuer"
      const val REDIRECT_URL = "redirectUrl"
      const val CLIENT_ID = "clientId"
      const val CLIENT_SECRET = "clientSecret"
      const val REFRESH_TOKEN = "refreshToken"
      const val CAN_MAKE_INSECURE_REQUESTS = "canMakeInsecureRequests"
      const val IS_REFRESH = "isRefresh"
      const val ADDITIONAL_PARAMETERS = "additionalParameters"
      const val SCOPES = "scopes"
      const val SERVICE_CONFIGURATION = "serviceConfiguration"
      const val ID_TOKEN = "idToken"
      const val ACCESS_TOKEN_EXPIRATION_DATE = "accessTokenExpirationDate"
      const val ACCESS_TOKEN = "accessToken"
      const val TOKEN_TYPE = "tokenType"
    }
  }

  interface HTTPS {
    companion object {
      const val CLIENT_SECRET = "client_secret"
      const val DISPLAY = "display"
      const val PROMPT = "prompt"
      const val LOGIN_HINT = "login_hint"
      const val NONCE = "nonce"
    }
  }
}