// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules.external.facebook;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.FacebookRequestError;
import com.facebook.FacebookSdk;
import com.facebook.GraphRequest;
import com.facebook.GraphResponse;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import abi5_0_0.com.facebook.react.bridge.Arguments;
import abi5_0_0.com.facebook.react.bridge.Promise;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import abi5_0_0.com.facebook.react.bridge.ReadableArray;
import abi5_0_0.com.facebook.react.bridge.WritableMap;
import host.exp.exponent.ActivityResultDelegator;
import host.exp.exponent.ActivityResultListener;

public class FacebookLoginModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private final String CALLBACK_TYPE_SUCCESS = "success";
  private final String CALLBACK_TYPE_ERROR = "error";
  private final String CALLBACK_TYPE_CANCEL = "cancel";

  private final ActivityResultDelegator mDelegatorActivity;

  private CallbackManager mCallbackManager;
  private Promise mTokenPromise;

  public FacebookLoginModule(ReactApplicationContext reactContext, ActivityResultDelegator delegator, Context context) {
    super(reactContext);

    mDelegatorActivity = delegator;
    mDelegatorActivity.addActivityResultListener(this);

    FacebookSdk.sdkInitialize(context);

    mCallbackManager = CallbackManager.Factory.create();
    LoginManager.getInstance().registerCallback(mCallbackManager, getLoginCallback());
  }

  @Override
  public String getName() {
    return "FacebookLoginModule";
  }

  @ReactMethod
  public void setApplicationIdAsync(String appId, final Promise promise) {
    FacebookSdk.setApplicationId(appId);
    promise.resolve(true);
  }

  @ReactMethod
  public void logInWithReadPermissionsAsync(final ReadableArray permissions, final Promise promise) {
    if (mTokenPromise != null) {
      AccessToken accessToken = AccessToken.getCurrentAccessToken();

      WritableMap map = Arguments.createMap();

      if (accessToken != null) {
        map.putString("token", AccessToken.getCurrentAccessToken().getToken());
        map.putString("expiration", String.valueOf(AccessToken.getCurrentAccessToken()));
        map.putBoolean("cache", true);
        resolvePromise(CALLBACK_TYPE_SUCCESS, map);
      } else {
        map.putString("message", "Cannot register multiple callbacks");
        resolvePromise(CALLBACK_TYPE_CANCEL, map);
      }
    } else {
      mTokenPromise = promise;

      // TODO: is there a cleaner way to convert ReadableArray into a typed collection?
      List<String> permissionsStrings = new ArrayList<String>();
      for (int ii = 0; ii < permissions.size(); ii++) {
        String permission = permissions.getString(ii);
        if (permission != null) {
          permissionsStrings.add(permission);
        }
      }

      LoginManager.getInstance().logInWithReadPermissions((Activity) mDelegatorActivity, permissionsStrings);
    }
  }

  @ReactMethod
  public void getCurrentAccessTokenAsync(final Promise promise) {
    AccessToken currentToken = AccessToken.getCurrentAccessToken();
    WritableMap result = Arguments.createMap();
    if (currentToken != null) {
      result.putString("token", currentToken.getToken());
      result.putInt("expires", (int) (currentToken.getExpires().getTime() / 1000));
    }
    promise.resolve(result);
  }

  @Override
  public void onActivityResult(final int requestCode, final int resultCode, final Intent data) {
    mCallbackManager.onActivityResult(requestCode, resultCode, data);
  }

  private void resolvePromise(String type, WritableMap map) {
    if (mTokenPromise != null) {
      map.putString("type", type);
      map.putString("provider", "facebook");

      mTokenPromise.resolve(map);
      mTokenPromise = null;
    }
  }

  private final FacebookCallback<LoginResult> getLoginCallback() {
    return new FacebookCallback<LoginResult>() {

      @Override
      public void onSuccess(final LoginResult loginResult) {
        GraphRequest.newMeRequest(loginResult.getAccessToken(), new GraphRequest.GraphJSONObjectCallback() {
          @Override
          public void onCompleted(JSONObject me, GraphResponse response) {
            if (mTokenPromise != null) {
              FacebookRequestError error = response.getError();

              if (error != null) {
                WritableMap map = Arguments.createMap();
                map.putString("errorType", error.getErrorType());
                map.putString("message", error.getErrorMessage());
                map.putString("recoveryMessage", error.getErrorRecoveryMessage());
                map.putString("userMessage", error.getErrorUserMessage());
                map.putString("userTitle", error.getErrorUserTitle());
                map.putInt("code", error.getErrorCode());
                resolvePromise(CALLBACK_TYPE_ERROR, map);
              } else {
                WritableMap map = Arguments.createMap();
                map.putString("email", me.optString("email"));
                map.putString("token", loginResult.getAccessToken().getToken());
                map.putString("expiration", String.valueOf(loginResult.getAccessToken().getExpires()));
                resolvePromise(CALLBACK_TYPE_SUCCESS, map);
              }
            } else {
              WritableMap map = Arguments.createMap();
              map.putString("message", "Insufficient permissions");
              resolvePromise(CALLBACK_TYPE_ERROR, map);
            }
          }
        }).executeAsync();
      }

      @Override
      public void onCancel() {
        if (mTokenPromise != null) {
          resolvePromise(CALLBACK_TYPE_CANCEL, Arguments.createMap());
        }
      }

      @Override
      public void onError(FacebookException exception) {
        if (mTokenPromise != null) {

          WritableMap map = Arguments.createMap();
          map.putString("message", exception.getMessage());
          resolvePromise(CALLBACK_TYPE_ERROR, map);
        }
        if (exception != null) {
          if (AccessToken.getCurrentAccessToken() != null) {
            LoginManager.getInstance().logOut();
          }
        }
      }
    };
  }
}
