package abi48_0_0.com.reactnativecommunity.slider;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi48_0_0.com.facebook.react.ReactPackage;
import abi48_0_0.com.facebook.react.bridge.NativeModule;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.uimanager.ViewManager;
import abi48_0_0.com.facebook.react.bridge.JavaScriptModule;

public class ReactSliderPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    // Deprecated from RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    @SuppressWarnings("rawtypes")
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(new ReactSliderManager());
    }
}
