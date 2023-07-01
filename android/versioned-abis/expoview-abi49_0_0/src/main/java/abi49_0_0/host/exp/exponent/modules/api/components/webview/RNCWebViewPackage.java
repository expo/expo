package abi49_0_0.host.exp.exponent.modules.api.components.webview;
import host.exp.expoview.BuildConfig;

import androidx.annotation.Nullable;

import abi49_0_0.com.facebook.react.TurboReactPackage;
import abi49_0_0.com.facebook.react.bridge.NativeModule;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.module.model.ReactModuleInfo;
import abi49_0_0.com.facebook.react.module.model.ReactModuleInfoProvider;
import abi49_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNCWebViewPackage extends TurboReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> viewManagers = new ArrayList<>();
        viewManagers.add(new RNCWebViewManager());
        return viewManagers;
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return () -> {
            final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
            boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
            moduleInfos.put(
                    RNCWebViewModuleImpl.NAME,
                    new ReactModuleInfo(
                            RNCWebViewModuleImpl.NAME,
                            RNCWebViewModuleImpl.NAME,
                            false, // canOverrideExistingModule
                            false, // needsEagerInit
                            true, // hasConstants
                            false, // isCxxModule
                            isTurboModule // isTurboModule
                    ));
            return moduleInfos;
        };
    }

    @Nullable
    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
        if (name.equals(RNCWebViewModuleImpl.NAME)) {
            return new RNCWebViewModule(reactContext);
        } else {
            return null;
        }
    }

}