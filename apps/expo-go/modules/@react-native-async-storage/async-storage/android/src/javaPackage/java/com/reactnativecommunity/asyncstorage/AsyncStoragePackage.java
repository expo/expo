/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.asyncstorage;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nonnull;

@ReactModuleList(
        nativeModules = {
                AsyncStorageModule.class,
        }
)
public class AsyncStoragePackage extends TurboReactPackage {

    @Override
    public NativeModule getModule(String name, @Nonnull ReactApplicationContext reactContext) {
        switch (name) {
            case AsyncStorageModule.NAME:
                return new AsyncStorageModule(reactContext);
            default:
                return null;
        }
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        try {
            Class<?> reactModuleInfoProviderClass =
                    Class.forName("com.reactnativecommunity.asyncstorage.AsyncStoragePackage$$ReactModuleInfoProvider");
            return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
        } catch (ClassNotFoundException e) {
            // ReactModuleSpecProcessor does not run at build-time. Create this ReactModuleInfoProvider by
            // hand.
            return new ReactModuleInfoProvider() {
                @Override
                public Map<String, ReactModuleInfo> getReactModuleInfos() {
                    final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
                    boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;

                    Class<? extends NativeModule>[] moduleList =
                            new Class[] {
                                    AsyncStorageModule.class,
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
                                        isTurboModule));
                    }

                    return reactModuleInfoMap;
                }
            };
        } catch (InstantiationException | IllegalAccessException e) {
            throw new RuntimeException(
                    "No ReactModuleInfoProvider for com.reactnativecommunity.asyncstorage.AsyncStoragePackage$$ReactModuleInfoProvider", e);
        }
    }

    @Override
    @SuppressWarnings("rawtypes")
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
