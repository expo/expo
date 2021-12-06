package abi44_0_0.host.exp.exponent.modules.api.appearance.rncappearance;

import androidx.annotation.NonNull;

import abi44_0_0.com.facebook.react.ReactPackage;
import abi44_0_0.com.facebook.react.bridge.NativeModule;
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi44_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNCAppearancePackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List modules = new ArrayList();
        modules.add(new RNCAppearanceModule(reactContext));
        return modules;
    }

    @Override
    @SuppressWarnings("rawtypes")
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
