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

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;
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

  private final Context getApplicationContext() {
    Activity activity = getCurrentActivity();
    if (activity != null) {
      return activity.getApplicationContext();
    }
    return null;
  }

  private final UIManager getUIManager() {
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      UIManager mUIManager = mModuleRegistry.getModule(UIManager.class);
      return mUIManager;
    }
    return null;
  }

  private final Activity getCurrentActivity() {
    if (mModuleRegistry != null && mModuleRegistry.getModule(ActivityProvider.class) != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  private Context getApplicationContextOrReject(Promise promise) {
    Context context = getApplicationContext();
    if (context == null) {
      promise.reject("E_EXPO_FIREBASE_ANALYTICS", "Module registry is not initialized, or ActivityProvider is not available.");
    }
    return context;
  }

  @ExpoMethod
  public void logEvent(final String name, @Nullable Map<String, Object> params, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    Bundle bundleParams = new Bundle();
    if (params != null) {
      bundleParams = Utils.bundleToMap(params);
    }
    FirebaseAnalytics.getInstance(context).logEvent(name, bundleParams);
    promise.resolve(null);
  }

  /**
   * @param enabled
   */
  @ExpoMethod
  public void setAnalyticsCollectionEnabled(final Boolean enabled, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    FirebaseAnalytics.getInstance(context).setAnalyticsCollectionEnabled(enabled);
    promise.resolve(null);
  }

  /**
   * @param screenName
   * @param screenClassOverride
   */
  @ExpoMethod
  public void setCurrentScreen(final String screenName, final String screenClassOverride, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    }

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
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    FirebaseAnalytics.getInstance(context).setMinimumSessionDuration((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * @param milliseconds
   */
  @ExpoMethod
  public void setSessionTimeoutDuration(final double milliseconds, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    FirebaseAnalytics.getInstance(context).setSessionTimeoutDuration((long) milliseconds);
    promise.resolve(null);
  }

  /**
   * @param id
   */
  @ExpoMethod
  public void setUserId(final String id, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    FirebaseAnalytics.getInstance(context).setUserId(id);
    promise.resolve(null);
  }

  /**
   * @param name
   * @param value
   */
  @ExpoMethod
  public void setUserProperty(final String name, final String value, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) {
      return;
    } 

    FirebaseAnalytics.getInstance(context).setUserProperty(name, value);
    promise.resolve(null);
  }
}
