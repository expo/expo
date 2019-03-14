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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;

public class FacebookModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {
  private CallbackManager mCallbackManager;
  private ModuleRegistry mModuleRegistry;

  public FacebookModule(Context context) {
    super(context);
    //noinspection deprecation
    FacebookSdk.sdkInitialize(context);
    mCallbackManager = CallbackManager.Factory.create();
  }

  @Override
  public String getName() {
    return "ExponentFacebook";
  }

  @ExpoMethod
  public void logInWithReadPermissionsAsync(final String appId, final ReadableArguments config, final Promise promise) {
    AccessToken.setCurrentAccessToken(null);
    FacebookSdk.setApplicationId(appId);

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
        if (!appId.equals(loginResult.getAccessToken().getApplicationId())) {
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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
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
