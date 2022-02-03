package expo.modules.firebase.analytics;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;

import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;

import expo.modules.firebase.core.FirebaseCoreInterface;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.MapArguments;
import expo.modules.core.errors.CurrentActivityNotFoundException;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.core.interfaces.RegistryLifecycleListener;

import java.util.Map;
import java.util.Set;
import java.util.ArrayList;

import androidx.annotation.Nullable;

public class FirebaseAnalyticsModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseAnalytics";

  private ActivityProvider mActivityProvider;
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
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mModuleRegistry = moduleRegistry;
  }

  private FirebaseAnalytics getFirebaseAnalyticsOrReject(final Promise promise) {
    FirebaseCoreInterface firebaseCore = mModuleRegistry.getModule(FirebaseCoreInterface.class);
    Activity activity = mActivityProvider.getCurrentActivity();

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
      // default firebase app doesn't exist, continue
    }
    if ((systemApp == null) || !defaultApp.getName().equals(systemApp.getName())) {
      promise.reject("ERR_FIREBASE_ANALYTICS", "Analytics events can only be logged for the default app.");
      return null;
    }
    if (activity == null) {
      promise.reject(new CurrentActivityNotFoundException());
      return null;
    }
    FirebaseAnalytics analytics = FirebaseAnalytics.getInstance(activity.getApplicationContext());
    if (analytics == null) {
      promise.reject("ERR_FIREBASE_ANALYTICS", "Failed to obtain Analytics instance");
      return null;
    }
    return analytics;
  }

  private static Bundle convertToBundle(final MapArguments mapArguments) {
    // A variation on MapArguments.toBundle that recursively converts the contents
    // of arrays to Bundle objects if needed (to support the `items` array).
    Bundle bundle = new Bundle();
    for (String key : mapArguments.keys()) {
      Object value = mapArguments.get(key);
      if (value == null) {
        bundle.putString(key, null);
      } else if (value instanceof String) {
        bundle.putString(key, (String) value);
      } else if (value instanceof Integer) {
        bundle.putInt(key, (Integer) value);
      } else if (value instanceof Double) {
        bundle.putDouble(key, (Double) value);
      } else if (value instanceof Long) {
        bundle.putLong(key, (Long) value);
      } else if (value instanceof Boolean) {
        bundle.putBoolean(key, (Boolean) value);
      } else if (value instanceof ArrayList) {
        ArrayList array = new ArrayList();
        for(Object item : ((ArrayList) value)) {
          array.add(convertToBundle(new MapArguments((Map<String, Object>)item)));
        }
        bundle.putParcelableArrayList(key, array);
      } else if (value instanceof Map) {
        bundle.putBundle(key, convertToBundle(new MapArguments((Map) value)));
      } else if (value instanceof Bundle) {
        bundle.putBundle(key, (Bundle) value);
      } else {
        throw new UnsupportedOperationException("Could not put a value of " + value.getClass() + " to bundle.");
      }
    }
    return bundle;
  }

  @ExpoMethod
  public void logEvent(final String name, @Nullable Map<String, Object> params, Promise promise) {
    try {
      FirebaseAnalytics analytics = getFirebaseAnalyticsOrReject(promise);
      if (analytics == null)
        return;
      analytics.logEvent(name, params == null ? null : convertToBundle(new MapArguments(params)));
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
