// Copyright 2015-present 650 Industries. All rights reserved.

package abi11_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.text.TextUtils;
import android.util.Log;

import abi11_0_0.com.facebook.infer.annotation.Assertions;
import abi11_0_0.com.facebook.react.bridge.Arguments;
import abi11_0_0.com.facebook.react.bridge.Promise;
import abi11_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi11_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi11_0_0.com.facebook.react.bridge.ReactMethod;
import abi11_0_0.com.facebook.react.bridge.ReadableArray;
import abi11_0_0.com.facebook.react.bridge.ReadableMap;
import abi11_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi11_0_0.com.facebook.react.bridge.WritableMap;
import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInResult;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.Scope;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.OAuthWebViewActivity;
import host.exp.exponentview.Exponent;

public class GoogleModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private final static int RC_LOG_IN = 1737;
  private final static int RC_WEB_LOG_IN = 1738;
  private final static String GOOGLE_ERROR = "GOOGLE_ERROR";
  private static final String TAG = GoogleModule.class.getSimpleName();

  private @Nullable Promise mLogInPromise;

  public GoogleModule(ReactApplicationContext reactContext) {
    super(reactContext);

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
        String webClientId = config.getString("webClientId");
        ReadableArray scopesConfig = config.getArray("scopes");
        if ("system".equals(behavior)) {
          Scope[] scopes = new Scope[scopesConfig.size()];
          for (int i = 0; i < scopesConfig.size(); i++) {
            scopes[i] = new Scope(scopesConfig.getString(i));
          }
          systemLogIn(scopes, webClientId);
        } else if ("web".equals(behavior)) {
          String[] scopes = new String[scopesConfig.size()];
          for (int i = 0; i < scopesConfig.size(); i++) {
            scopes[i] = scopesConfig.getString(i);
          }
          webLogIn(scopes, webClientId);
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
    } else if (requestCode == RC_WEB_LOG_IN) {
      handleWebLogInResult(resultCode, data);
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
    for (Scope scope : scopes) {
      builder.requestScopes(scope);
    }

    builder.requestIdToken(clientId);
    builder.requestServerAuthCode(clientId);

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

  private void webLogIn(String[] scopes, @Nullable String clientId) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      reject("No activity", null);
      return;
    }
    Intent webViewIntent = new Intent(
        activity,
        OAuthWebViewActivity.class);
    String url =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        "scope=" + TextUtils.join("%20", scopes) + "&" +
        "redirect_uri=https://oauth.host.exp.com&" +
        "response_type=token&" +
        "client_id=" + clientId;
    webViewIntent.putExtra(OAuthWebViewActivity.DATA_URL, url);

    activity.startActivityForResult(webViewIntent, RC_WEB_LOG_IN);
  }

  private void handleLogInResult(GoogleSignInResult logInResult) {
    WritableMap response = Arguments.createMap();
    if (logInResult.isSuccess()) {
      GoogleSignInAccount account = Assertions.assertNotNull(logInResult.getSignInAccount());

      response.putString("type", "success");
      response.putString("serverAuthCode", account.getServerAuthCode());
      response.putString("idToken", account.getIdToken());

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

  private void handleWebLogInResult(int result, Intent data) {
    WritableMap response = Arguments.createMap();
    if (result == Activity.RESULT_OK) {
      String resUrl = data.getStringExtra(OAuthWebViewActivity.DATA_RESULT_URL);
      // The response url from google uses the format '<url>/#<query_params>' so we can just replace
      // '/#' with '?' to have a valid uri and parse it with Uri#getQueryParameter.
      Uri uri = Uri.parse(resUrl.replace("/#", "?"));
      response.putString("type", "success");
      response.putString("accessToken", uri.getQueryParameter("access_token"));
      resolve(response);
    } else {
      response.putString("type", "cancel");
      resolve(response);
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
