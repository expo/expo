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
  private final static String ERR_FACEBOOK_MISCONFIGURED = "ERR_FACEBOOK_MISCONFIGURED";
  private final static String ERR_FACEBOOK_LOGIN = "ERR_FACEBOOK_LOGIN";

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
  public void getAuthenticationCredentialAsync(Promise promise) {
    AccessToken accessToken = AccessToken.getCurrentAccessToken();
    promise.resolve(accessTokenToBundle(accessToken));
  }

  private Bundle accessTokenToBundle(AccessToken accessToken) {
    if (accessToken == null) {
      return null;
    }

    Bundle response = new Bundle();
    response.putString("token", accessToken.getToken());
    response.putString("userId", accessToken.getUserId());
    response.putString("appId", accessToken.getApplicationId());

    response.putStringArrayList("permissions", new ArrayList<>(accessToken.getPermissions()));
    response.putStringArrayList("declinedPermissions", new ArrayList<>(accessToken.getDeclinedPermissions()));
    response.putStringArrayList("expiredPermissions", new ArrayList<>(accessToken.getExpiredPermissions()));

    response.putDouble("expirationDate", accessToken.getExpires().getTime());
    response.putDouble("dataAccessExpirationDate", accessToken.getDataAccessExpirationTime().getTime());

    response.putDouble("refreshDate", accessToken.getLastRefresh().getTime());
    response.putString("tokenSource", accessToken.getSource().name());

    return response;
  }

  @ExpoMethod
  public void initializeAsync(ReadableArguments options, final Promise promise) {
    final String appId = options.getString("appId");

    try {
      if (appId != null) {
        mAppId = appId;
        FacebookSdk.setApplicationId(appId);
      }
      if (options.containsKey("appName")) {
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
      promise.reject(ERR_FACEBOOK_MISCONFIGURED, "An error occurred while trying to initialize a FBSDK app", e);
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
      promise.reject(ERR_FACEBOOK_MISCONFIGURED, "No appId configured, required for initialization. " +
          "Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside AndroidManifest.xml.");
    }

    // Log out
    AccessToken.setCurrentAccessToken(null);
    LoginManager.getInstance().logOut();

    // Convert permissions
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
        Bundle response = accessTokenToBundle(loginResult.getAccessToken());
        response.putString("type", "success");
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

        promise.reject(ERR_FACEBOOK_LOGIN, "An error occurred while trying to log in to Facebook", error);
      }
    });

    try {
      LoginManager.getInstance().logInWithReadPermissions(mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity(), permissions);
    } catch (FacebookException e) {
      promise.reject(ERR_FACEBOOK_LOGIN, "An error occurred while trying to log in to Facebook", e);
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
