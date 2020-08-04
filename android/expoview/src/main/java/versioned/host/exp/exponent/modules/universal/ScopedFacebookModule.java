package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.facebook.FacebookSdk;

import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.LifecycleEventListener;

import expo.modules.facebook.FacebookModule;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedFacebookModule extends FacebookModule implements LifecycleEventListener {
  private final static String ERR_FACEBOOK_UNINITIALIZED = "ERR_FACEBOOK_UNINITIALIZED";


  private boolean mIsInitialized = false;
  private SharedPreferences mSharedPreferences;

  public ScopedFacebookModule(Context context, JSONObject manifest) {
    super(context);

    mSharedPreferences = context.getSharedPreferences(getClass().getCanonicalName(), Context.MODE_PRIVATE);
    boolean hasPreviouslySetAutoInitEnabled = mSharedPreferences.getBoolean(FacebookSdk.AUTO_INIT_ENABLED_PROPERTY, false);
    boolean manifestDefinesAutoInitEnabled = false;
    String facebookAppId = null;
    String facebookApplicationName = null;
    try {
      facebookAppId = manifest.getString("facebookAppId");
      facebookApplicationName = manifest.getString("facebookDisplayName");
      manifestDefinesAutoInitEnabled = manifest.getBoolean("facebookAutoInitEnabled");
    } catch (JSONException e) {
      // do nothing
    }

    if (hasPreviouslySetAutoInitEnabled || manifestDefinesAutoInitEnabled) {
      if (facebookAppId != null) {
        FacebookSdk.setApplicationId(facebookAppId);
        FacebookSdk.setApplicationName(facebookApplicationName);
        FacebookSdk.sdkInitialize(context, () -> {
          mIsInitialized = true;
          FacebookSdk.fullyInitialize();
        });
      } else {
        Log.w("E_FACEBOOK", "FacebookAutoInit is enabled, but no FacebookAppId has been provided." +
            "Facebook SDK initialization aborted.");
      }
    }
  }

  @Override
  public void onHostResume() {
    if (mAppId != null) {
      FacebookSdk.setApplicationId(mAppId);
    }
    if (mAppName != null) {
      FacebookSdk.setApplicationName(mAppName);
    }
  }

  @Override
  public void setAutoInitEnabledAsync(Boolean enabled, Promise promise) {
    mSharedPreferences.edit().putBoolean(FacebookSdk.AUTO_INIT_ENABLED_PROPERTY, enabled).apply();
    super.setAutoInitEnabledAsync(enabled, promise);
  }

  @Override
  public void initializeAsync(ReadableArguments options, final Promise promise) {
    mIsInitialized = true;
    super.initializeAsync(options, promise);
  }

  @Override
  public void logInWithReadPermissionsAsync(ReadableArguments config, Promise promise) {
    if (!mIsInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.");
    }
    super.logInWithReadPermissionsAsync(config, promise);
  }

  @Override
  public void getAuthenticationCredentialAsync(Promise promise) {
    if (!mIsInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.");
    }
    super.getAuthenticationCredentialAsync(promise);
  }

  @Override
  public void logOutAsync(final Promise promise) {
    if (!mIsInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.");
    }
    super.logOutAsync(promise);
  }

  @Override
  public void onHostPause() {
    FacebookSdk.setApplicationId(null);
    FacebookSdk.setApplicationName(null);
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }
}
