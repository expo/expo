package expo.modules.firebase.analytics;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.RemoteException;
import android.provider.Settings;
import android.util.Log;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.analytics.FirebaseAnalytics;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListenerAsync;

import java.util.HashMap;
import java.util.Map;

public class FirebaseAnalyticsModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseAnalytics";
  private static final String TAG = ApplicationModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;
  private Context mContext;
  private ActivityProvider mActivityProvider;
  private Activity mActivity;

  public FirebaseAnalyticsModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
  }

  private final Context getApplicationContext() {
    if (mActivity != null) {
      return mActivity.getApplicationContext();
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

  private Context getApplicationContextOrReject(Promise promise) {
    Context context = getApplicationContext();
    if (context == null) {
      promise.reject("ERR_FIREBASE_ANALYTICS", "Module registry is not initialized, or ActivityProvider is not available.");
    }
    return context;
  }

  @ExpoMethod
  public void initAppAsync(final Map<String, String> options, Promise promise) {
    if (getApplicationContextOrReject(promise) == null) return;
    
    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    builder.setApiKey(options.get("apiKey"));
    builder.setApplicationId(options.get("appId"));
    builder.setProjectId(options.get("projectId"));
    builder.setDatabaseUrl(options.get("databaseURL"));
    builder.setStorageBucket(options.get("storageBucket"));
    builder.setGcmSenderId(options.get("messagingSenderId"));
    builder.setGaTrackingId(options.get("trackingId"));

    FirebaseApp firebaseApp = FirebaseApp.getInstance();

    Bundle response = new Bundle();
    response.putString("result", "success");

    if (firebaseApp != null) {
      FirebaseOptions currentOptions = firebaseApp.getOptions();
      if (!currentOptions.getApiKey().equals(options.get("apiKey")) ||
          !currentOptions.getApplicationId().equals(options.get("appId"))) {
        firebaseApp.delete();
      } else {
        promise.resolve(response);
        return;
      }
    }

    FirebaseApp.initializeApp(mContext, builder.build());

    promise.resolve(response);
  }

  @ExpoMethod
  public void deleteAppAsync(Promise promise) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance();

    if (firebaseApp != null) {
      firebaseApp.delete();
    }
    promise.resolve(null);
  }

/*** Firebase */
  @ExpoMethod
  public void logEventAsync(final String name, @Nullable Map<String, Object> params, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).logEvent(name, params);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setAnalyticsCollectionEnabledAsync(final Boolean enabled, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setAnalyticsCollectionEnabled(enabled);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setCurrentScreenAsync(final String screenName, final String screenClassOverride, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    final Activity activity = getCurrentActivity();
    if (activity != null) {
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          FirebaseAnalytics.getInstance(getApplicationContext()).setCurrentScreen(activity, screenName, screenClassOverride);
        }
      });
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void setMinimumSessionDurationAsync(final double milliseconds, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setMinimumSessionDuration((long) milliseconds);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setSessionTimeoutDurationAsync(final double milliseconds, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setSessionTimeoutDuration((long) milliseconds);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUserIdAsync(final String id, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setUserId(id);
    promise.resolve(null);
  }
  @ExpoMethod
  public void setUserPropertyAsync(final String name, final String value, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setUserProperty(name, value);
    promise.resolve(null);
  }
  @ExpoMethod
  public void setUserPropertiesAsync(@Nullable Map<String, Object> params, Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).setUserProperties(params);
    promise.resolve(null);
  }
  @ExpoMethod
  public void resetAnalyticsDataAsync(Promise promise) {
    Context context = getApplicationContextOrReject(promise);
    if (context == null) return;

    FirebaseAnalytics.getInstance(context).resetAnalyticsData();
    promise.resolve(null);
  }
}

