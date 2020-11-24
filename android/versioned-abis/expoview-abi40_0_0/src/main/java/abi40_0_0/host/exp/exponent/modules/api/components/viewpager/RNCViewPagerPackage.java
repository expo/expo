package abi40_0_0.host.exp.exponent.modules.api.components.viewpager;

import abi40_0_0.com.facebook.react.ReactPackage;
import abi40_0_0.com.facebook.react.bridge.NativeModule;
import abi40_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi40_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class RNCViewPagerPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.<ViewManager>singletonList(
                new ReactViewPagerManager()
        );
    }
}