package abi37_0_0.host.exp.exponent.modules.api.components.sharedelement;

import java.util.*;

import abi37_0_0.com.facebook.react.ReactPackage;
import abi37_0_0.com.facebook.react.bridge.NativeModule;
import abi37_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi37_0_0.com.facebook.react.uimanager.ViewManager;

public class RNSharedElementPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new RNSharedElementModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(new RNSharedElementTransitionManager(reactContext));
    }
}
