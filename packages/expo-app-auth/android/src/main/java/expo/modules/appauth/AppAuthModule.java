package expo.modules.appauth;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;

import net.openid.appauth.AppAuthConfiguration;
import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ClientAuthentication;
import net.openid.appauth.ClientSecretBasic;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenRequest;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.connectivity.ConnectionBuilder;
import net.openid.appauth.connectivity.DefaultConnectionBuilder;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import de.greenrobot.event.EventBus;
import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.constants.ConstantsInterface;

public class AppAuthModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoAppAuth";
  private static final String ERROR_TAG = "ERR_APP_AUTH";
  private static final String MANIFEST_URL_KEY = "experienceUrl";
  private ModuleRegistry mModuleRegistry;
  private AuthTask authTask = new AuthTask();
  private Boolean mCanMakeInsecureRequests;
  private Map<String, String> mAdditionalParametersMap;
  private String mClientSecret;

  public AppAuthModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return TAG;
  }

  private Activity getCurrentActivity() {
    if (mModuleRegistry != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  private Map<String, String> castObjectsToStrings(Map<String, Object> map) {
    Map<String, String> newMap = new HashMap<>();
    for (String strKey : map.keySet()) {
      newMap.put(strKey, String.valueOf(map.get(strKey)));
    }
    return newMap;
  }

  private void refreshAsync(
      String issuer,
      final String clientSecret,
      final String redirectUrl,
      final ArrayList scopes,
      final String clientId,
      final String refreshToken,
      Map<String, String> serviceConfiguration
  ) {

    final ConnectionBuilder builder = createConnectionBuilder();
    final AppAuthConfiguration appAuthConfiguration = createAppAuthConfiguration(builder);
    final Map<String, String> finalAdditionalParametersMap = mAdditionalParametersMap;

    if (serviceConfiguration != null) {
      try {
        refreshWithConfiguration(
            createAuthorizationServiceConfiguration(serviceConfiguration),
            appAuthConfiguration,
            refreshToken,
            clientId,
            scopes,
            redirectUrl,
            finalAdditionalParametersMap,
            clientSecret
        );
      } catch (Exception e) {
        // Refresh token failed
        authTask.reject(e);
      }
    } else {
      final Uri issuerUri = Uri.parse(issuer);
      Uri configurationUri = issuerUri.buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build();


      AuthorizationServiceConfiguration.fetchFromUrl(
          configurationUri,
          new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
            public void onFetchConfigurationCompleted(
                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                @Nullable AuthorizationException ex) {
              if (ex != null) {
                // config fetch failed
                authTask.reject(ex);
                return;
              }

              refreshWithConfiguration(
                  fetchedConfiguration,
                  appAuthConfiguration,
                  refreshToken,
                  clientId,
                  scopes,
                  redirectUrl,
                  finalAdditionalParametersMap,
                  clientSecret
              );
            }
          },
          builder
      );

    }
  }

  private void authAsync(
      Map<String, String> additionalParametersMap,
      String issuer,
      String clientSecret,
      final String redirectUrl,
      final ArrayList scopes,
      final String clientId,
      Map<String, String> serviceConfiguration
  ) {

    final ConnectionBuilder builder = createConnectionBuilder();
    final AppAuthConfiguration appAuthConfiguration = createAppAuthConfiguration(builder);
    mClientSecret = clientSecret;

    if (serviceConfiguration != null) {
      try {
        authorizeWithConfiguration(
            createAuthorizationServiceConfiguration(serviceConfiguration),
            appAuthConfiguration,
            clientId,
            scopes,
            redirectUrl,
            additionalParametersMap
        );
      } catch (Exception e) {
        // Auth failed
        authTask.reject(e);
      }
    } else {

      final Uri issuerUri = Uri.parse(issuer);
      Uri configurationUri = issuerUri.buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build();

      final Map<String, String> finalAdditionalParametersMap = additionalParametersMap;

      AuthorizationServiceConfiguration.fetchFromUrl(
          configurationUri,
          new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
            public void onFetchConfigurationCompleted(
                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                @Nullable AuthorizationException ex) {
              if (ex != null) {
                // config fetch failed
                authTask.reject(ex);
                return;
              }

              authorizeWithConfiguration(
                  fetchedConfiguration,
                  appAuthConfiguration,
                  clientId,
                  scopes,
                  redirectUrl,
                  finalAdditionalParametersMap
              );
            }
          },
          builder
      );
    }
  }

  @ExpoMethod
  public void executeAsync(
      final Map<String, Object> options,
      final Promise promise
  ) {

    mModuleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {

        final String issuer = (String) options.get("issuer");
        final String redirectUrl = (String) options.get("redirectUrl");
        final String clientId = (String) options.get("clientId");
        final String clientSecret = (String) options.get("clientSecret");
        final String refreshToken = (String) options.get("refreshToken");

        final Boolean canMakeInsecureRequests = options.containsKey("canMakeInsecureRequests") ? (Boolean) options.get("canMakeInsecureRequests") : false;
        final Boolean isRefresh = options.containsKey("isRefresh") ? (Boolean) options.get("isRefresh") : false;

        final ArrayList scopes = (ArrayList) options.get("scopes");

        Map<String, String> additionalParametersMap = new HashMap<>();
        if (options.containsKey("additionalParameters") && options.get("additionalParameters") instanceof Map) {
          additionalParametersMap = castObjectsToStrings((Map<String, Object>) options.get("additionalParameters"));
        }

        Map<String, String> serviceConfiguration = null;
        if (options.containsKey("serviceConfiguration") && options.get("serviceConfiguration") instanceof Map) {
          serviceConfiguration = castObjectsToStrings((Map<String, Object>) options.get("serviceConfiguration"));
        }

        if (clientSecret != null) {
          additionalParametersMap.put("client_secret", clientSecret);
        }

        mAdditionalParametersMap = additionalParametersMap;
        mCanMakeInsecureRequests = canMakeInsecureRequests;

        authTask.update(promise, "Get Auth");

        if (isRefresh.equals(true)) {
          refreshAsync(issuer, clientSecret, redirectUrl, scopes, clientId, refreshToken, serviceConfiguration);
        } else {
          authAsync(additionalParametersMap, issuer, clientSecret, redirectUrl, scopes, clientId, serviceConfiguration);
        }
      }
    });
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("OAuthRedirect", getContext().getApplicationContext().getPackageName());
    return constants;
  }

  private AuthorizationService.TokenResponseCallback getTokenCallback() {
    AuthorizationService.TokenResponseCallback tokenResponseCallback = new AuthorizationService.TokenResponseCallback() {

      @Override
      public void onTokenRequestCompleted(
          TokenResponse resp, AuthorizationException ex) {
        if (resp != null) {
          authTask.resolve(tokenResponseToBundle(resp));
        } else {
          authTask.reject(ex);
        }
      }
    };
    return tokenResponseCallback;
  }

  private void authorizeWithConfiguration(
      final AuthorizationServiceConfiguration serviceConfiguration,
      final AppAuthConfiguration configuration,
      final String clientId,
      final ArrayList scopes,
      final String redirectUrl,
      final Map<String, String> parameters
  ) {

    AuthorizationRequest.Builder authRequestBuilder = new AuthorizationRequest.Builder(serviceConfiguration, clientId, ResponseTypeValues.CODE, Uri.parse(redirectUrl));

    if (scopes != null) {
      String scopesString = tokenizeScopes(scopes);
      if (scopesString != null) {
        authRequestBuilder.setScope(scopesString);
      }
    }

    if (parameters != null) {
      if (parameters.containsKey("login_hint")) {
        authRequestBuilder.setLoginHint(parameters.get("login_hint"));
        parameters.remove("login_hint");
      }
      if (parameters.containsKey("display")) {
        authRequestBuilder.setDisplay(parameters.get("display"));
        parameters.remove("display");
      }
      if (parameters.containsKey("prompt")) {
        authRequestBuilder.setPrompt(parameters.get("prompt"));
        parameters.remove("prompt");
      }
      authRequestBuilder.setAdditionalParameters(parameters);
    }

    EventBus.getDefault().register(this);

    Activity activity = getCurrentActivity();

    Intent postAuthIntent = new Intent(activity, AppAuthBrowserActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

    ConstantsInterface constantsService = mModuleRegistry.getModule(ConstantsInterface.class);
    if (!"standalone".equals(constantsService.getAppOwnership())) {
      if (!constantsService.getConstants().containsKey(MANIFEST_URL_KEY)) {
        authTask.reject(ERROR_TAG, "Missing " + MANIFEST_URL_KEY + " in the experience Constants");
        return;
      } else {
        String experienceUrl = (String) constantsService.getConstants().get(MANIFEST_URL_KEY);
        postAuthIntent.putExtra(AppAuthBrowserActivity.EXTRA_REDIRECT_EXPERIENCE_URL, experienceUrl);
      }
    }

    AuthorizationRequest request = authRequestBuilder.build();
    PendingIntent pendingIntent = PendingIntent.getActivity(activity, request.hashCode(), postAuthIntent, 0);
    AuthorizationService service = new AuthorizationService(activity, configuration);
    service.performAuthorizationRequest(request, pendingIntent, pendingIntent);
  }

  public void onEvent(AppAuthBrowserActivity.OAuthResultEvent event) {
    EventBus.getDefault().unregister(this);

    if (event.exception != null) {
      authTask.reject(event.exception);
      return;
    }

    AppAuthConfiguration configuration = createAppAuthConfiguration(createConnectionBuilder());
    TokenRequest tokenRequest = event.response.createTokenExchangeRequest(mAdditionalParametersMap);
    performTokenRequest(tokenRequest, configuration, mClientSecret);
  }

  private void refreshWithConfiguration(
      AuthorizationServiceConfiguration serviceConfiguration,
      AppAuthConfiguration appAuthConfiguration,
      String refreshToken,
      String clientId,
      ArrayList scopes,
      String redirectUrl,
      Map<String, String> additionalParametersMap,
      String clientSecret
  ) {

    String scopesString = null;

    if (scopes != null) {
      scopesString = tokenizeScopes(scopes);
    }

    TokenRequest.Builder tokenRequestBuilder =
        new TokenRequest.Builder(
            serviceConfiguration,
            clientId
        )
            .setRefreshToken(refreshToken)
            .setRedirectUri(Uri.parse(redirectUrl));

    if (scopesString != null) {
      tokenRequestBuilder.setScope(scopesString);
    }

    if (!additionalParametersMap.isEmpty()) {
      tokenRequestBuilder.setAdditionalParameters(additionalParametersMap);
    }

    TokenRequest tokenRequest = tokenRequestBuilder.build();

    performTokenRequest(tokenRequest, appAuthConfiguration, clientSecret);
  }

  private void performTokenRequest(TokenRequest tokenRequest, AppAuthConfiguration appAuthConfiguration, String clientSecret) {
    AuthorizationService authService = new AuthorizationService(getContext(), appAuthConfiguration);

    if (clientSecret != null) {
      ClientAuthentication clientAuth = new ClientSecretBasic(clientSecret);
      authService.performTokenRequest(tokenRequest, clientAuth, getTokenCallback());
    } else {
      authService.performTokenRequest(tokenRequest, getTokenCallback());
    }
  }

  private String tokenizeScopes(ArrayList array) {
    StringBuilder strBuilder = new StringBuilder();
    for (int i = 0; i < array.size(); i++) {
      if (i != 0) {
        strBuilder.append(' ');
      }
      strBuilder.append(array.get(i));
    }
    return strBuilder.toString();
  }

  private Bundle tokenResponseToBundle(TokenResponse response) {
    Bundle map = new Bundle();

    map.putString("accessToken", response.accessToken);

    if (response.accessTokenExpirationTime != null) {
      Date expirationDate = new Date(response.accessTokenExpirationTime);
      SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
      formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
      String expirationDateString = formatter.format(expirationDate);
      map.putString("accessTokenExpirationDate", expirationDateString);
    }

    Bundle additionalParametersMap = new Bundle();

    if (!response.additionalParameters.isEmpty()) {

      Iterator<String> iterator = response.additionalParameters.keySet().iterator();

      while (iterator.hasNext()) {
        String key = iterator.next();
        additionalParametersMap.putString(key, response.additionalParameters.get(key));
      }
    }

    map.putBundle("additionalParameters", additionalParametersMap);
    map.putString("idToken", response.idToken);
    map.putString("refreshToken", response.refreshToken);
    map.putString("tokenType", response.tokenType);

    return map;
  }

  private AppAuthConfiguration createAppAuthConfiguration(ConnectionBuilder connectionBuilder) {
    return new AppAuthConfiguration
        .Builder()
        .setConnectionBuilder(connectionBuilder)
        .build();
  }

  private ConnectionBuilder createConnectionBuilder() {
    return mCanMakeInsecureRequests.equals(true) ? UnsafeConnectionBuilder.INSTANCE : DefaultConnectionBuilder.INSTANCE;
  }

  private AuthorizationServiceConfiguration createAuthorizationServiceConfiguration(Map<String, String> serviceConfiguration) throws Exception {
    if (!serviceConfiguration.containsKey("authorizationEndpoint")) {
      throw new Exception("serviceConfiguration passed without an authorizationEndpoint");
    }

    if (!serviceConfiguration.containsKey("tokenEndpoint")) {
      throw new Exception("serviceConfiguration passed without a tokenEndpoint");
    }

    Uri authorizationEndpoint = Uri.parse(serviceConfiguration.get("authorizationEndpoint"));
    Uri tokenEndpoint = Uri.parse(serviceConfiguration.get("tokenEndpoint"));
    Uri registrationEndpoint = null;
    if (serviceConfiguration.containsKey("registrationEndpoint")) {
      registrationEndpoint = Uri.parse(serviceConfiguration.get("registrationEndpoint"));
    }

    return new AuthorizationServiceConfiguration(
        authorizationEndpoint,
        tokenEndpoint,
        registrationEndpoint
    );
  }
}
