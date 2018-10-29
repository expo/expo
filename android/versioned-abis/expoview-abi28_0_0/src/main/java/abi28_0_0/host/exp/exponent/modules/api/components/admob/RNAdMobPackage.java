package abi28_0_0.host.exp.exponent.modules.api.components.admob;

import abi28_0_0.com.facebook.react.ReactPackage;
import abi28_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi28_0_0.com.facebook.react.bridge.NativeModule;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNAdMobPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
            new RNAdMobInterstitialAdModule(reactContext),
            new RNAdMobRewardedVideoAdModule(reactContext)
        );
    }

    // Deprecated from RN 0.47.0
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> managers = new ArrayList<>();
        managers.add(new RNAdMobBannerViewManager());
        managers.add(new RNPublisherBannerViewManager());
        return managers;
    }
}
