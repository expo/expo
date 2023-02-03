// RnskiaPackage.java

package abi48_0_0.com.shopify.reactnative.skia;

import java.util.Arrays;
import java.util.List;

import abi48_0_0.com.facebook.react.ReactPackage;
import abi48_0_0.com.facebook.react.bridge.NativeModule;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.uimanager.ViewManager;

public class RNSkiaPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new RNSkiaModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(new SkiaDrawViewManager(),
                new SkiaPictureViewManager(), new SkiaDomViewManager());
    }
}
