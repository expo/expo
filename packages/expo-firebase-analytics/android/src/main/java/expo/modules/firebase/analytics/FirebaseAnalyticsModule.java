package expo.modules.firebase.analytics;

import android.app.Activity;
import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.analytics.FirebaseAnalytics;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;

public class FirebaseAnalyticsModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseAnalytics";

  private Activity mActivity;

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
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    FirebaseApp firebaseApp = getDefaultApp();
    if (firebaseApp != null) {
      FirebaseOptions appOptions = firebaseApp.getOptions();
      Map<String, Object> options = new HashMap<>();

      options.put("apiKey", appOptions.getApiKey());
      options.put("appId", appOptions.getApplicationId());
      options.put("databaseURL", appOptions.getDatabaseUrl());
      options.put("messagingSenderId", appOptions.getGcmSenderId());
      options.put("name", firebaseApp.getName());
      options.put("projectId", appOptions.getProjectId());
      options.put("storageBucket", appOptions.getStorageBucket());

      constants.put("app", options);
    }

    return constants;
  }

  @ExpoMethod
  public void initializeAppDangerously(final Map<String, String> options, Promise promise) {
    try {
      FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

      builder.setApiKey(options.get("apiKey"));
      builder.setApplicationId(options.get("appId"));
      builder.setProjectId(options.get("projectId"));
      builder.setDatabaseUrl(options.get("databaseURL"));
      builder.setStorageBucket(options.get("storageBucket"));
      builder.setGcmSenderId(options.get("messagingSenderId"));
      builder.setGaTrackingId(options.get("trackingId"));

      FirebaseApp firebaseApp = getDefaultApp();
      if (firebaseApp != null) {
        FirebaseOptions currentOptions = firebaseApp.getOptions();
        if (!currentOptions.getApiKey().equals(options.get("apiKey")) ||
                !currentOptions.getApplicationId().equals(options.get("appId"))) {
          firebaseApp.delete();
        } else {
          promise.resolve(null);
          return;
        }
      }
      FirebaseApp.initializeApp(mActivity.getApplicationContext(), builder.build());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  private @Nullable FirebaseApp getDefaultApp() {
    try {
      return FirebaseApp.getInstance();
    } catch (Exception ignored) {
      // do nothing
    }
    return null;
  }

  @ExpoMethod
  public void deleteApp(Promise promise) {
    try {
      FirebaseApp firebaseApp = getDefaultApp();
      if (firebaseApp != null) {
        firebaseApp.delete();
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void logEvent(final String name, @Nullable Map<String, Object> params, Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).logEvent(name, new MapArguments(params).toBundle());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setAnalyticsCollectionEnabled(final Boolean enabled, Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setAnalyticsCollectionEnabled(enabled);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setCurrentScreen(final String screenName, final String screenClassOverride, final Promise promise) {
    // This is the only method that runs on the main thread.
    mActivity.runOnUiThread(() -> {
      try {
        FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setCurrentScreen(mActivity, screenName, screenClassOverride);
        promise.resolve(null);
      } catch (Exception e) {
        promise.reject(e);
      }
    });
  }

  @ExpoMethod
  public void setSessionTimeoutDuration(final double milliseconds, Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setSessionTimeoutDuration((long) milliseconds);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setUserId(final String id, Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setUserId(id);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void setUserProperty(final String name, final String value, Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setUserProperty(name, value);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void resetAnalyticsData(Promise promise) {
    try {
      FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).resetAnalyticsData();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}

