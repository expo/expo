package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.FacebookSdk;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.LifecycleEventListener;

import expo.modules.facebook.FacebookModule;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedFacebookModule extends FacebookModule implements LifecycleEventListener {
  private boolean mIsInitialized = false;
  private SharedPreferences mSharedPreferences;

  public ScopedFacebookModule(Context context, ExperienceId experienceId) {
    super(context);

    String preferencesKey = getClass().getCanonicalName() + "#" + experienceId.get();
    mSharedPreferences = context.getSharedPreferences(preferencesKey, Context.MODE_PRIVATE);

    if (mSharedPreferences.getBoolean(FacebookSdk.AUTO_INIT_ENABLED_PROPERTY, false)) {
      mIsInitialized = true;
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
  public void initializeAsync(String appId, String appName, Promise promise) {
    mIsInitialized = true;
    super.initializeAsync(appId, appName, promise);
  }

  @Override
  public void logInWithReadPermissionsAsync(ReadableArguments config, Promise promise) {
    if (!mIsInitialized) {
      promise.reject("E_NO_INIT", "Facebook SDK has not been initialized yet.");
    }
    super.logInWithReadPermissionsAsync(config, promise);
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
