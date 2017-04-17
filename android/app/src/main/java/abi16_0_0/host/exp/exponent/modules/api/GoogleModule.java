// Copyright 2015-present 650 Industries. All rights reserved.

package abi16_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import abi16_0_0.com.facebook.infer.annotation.Assertions;
import abi16_0_0.com.facebook.react.bridge.Arguments;
import abi16_0_0.com.facebook.react.bridge.Promise;
import abi16_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi16_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi16_0_0.com.facebook.react.bridge.ReactMethod;
import abi16_0_0.com.facebook.react.bridge.ReadableArray;
import abi16_0_0.com.facebook.react.bridge.ReadableMap;
import abi16_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi16_0_0.com.facebook.react.bridge.WritableMap;
import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInResult;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.Scope;

import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ResponseTypeValues;

import java.util.Map;

import de.greenrobot.event.EventBus;
import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.oauth.OAuthResultActivity;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.Exponent;

public class GoogleModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private final static int RC_LOG_IN = 1737;
  private final static String GOOGLE_ERROR = "GOOGLE_ERROR";
  private static final String TAG = GoogleModule.class.getSimpleName();

  private @Nullable Promise mLogInPromise;
  private final Map<String, Object> mExperienceProperties;

  public GoogleModule(ReactApplicationContext reactContext, Map<String, Object> experienceProperties) {
    super(reactContext);

    mExperienceProperties = experienceProperties;

    Exponent.getInstance().addActivityResultListener(this);
  }

  @Override
  public String getName() {
    return "ExponentGoogle";
  }

  @ReactMethod
  public void logInAsync(final ReadableMap config, final Promise promise) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (mLogInPromise != null) {
          promise.reject(GOOGLE_ERROR, "Another login request is already in progress.");
          return;
        }
        mLogInPromise = promise;

        String behavior = config.getString("behavior");
        String androidClientId = config.getString("androidClientId");
        ReadableArray scopesConfig = config.getArray("scopes");
        if ("system".equals(behavior)) {
          Scope[] scopes = new Scope[scopesConfig.size()];
          for (int i = 0; i < scopesConfig.size(); i++) {
            scopes[i] = new Scope(scopesConfig.getString(i));
          }
          systemLogIn(scopes, androidClientId);
        } else if ("web".equals(behavior)) {
          String[] scopes = new String[scopesConfig.size()];
          for (int i = 0; i < scopesConfig.size(); i++) {
            scopes[i] = scopesConfig.getString(i);
          }
          webLogIn(scopes, androidClientId);
        } else {
          reject("Invalid behavior. Expected 'system' or 'web', got " + behavior, null);
        }
      }
    });
  }

  @Override
  public void onActivityResult(final int requestCode, final int resultCode, final Intent data) {
    if (requestCode == RC_LOG_IN) {
      GoogleSignInResult logInResult = Auth.GoogleSignInApi.getSignInResultFromIntent(data);
      handleLogInResult(logInResult);
    }
  }

  private void systemLogIn(Scope[] scopes, String clientId) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      reject("No activity", null);
      return;
    }

    int googlePlayServicesCode = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(activity);
    if (googlePlayServicesCode != ConnectionResult.SUCCESS) {
      GoogleApiAvailability.getInstance().getErrorDialog(activity, googlePlayServicesCode, 0).show();
      WritableMap response = Arguments.createMap();
      response.putString("type", "cancel");
      resolve(response);
      return;
    }

    GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN);
    builder.requestIdToken(clientId);
    builder.requestServerAuthCode(clientId);
    for (Scope scope : scopes) {
      builder.requestScopes(scope);
    }

    GoogleSignInOptions gso = builder.build();

    GoogleApiClient apiClient = new GoogleApiClient.Builder(getReactApplicationContext())
        .addConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
          @Override
          public void onConnected(@Nullable Bundle bundle) {

          }

          @Override
          public void onConnectionSuspended(int i) {

          }
        })
        .addOnConnectionFailedListener(new GoogleApiClient.OnConnectionFailedListener() {
          @Override
          public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
            reject(connectionResult.getErrorMessage(), null);
          }
        })
        .addApi(Auth.GOOGLE_SIGN_IN_API, gso)
        .build();

    Intent signInIntent = Auth.GoogleSignInApi.getSignInIntent(apiClient);
    activity.startActivityForResult(signInIntent, RC_LOG_IN);
  }

  private void webLogIn(String[] scopes, String clientId) {
    Activity activity = Exponent.getInstance().getCurrentActivity();
    if (activity == null) {
      reject("No activity", null);
      return;
    }

    AuthorizationServiceConfiguration configuration = new AuthorizationServiceConfiguration(
        Uri.parse("https://accounts.google.com/o/oauth2/v2/auth"),
        Uri.parse("https://www.googleapis.com/oauth2/v4/token"),
        null);

    AuthorizationRequest request = new AuthorizationRequest.Builder(configuration,
        clientId,
        ResponseTypeValues.CODE,
        Uri.parse(getReactApplicationContext().getPackageName() + ":/oauthredirect"))
        .setScopes(scopes)
        .build();

    EventBus.getDefault().register(this);

    Intent postAuthIntent = new Intent(activity, OAuthResultActivity.class);

    // The auth intent gets started in the root task because it uses `singleTask` launch mode so if
    // we are not a standalone app we need to redirect back to the proper task when done.
    if (!ConstantsModule.getAppOwnership(mExperienceProperties).equals("standalone")) {
      postAuthIntent.putExtra(
          OAuthResultActivity.EXTRA_REDIRECT_EXPERIENCE_URL,
          (String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY));
    }

    AuthorizationService service = new AuthorizationService(activity);
    service.performAuthorizationRequest(
        request,
        PendingIntent.getActivity(activity, request.hashCode(), postAuthIntent, 0),
        PendingIntent.getActivity(activity, request.hashCode(), postAuthIntent, 0));
  }

  public void onEvent(OAuthResultActivity.OAuthResultEvent event) {
    EventBus.getDefault().unregister(this);

    if (event.error != null) {
      reject(event.error.getMessage(), event.error);
    } else if (event.authorizationResponse != null && event.tokenResponse != null) {
      WritableMap response = Arguments.createMap();
      response.putString("type", "success");
      response.putString("accessToken", event.tokenResponse.accessToken);
      response.putString("idToken", event.tokenResponse.idToken);
      response.putString("refreshToken", event.tokenResponse.refreshToken);
      response.putString("serverAuthCode", event.authorizationResponse.authorizationCode);
      resolve(response);
    } else {
      WritableMap response = Arguments.createMap();
      response.putString("type", "cancel");
      resolve(response);
    }
  }

  private void handleLogInResult(GoogleSignInResult logInResult) {
    WritableMap response = Arguments.createMap();
    if (logInResult.isSuccess()) {
      GoogleSignInAccount account = Assertions.assertNotNull(logInResult.getSignInAccount());

      response.putString("type", "success");
      response.putString("serverAuthCode", account.getServerAuthCode());
      response.putString("idToken", account.getIdToken());
      response.putString("refreshToken", null);

      WritableMap user = Arguments.createMap();
      user.putString("id", account.getId());
      user.putString("name", account.getDisplayName());
      user.putString("familyName", account.getFamilyName());
      user.putString("givenName", account.getGivenName());
      user.putString("email", account.getEmail());
      user.putString("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
      response.putMap("user", user);

      resolve(response);
    } else if (logInResult.getStatus().isCanceled()) {
      response.putString("type", "cancel");
      resolve(response);
    } else {
      reject(logInResult.getStatus().toString(), null);
    }
  }

  private void resolve(Object value) {
    if (mLogInPromise == null) {
      Log.w(TAG, "Could not resolve promise because it is null.");
      return;
    }

    mLogInPromise.resolve(value);
    mLogInPromise = null;
  }

  private void reject(String message, Throwable error) {
    if (mLogInPromise == null) {
      Log.w(TAG, "Could not reject promise because it is null.");
      return;
    }

    mLogInPromise.reject(GOOGLE_ERROR, message, error);
    mLogInPromise = null;
  }
}
