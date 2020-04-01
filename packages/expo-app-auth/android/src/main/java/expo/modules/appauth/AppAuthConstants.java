package expo.modules.appauth;

public class AppAuthConstants {
  static String MANIFEST_URL = "experienceUrl";

  public interface Error {
    String DEFAULT = "ERR_APP_AUTH";
    String CONCURRENT_TASK = "ERR_APP_AUTH_CONCURRENT_TASK";
  }

  public interface Props {
    String TOKEN_ENDPOINT = "tokenEndpoint";
    String AUTHORIZATION_ENDPOINT = "authorizationEndpoint";
    String REGISTRATION_ENDPOINT = "registrationEndpoint";
    String ISSUER = "issuer";
    String REDIRECT_URL = "redirectUrl";
    String CLIENT_ID = "clientId";
    String CLIENT_SECRET = "clientSecret";
    String REFRESH_TOKEN = "refreshToken";
    String CAN_MAKE_INSECURE_REQUESTS = "canMakeInsecureRequests";
    String IS_REFRESH = "isRefresh";
    String ADDITIONAL_PARAMETERS = "additionalParameters";
    String SCOPES = "scopes";
    String SERVICE_CONFIGURATION = "serviceConfiguration";
    String ID_TOKEN = "idToken";
    String ACCESS_TOKEN_EXPIRATION_DATE = "accessTokenExpirationDate";
    String ACCESS_TOKEN = "accessToken";
    String TOKEN_TYPE = "tokenType";
  }

  public interface HTTPS {
    String CLIENT_SECRET = "client_secret";
    String DISPLAY = "display";
    String PROMPT = "prompt";
    String LOGIN_HINT = "login_hint";
    String NONCE = "nonce";
  }
}
