package expo.modules.firebase.analytics;

import android.app.Activity;
import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;

import expo.modules.firebase.core.FirebaseCoreInterface;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.Map;
import java.util.Set;

import androidx.annotation.Nullable;

public class FirebaseAnalyticsModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseAnalytics";

  private Activity mActivity;
  private ModuleRegistry mModuleRegistry;

  public FirebaseAnalyticsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    ActivityProvider mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
    mModuleRegistry = moduleRegistry;

  }

  private FirebaseAnalytics getFirebaseAnalyticsOrReject(final Promise promise) {
    FirebaseCoreInterface firebaseCore = mModuleRegistry.getModule(FirebaseCoreInterface.class);
    if (firebaseCore == null) {
      promise.reject("ERR_FIREBASE_ANALYTICS",
              "FirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has react-native-unimodules installed.");
      return null;
    }
    FirebaseApp defaultApp = firebaseCore.getDefaultApp();
    if (defaultApp == null) {
      promise.reject("ERR_FIREBASE_ANALYTICS",
              "Firebase app is not initialized. Ensure your app has a valid google-services.json bundled.");
      return null;
    }
    FirebaseApp systemApp = null;
    try {
      systemApp = FirebaseApp.getInstance();
    } catch (Exception e) {
      // nop
    }
    if ((systemApp == null) || !defaultApp.getName().equals(systemApp.getName())) {
      promise.reject("ERR_FIREBASE_ANALYTICS", "Analytics events can only be logged for the default app.");
      return null;
    }
    FirebaseAnalytics analytics = FirebaseAnalytics.getInstance(mActivity.getApplicationContext());
    if (analytics == null) {
      promise.reject("ERR_FIREBASE_ANALYTICS", "Failed to obtain Analytics instance");
      return null;
    }
    return analytics;
  }

  @ExpoMethod
  public void logEvent(final String name, @Nullable Map<String, Object> params, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.logEvent(name, new MapArguments(params).toBundle());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setAnalyticsCollectionEnabled(final Boolean enabled, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.setAnalyticsCollectionEnabled(enabled);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setCurrentScreen(final String screenName, final String screenClassOverride, final Promise promise) {
    // This is the only method that runs on the main thread.
    mActivity.runOnUiThread(new Runnable() {
      public void run() {
        try {
          FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
          if (analytics == null)
            return;
          analytics.setCurrentScreen(mActivity, screenName, screenClassOverride);
          promise.resolve(null);
        } catch (Exception e) {
          promise.reject(e);
        }
      }
    });
  }

  @ExpoMethod
  public void setSessionTimeoutDuration(final double milliseconds, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.setSessionTimeoutDuration((long) milliseconds);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setUserId(final String id, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.setUserId(id);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setUserProperties(@Nullable Map<String, Object> properties, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      Set<String> keys = properties.keySet();
      for (String key : keys) {
        analytics.setUserProperty(key, (String) properties.get(key));
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void resetAnalyticsData(Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.resetAnalyticsData();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
