package abi18_0_0.host.exp.exponent.modules.api.fbads;

import abi18_0_0.com.facebook.react.ReactPackage;
import abi18_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi18_0_0.com.facebook.react.bridge.NativeModule;
import abi18_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi18_0_0.com.facebook.react.uimanager.ViewManager;

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
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
           new NativeAdViewManager(reactContext),
           new BannerViewManager(reactContext)
        );
    }
}
