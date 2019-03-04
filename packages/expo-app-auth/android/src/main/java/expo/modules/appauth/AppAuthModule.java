package expo.modules.appauth;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

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
  private ModuleRegistry mModuleRegistry;
  private AuthTask mAuthTask = new AuthTask();
  private Boolean mShouldMakeHTTPCalls;
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

  private AuthorizationServiceConfiguration createOAuthServiceConfiguration(Map<String, String> config) {
    return new AuthorizationServiceConfiguration(
        Uri.parse(config.get(AppAuthConstants.Props.tokenEndpoint)),
        Uri.parse(config.get(AppAuthConstants.Props.authorizationEndpoint)),
        config.containsKey(AppAuthConstants.Props.registrationEndpoint) ? null : Uri.parse(config.get(AppAuthConstants.Props.registrationEndpoint))
    );
  }

  private void refreshAsync(
      String issuer,
      final String clientSecret,
      final String redirectUrl,
      final ArrayList scopes,
      final String clientId,
      final String refreshToken,
      Map<String, String> serviceConfig
  ) {

    final ConnectionBuilder builder = mShouldMakeHTTPCalls.equals(true) ? UnsafeConnectionBuilder.INSTANCE : DefaultConnectionBuilder.INSTANCE;

    final AppAuthConfiguration authConfig = new AppAuthConfiguration
        .Builder()
        .setConnectionBuilder(builder)
        .build();
    final Map<String, String> finalAdditionalParametersMap = mAdditionalParametersMap;

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
      );
    } else {
      AuthorizationServiceConfiguration.fetchFromUrl(
          Uri.parse(issuer).buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build(),
          new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
            public void onFetchConfigurationCompleted(
                @Nullable AuthorizationServiceConfiguration authorizationServiceConfiguration,
                @Nullable AuthorizationException authorizationException) {
              if (authorizationException != null) {
                mAuthTask.reject(authorizationException);
                return;
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
              );
            }
          },
          builder
      );

    }
  }

  private void authAsync(
      final Map<String, String> params,
      String issuer,
      String clientSecret,
      final String redirectUrl,
      final ArrayList scopes,
      final String clientId,
      Map<String, String> serviceConfig
  ) {
    if (EventBus.getDefault().isRegistered(this)) {
      mAuthTask.reject(AppAuthConstants.Error.Default, "Cannot start a new task while another task is currently in progress");
      return;
    }

    final ConnectionBuilder builder = mShouldMakeHTTPCalls.equals(true) ? UnsafeConnectionBuilder.INSTANCE : DefaultConnectionBuilder.INSTANCE;
    final AppAuthConfiguration authConfig = new AppAuthConfiguration
        .Builder()
        .setConnectionBuilder(builder)
        .build();
    mClientSecret = clientSecret;

    if (serviceConfig != null) {
      authWithConfiguration(
          authConfig,
          clientId,
          redirectUrl,
          scopes,
          createOAuthServiceConfiguration(serviceConfig),
          params
      );
    } else {
      AuthorizationServiceConfiguration.fetchFromUrl(
          Uri.parse(issuer).buildUpon().appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH).appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE).build(),
          new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
            public void onFetchConfigurationCompleted(
                @Nullable AuthorizationServiceConfiguration authorizationServiceConfiguration,
                @Nullable AuthorizationException authorizationException) {
              if (authorizationException != null) {
                // config fetch failed
                mAuthTask.reject(authorizationException);
                return;
              }
              if (EventBus.getDefault().isRegistered(this)) {
                mAuthTask.reject(AppAuthConstants.Error.Default, "Cannot start a new task while another task is currently in progress");
                return;
              }

              authWithConfiguration(
                  authConfig,
                  clientId,
                  redirectUrl,
                  scopes,
                  authorizationServiceConfiguration,
                  params
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

        final String issuer = (String) options.get(AppAuthConstants.Props.issuer);
        final String redirectUrl = (String) options.get(AppAuthConstants.Props.redirectUrl);
        final String clientId = (String) options.get(AppAuthConstants.Props.clientId);
        final String clientSecret = (String) options.get(AppAuthConstants.Props.clientSecret);
        final String refreshToken = (String) options.get(AppAuthConstants.Props.refreshToken);

        final Boolean shouldMakeHTTPCalls = options.containsKey(AppAuthConstants.Props.canMakeInsecureRequests) ? (Boolean) options.get(AppAuthConstants.Props.canMakeInsecureRequests) : false;
        final Boolean isRefresh = options.containsKey(AppAuthConstants.Props.isRefresh) ? (Boolean) options.get(AppAuthConstants.Props.isRefresh) : false;

        final ArrayList<String> scopes = (ArrayList) options.get(AppAuthConstants.Props.scopes);

        Map<String, String> params = new HashMap<>();
        if (options.containsKey(AppAuthConstants.Props.additionalParameters) && options.get(AppAuthConstants.Props.additionalParameters) instanceof Map) {
          params = Serialization.jsonToStrings((Map<String, Object>) options.get(AppAuthConstants.Props.additionalParameters));
        }

        Map<String, String> serviceConfig = null;
        if (options.containsKey(AppAuthConstants.Props.serviceConfiguration) && options.get(AppAuthConstants.Props.serviceConfiguration) instanceof Map) {
          serviceConfig = Serialization.jsonToStrings((Map<String, Object>) options.get(AppAuthConstants.Props.serviceConfiguration));
        }

        if (clientSecret != null) {
          params.put(AppAuthConstants.HTTPS.clientSecret, clientSecret);
        }

        mAdditionalParametersMap = params;
        mShouldMakeHTTPCalls = shouldMakeHTTPCalls;

        mAuthTask.update(promise, "Get Auth");

        if (isRefresh.equals(true)) {
          refreshAsync(issuer, clientSecret, redirectUrl, scopes, clientId, refreshToken, serviceConfig);
        } else {
          authAsync(params, issuer, clientSecret, redirectUrl, scopes, clientId, serviceConfig);
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
    return new AuthorizationService.TokenResponseCallback() {

      @Override
      public void onTokenRequestCompleted(
          TokenResponse resp, AuthorizationException authorizationException) {
        if (resp == null) {
          mAuthTask.reject(authorizationException);
          return;
        }
        mAuthTask.resolve(Serialization.tokenResponseNativeToJSON(resp));
      }
    };
  }

  private void authWithConfiguration(
      final AppAuthConfiguration authConfig,
      final String clientId,
      final String redirectUrl,
      final ArrayList<String> scopes,
      final AuthorizationServiceConfiguration serviceConfig,
      final Map<String, String> parameters
  ) {

    AuthorizationRequest.Builder authReqBuilder = new AuthorizationRequest.Builder(serviceConfig, clientId, ResponseTypeValues.CODE, Uri.parse(redirectUrl));

    if (scopes != null) {
      String scopesString = Serialization.scopesToString(scopes);
      if (scopesString != null) {
        authReqBuilder.setScope(scopesString);
      }
    }

    if (parameters != null) {
      if (parameters.containsKey(AppAuthConstants.HTTPS.display)) {
        authReqBuilder.setDisplay(parameters.get(AppAuthConstants.HTTPS.display));
        parameters.remove(AppAuthConstants.HTTPS.display);
      }
      if (parameters.containsKey(AppAuthConstants.HTTPS.prompt)) {
        authReqBuilder.setPrompt(parameters.get(AppAuthConstants.HTTPS.prompt));
        parameters.remove(AppAuthConstants.HTTPS.prompt);
      }
      if (parameters.containsKey(AppAuthConstants.HTTPS.loginHint)) {
        authReqBuilder.setLoginHint(parameters.get(AppAuthConstants.HTTPS.loginHint));
        parameters.remove(AppAuthConstants.HTTPS.loginHint);
      }
      authReqBuilder.setAdditionalParameters(parameters);
    }


    // TODO: Bacon: Prevent double register - this is fatal
    EventBus.getDefault().register(this);

    Activity activity = getCurrentActivity();

    Intent postAuthIntent = new Intent(activity, AppAuthBrowserActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

    ConstantsInterface constantsService = mModuleRegistry.getModule(ConstantsInterface.class);
    if (!"standalone".equals(constantsService.getAppOwnership())) {
      if (!constantsService.getConstants().containsKey(AppAuthConstants.ManifestURL)) {
        mAuthTask.reject(AppAuthConstants.Error.Default, "Missing " + AppAuthConstants.ManifestURL + " in the experience Constants");
        return;
      } else {
        String experienceUrl = (String) constantsService.getConstants().get(AppAuthConstants.ManifestURL);
        postAuthIntent.putExtra(AppAuthBrowserActivity.EXTRA_REDIRECT_EXPERIENCE_URL, experienceUrl);
      }
    }

    AuthorizationRequest authorizationRequest = authReqBuilder.build();
    int hash = authorizationRequest.hashCode();
    PendingIntent pendingIntent = PendingIntent.getActivity(activity, hash, postAuthIntent, 0);
    AuthorizationService authorizationService = new AuthorizationService(activity, authConfig);
    authorizationService.performAuthorizationRequest(authorizationRequest, pendingIntent, pendingIntent);
  }

  public void onEvent(AppAuthBrowserActivity.OAuthResultEvent event) {
    EventBus.getDefault().unregister(this);

    if (event.getException() != null) {
      mAuthTask.reject(event.getException());
      return;
    }

    ConnectionBuilder connectionBuilder;
    if (mShouldMakeHTTPCalls.equals(false)) {
      connectionBuilder = DefaultConnectionBuilder.INSTANCE;
    } else {
      connectionBuilder = UnsafeConnectionBuilder.INSTANCE;
    }
    AppAuthConfiguration authConfig = new AppAuthConfiguration
        .Builder()
        .setConnectionBuilder(connectionBuilder)
        .build();
    TokenRequest tokenReq = event.getResponse().createTokenExchangeRequest(mAdditionalParametersMap);
    performTokenReq(tokenReq, authConfig, mClientSecret);
  }

  private void refreshWithConfig(
      AuthorizationServiceConfiguration serviceConfig,
      AppAuthConfiguration authConfig,
      String refreshToken,
      String clientId,
      ArrayList scopes,
      String redirectUrl,
      Map<String, String> params,
      String clientSecret
  ) {

    String scopesString = null;

    if (scopes != null) {
      scopesString = Serialization.scopesToString(scopes);
    }

    TokenRequest.Builder tokenReqBuilder =
        new TokenRequest.Builder(
            serviceConfig,
            clientId)
            .setRefreshToken(refreshToken)
            .setRedirectUri(Uri.parse(redirectUrl));

    if (scopesString != null) {
      tokenReqBuilder.setScope(scopesString);
    }
    if (!params.isEmpty()) {
      tokenReqBuilder.setAdditionalParameters(params);
    }
    performTokenReq(tokenReqBuilder.build(), authConfig, clientSecret);
  }

  private void performTokenReq(TokenRequest tokenReq, AppAuthConfiguration authConfig, String clientSecret) {
    AuthorizationService authorizationService = new AuthorizationService(getContext(), authConfig);

    if (clientSecret != null) {
      ClientAuthentication clientAuth = new ClientSecretBasic(clientSecret);
      authorizationService.performTokenRequest(tokenReq, clientAuth, getTokenCallback());
    } else {
      authorizationService.performTokenRequest(tokenReq, getTokenCallback());
    }
  }
}
