package versioned.host.exp.exponent.modules.api.fbads;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Main package exporting native modules and views
 */
public class FBAdsPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
           new NativeAdManager(reactContext),
           new AdSettingsManager(reactContext),
           new InterstitialAdManager(reactContext)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
           new NativeAdViewManager(reactContext),
           new BannerViewManager(reactContext)
        );
    }
}
