/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.reactnativecommunity.asyncstorage;

import android.util.Log;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AsyncStoragePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {

        List<NativeModule> moduleList = new ArrayList<>(1);

        if (BuildConfig.AsyncStorage_useNextStorage) {
            try {
                Class storageClass = Class.forName("com.reactnativecommunity.asyncstorage.next.StorageModule");
                NativeModule inst = (NativeModule) storageClass.getDeclaredConstructor(new Class[]{ReactContext.class}).newInstance(reactContext);
                moduleList.add(inst);
                AsyncLocalStorageUtil.verifyAndForceSqliteCheckpoint(reactContext);
            } catch (Exception e) {
                String message = "Something went wrong when initializing module:"
                        + "\n"
                        + e.getCause().getClass()
                        + "\n"
                        + "Cause:" + e.getCause().getLocalizedMessage();
                Log.e("AsyncStorage_Next", message);
            }
        } else {
            moduleList.add(new AsyncStorageModule(reactContext));
        }

        return moduleList;
    }

    // Deprecated in RN 0.47 
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    @SuppressWarnings("rawtypes")
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}