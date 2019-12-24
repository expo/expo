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

    @ExpoMethod
    public void initAppAsync(final Map<String, String> options, Promise promise) {
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

    private @Nullable
    FirebaseApp getDefaultApp() {
        try {
            return FirebaseApp.getInstance();
        } catch (Exception ignored) {
        }
        return null;
    }

    @ExpoMethod
    public void deleteAppAsync(Promise promise) {
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
    public void logEventAsync(final String name, @Nullable Map<String, Object> params, Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).logEvent(name, new MapArguments(params).toBundle());
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ExpoMethod
    public void setAnalyticsCollectionEnabledAsync(final Boolean enabled, Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setAnalyticsCollectionEnabled(enabled);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ExpoMethod
    public void setCurrentScreenAsync(final String screenName, final String screenClassOverride, final Promise promise) {
        mActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setCurrentScreen(mActivity, screenName, screenClassOverride);
                    promise.resolve(null);
                } catch (Exception e) {
                    promise.reject(e);
                }
            }
        });
    }

    @ExpoMethod
    public void setSessionTimeoutDurationAsync(final double milliseconds, Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setSessionTimeoutDuration((long) milliseconds);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ExpoMethod
    public void setUserIdAsync(final String id, Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setUserId(id);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ExpoMethod
    public void setUserPropertyAsync(final String name, final String value, Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).setUserProperty(name, value);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ExpoMethod
    public void resetAnalyticsDataAsync(Promise promise) {
        try {
            FirebaseAnalytics.getInstance(mActivity.getApplicationContext()).resetAnalyticsData();
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }
}

