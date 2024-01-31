// RnskiaPackage.java

package com.shopify.reactnative.skia;

import androidx.annotation.Nullable;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.uimanager.ViewManager;

@ReactModuleList(
        nativeModules = {
                RNSkiaModule.class,
        })
public class RNSkiaPackage extends TurboReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new RNSkiaModule(reactContext));
    }

    @Nullable
    @Override
    public NativeModule getModule(String s, ReactApplicationContext reactApplicationContext) {
        switch (s) {
            case RNSkiaModule.NAME:
                return new RNSkiaModule(reactApplicationContext);
            default:
                return null;
        }
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(new SkiaDrawViewManager(),
                new SkiaPictureViewManager(), new SkiaDomViewManager());
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return new ReactModuleInfoProvider() {
            @Override
            public Map<String, ReactModuleInfo> getReactModuleInfos() {
                final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
                Class<? extends NativeModule>[] moduleList =
                        new Class[] {
                                RNSkiaModule.class,
                        };

                for (Class<? extends NativeModule> moduleClass : moduleList) {
                    ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

                    reactModuleInfoMap.put(
                            reactModule.name(),
                            new ReactModuleInfo(
                                    reactModule.name(),
                                    moduleClass.getName(),
                                    reactModule.canOverrideExistingModule(),
                                    reactModule.needsEagerInit(),
                                    reactModule.hasConstants(),
                                    reactModule.isCxxModule(),
                                    TurboModule.class.isAssignableFrom(moduleClass)));
                }
                return reactModuleInfoMap;
            }
        };
    }
}
