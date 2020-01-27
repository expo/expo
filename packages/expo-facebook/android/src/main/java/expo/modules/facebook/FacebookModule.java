package expo.modules.facebook;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.FacebookSdk;
import com.facebook.login.LoginBehavior;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.UIManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class FacebookModule extends ExportedModule implements ActivityEventListener {
  private CallbackManager mCallbackManager;
  private ModuleRegistry mModuleRegistry;
  protected String mAppId;
  protected String mAppName;

  public FacebookModule(Context context) {
    super(context);
    mCallbackManager = CallbackManager.Factory.create();
  }

  @Override
  public String getName() {
    return "ExponentFacebook";
  }

  @ExpoMethod
  public void setAutoLogAppEventsEnabledAsync(final Boolean enabled, Promise promise) {
    FacebookSdk.setAutoLogAppEventsEnabled(enabled);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setAutoInitEnabledAsync(final Boolean enabled, final Promise promise) {
    FacebookSdk.setAutoInitEnabled(enabled);
    if (enabled) {
      FacebookSdk.fullyInitialize();
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void setAdvertiserIDCollectionEnabledAsync(final Boolean enabled, Promise promise) {
    FacebookSdk.setAdvertiserIDCollectionEnabled(enabled);
    promise.resolve(null);
  }
  
  @ExpoMethod
  public void getAccessTokenAsync(Promise promise) {
    AccessToken accessToken = AccessToken.getCurrentAccessToken();

    if (accessToken == null) {
      promise.resolve(null);
      return;
    }

    Bundle response = new Bundle();
    response.putString("token", accessToken.getToken());
    response.putString("userID", accessToken.getUserId());
    response.putString("appID", accessToken.getApplicationId());

    response.putStringArrayList("permissions", new ArrayList<>(accessToken.getPermissions()));
    response.putStringArrayList("declinedPermissions", new ArrayList<>(accessToken.getDeclinedPermissions()));
    response.putStringArrayList("expiredPermissions", new ArrayList<>(accessToken.getExpiredPermissions()));

    response.putInt("expires", (int) accessToken.getExpires().getTime() / 1000);
    response.putInt("dataAccessExpires", (int) accessToken.getDataAccessExpirationTime().getTime() / 1000);

    response.putInt("refresh", (int) accessToken.getLastRefresh().getTime() / 1000);
    response.putString("tokenSource", accessToken.getSource().name());

    promise.resolve(response);
  }

  @ExpoMethod
  public void initializeAsync(ReadableArguments options, final Promise promise) {
    final String appId = options.getString("appId");

    try {
      if (appId != null) {
        mAppId = appId;
        FacebookSdk.setApplicationId(appId);
      }
      if (options.containsKey("appName ")) {
        mAppName = options.getString("appName");
        FacebookSdk.setApplicationName(mAppName);
      }
      if (options.containsKey("version")) {
        FacebookSdk.setGraphApiVersion(options.getString("version"));
      }
      if (options.containsKey("autoLogAppEvents")) {
        Boolean autoLogAppEvents = options.getBoolean("autoLogAppEvents");
        FacebookSdk.setAutoLogAppEventsEnabled(autoLogAppEvents);
      }
      if (options.containsKey("domain")) {
        FacebookSdk.setFacebookDomain(options.getString("domain"));
      }
      if (options.containsKey("isDebugEnabled")) {
        FacebookSdk.setIsDebugEnabled(options.getBoolean("isDebugEnabled"));
      }


      FacebookSdk.sdkInitialize(getContext(), new FacebookSdk.InitializeCallback() {
        @Override
        public void onInitialized() {
          FacebookSdk.fullyInitialize();
          mAppId = FacebookSdk.getApplicationId();
          mAppName = FacebookSdk.getApplicationName();
          promise.resolve(null);
        }
      });
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void logOutAsync(final Promise promise) {
    AccessToken.setCurrentAccessToken(null);
    LoginManager.getInstance().logOut();
    promise.resolve(null);
  }

  @ExpoMethod
  public void logInWithReadPermissionsAsync(final ReadableArguments config, final Promise promise) {
    if (FacebookSdk.getApplicationId() == null) {
      promise.reject("E_CONF_ERROR", "No appId configured, required for initialization. " +
          "Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside AndroidManifest.xml.");
    }

    AccessToken.setCurrentAccessToken(null);
    List<String> permissions = (List<String>) config.getList("permissions", Arrays.asList("public_profile", "email"));

    if (config.containsKey("behavior")) {
      LoginBehavior behavior = LoginBehavior.NATIVE_WITH_FALLBACK;
      switch (config.getString("behavior")) {
        case "browser":
          behavior = LoginBehavior.WEB_ONLY;
          break;
        case "web":
          behavior = LoginBehavior.WEB_VIEW_ONLY;
          break;
      }
      LoginManager.getInstance().setLoginBehavior(behavior);
    }

    LoginManager.getInstance().registerCallback(mCallbackManager, new FacebookCallback<LoginResult>() {
      @Override
      public void onSuccess(LoginResult loginResult) {
        LoginManager.getInstance().registerCallback(mCallbackManager, null);

        // This is the only route through which we send an access token back. Make sure the
        // application ID is correct.
        if (!mAppId.equals(loginResult.getAccessToken().getApplicationId())) {
          promise.reject(new IllegalStateException("Logged into wrong app, try again?"));
          return;
        }
        Bundle response = new Bundle();
        response.putString("type", "success");
        response.putString("token", loginResult.getAccessToken().getToken());
        response.putInt("expires", (int) (loginResult.getAccessToken().getExpires().getTime() / 1000));

        response.putStringArrayList("permissions", new ArrayList<>(loginResult.getAccessToken().getPermissions()));
        response.putStringArrayList("declinedPermissions", new ArrayList<>(loginResult.getAccessToken().getDeclinedPermissions()));
        promise.resolve(response);
      }

      @Override
      public void onCancel() {
        LoginManager.getInstance().registerCallback(mCallbackManager, null);

        Bundle response = new Bundle();
        response.putString("type", "cancel");
        promise.resolve(response);
      }

      @Override
      public void onError(FacebookException error) {
        LoginManager.getInstance().registerCallback(mCallbackManager, null);

        promise.reject(error);
      }
    });

    try {
      LoginManager.getInstance().logInWithReadPermissions(mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity(), permissions);
    } catch (FacebookException e) {
      promise.reject("E_FBLOGIN_ERROR", "An error occurred while trying to log in to Facebook", e);
    }
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    if (mModuleRegistry != null) {
      mModuleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
    }
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    mCallbackManager.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public void onNewIntent(Intent intent) {
    // do nothing
  }
}
