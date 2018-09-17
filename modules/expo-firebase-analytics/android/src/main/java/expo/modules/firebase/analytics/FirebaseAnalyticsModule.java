package expo.modules.firebase.analytics;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.HashMap;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.Utils;

@SuppressLint("MissingPermission")
public class FirebaseAnalyticsModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseAnalyticsModule.class.getCanonicalName();

  private ModuleRegistry mModuleRegistry;

  public FirebaseAnalyticsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseAnalytics";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  @ExpoMethod
  public void logEvent(final String name, @Nullable Map<String, Object> params, Promise promise) {

    Bundle bundleParams = new Bundle();
    if (params != null) {
      bundleParams = Utils.readableMapToWritableMap(params);
    }
    FirebaseAnalytics.getInstance(getApplicationContext()).logEvent(name, bundleParams);
    promise.resolve(null);
  }

  /**
   * @param enabled
   */
  @ExpoMethod
  public void setAnalyticsCollectionEnabled(final Boolean enabled, Promise promise) {
    FirebaseAnalytics.getInstance(getApplicationContext()).setAnalyticsCollectionEnabled(enabled);
    promise.resolve(null);
  }

  /**
   * @param screenName
   * @param screenClassOverride
   */
  @ExpoMethod
  public void setCurrentScreen(final String screenName, final String screenClassOverride, Promise promise) {
    final Activity activity = getCurrentActivity();
    if (activity != null) {
      // needs to be run on main thread
      Log.d(TAG, "setCurrentScreen " + screenName + " - " + screenClassOverride);
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          FirebaseAnalytics.getInstance(getApplicationContext()).setCurrentScreen(activity, screenName, screenClassOverride);
        }
      });
    }
    promise.resolve(null);
  }

  /**
   * @param milliseconds
   */
  @ExpoMethod
  public void setMinimumSessionDuration(final double milliseconds, Promise promise) {
    FirebaseAnalytics.getInstance(getApplicationContext()).setMinimumSessionDuration((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * @param milliseconds
   */
  @ExpoMethod
  public void setSessionTimeoutDuration(final double milliseconds, Promise promise) {
    FirebaseAnalytics.getInstance(getApplicationContext()).setSessionTimeoutDuration((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * @param id
   */
  @ExpoMethod
  public void setUserId(final String id, Promise promise) {
    FirebaseAnalytics.getInstance(getApplicationContext()).setUserId(id);
    promise.resolve(null);
  }

  /**
   * @param name
   * @param value
   */
  @ExpoMethod
  public void setUserProperty(final String name, final String value, Promise promise) {
    FirebaseAnalytics.getInstance(getApplicationContext()).setUserProperty(name, value);
    promise.resolve(null);
  }
}
