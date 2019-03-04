package expo.modules.appauth;

public class AppAuthConstants {
  static String ManifestURL = "experienceUrl";

  public interface Error {
    String Default = "ERR_APP_AUTH";
    String ConcurrentTask = "ERR_APP_AUTH_CONCURRENT_TASK";
  }

  public interface Props {
    String tokenEndpoint = "tokenEndpoint";
    String authorizationEndpoint = "authorizationEndpoint";
    String registrationEndpoint = "registrationEndpoint";
    String issuer = "issuer";
    String redirectUrl = "redirectUrl";
    String clientId = "clientId";
    String clientSecret = "clientSecret";
    String refreshToken = "refreshToken";
    String canMakeInsecureRequests = "canMakeInsecureRequests";
    String isRefresh = "isRefresh";
    String additionalParameters = "additionalParameters";
    String scopes = "scopes";
    String serviceConfiguration = "serviceConfiguration";
    String idToken = "idToken";
    String accessTokenExpirationDate = "accessTokenExpirationDate";
    String accessToken = "accessToken";
    String tokenType = "tokenType";
  }

  public interface HTTPS {
    String clientSecret = "client_secret";
    String display = "display";
    String prompt = "prompt";
    String loginHint = "login_hint";
    String nonce = "nonce";
  }
}
