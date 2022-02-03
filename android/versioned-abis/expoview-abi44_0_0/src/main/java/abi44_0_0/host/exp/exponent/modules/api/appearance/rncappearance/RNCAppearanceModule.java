package abi44_0_0.host.exp.exponent.modules.api.appearance.rncappearance;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.common.logging.FLog;
import abi44_0_0.com.facebook.react.bridge.Arguments;
import abi44_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi44_0_0.com.facebook.react.bridge.ReactContext;
import abi44_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi44_0_0.com.facebook.react.bridge.WritableMap;
import abi44_0_0.com.facebook.react.common.ReactConstants;
import abi44_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

public class RNCAppearanceModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    public static final String REACT_CLASS = "RNCAppearance";
    private BroadcastReceiver mBroadcastReceiver = null;

    public RNCAppearanceModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        // Only Android 10+ supports dark mode
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
            final ReactApplicationContext ctx = reactContext;
            mBroadcastReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    Configuration newConfig = intent.getParcelableExtra("newConfig");
                    sendEvent(ctx, "appearanceChanged", getPreferences());
                }
            };
            ctx.addLifecycleEventListener(this);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    // `protected` to allow overriding in Expo Go for scoping purposes
    protected String getColorScheme(Configuration config) {
        String colorScheme = "no-preference";

        // Only Android 10+ support dark mode
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
            int currentNightMode = config.uiMode & Configuration.UI_MODE_NIGHT_MASK;
            switch (currentNightMode) {
                case Configuration.UI_MODE_NIGHT_NO:
                case Configuration.UI_MODE_NIGHT_UNDEFINED:
                    colorScheme = "light";
                    break;
                case Configuration.UI_MODE_NIGHT_YES:
                    colorScheme = "dark";
                    break;

            }
        }

        return colorScheme;
    }

    private WritableMap getPreferences() {
        WritableMap preferences = Arguments.createMap();
        String colorScheme = getColorScheme(getReactApplicationContext().getResources().getConfiguration());
        preferences.putString("colorScheme", colorScheme);
        return preferences;
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap();
        constants.put("initialPreferences", getPreferences());
        return constants;
    }

    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            FLog.i("sendEvent", eventName + ": " + params.toString());
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }

    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
            FLog.i("sendEvent", eventName + ": " + params.toString());
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }

    }

    // We don't do any validation on whether the appearance has actually changed since the last
    // event was sent. We ignore this on the JS side if unchanged.
    private void updateAndSendAppearancePreferences() {
        WritableMap preferences = getPreferences();
        sendEvent("appearanceChanged", preferences);
    }

    @Override
    public void onHostResume() {
        final Activity activity = getCurrentActivity();

        if (activity == null) {
            FLog.e(ReactConstants.TAG, "no activity to register receiver");
            return;
        }
        activity.registerReceiver(mBroadcastReceiver, new IntentFilter("onConfigurationChanged"));

        // Send updated preferences to JS when the app is resumed, because we don't receive updates
        // when backgrounded
        updateAndSendAppearancePreferences();
    }

    @Override
    public void onHostPause() {
        final Activity activity = getCurrentActivity();
        if (activity == null) return;
        try  {
            activity.unregisterReceiver(mBroadcastReceiver);
        } catch (java.lang.IllegalArgumentException e) {
            FLog.e(ReactConstants.TAG, "mBroadcastReceiver already unregistered", e);
        }
    }

    @Override
    public void onHostDestroy() {
        // No need to do anything as far as I know?
    }
}
