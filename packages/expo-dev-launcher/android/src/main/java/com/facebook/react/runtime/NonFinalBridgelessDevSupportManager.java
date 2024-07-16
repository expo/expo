/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.devsupport.DevSupportManagerBase;
import com.facebook.react.devsupport.HMRClient;
import com.facebook.react.devsupport.ReactInstanceDevHelper;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.runtime.internal.bolts.Continuation;
import com.facebook.react.runtime.internal.bolts.Task;

import java.lang.ref.WeakReference;

import javax.annotation.Nullable;

//
// Expo: This is a copy of react-native's {@link com.facebook.react.runtime.BridgelessDevSupportManager}
// just removing the "final" modifier that we can inherit and reuse.
// From time to time for react-native upgrade, just follow the steps to update the code
//   1. Copy the contents from BridgelessDevSupportManager to this file.
//   2. Rename the class to NonFinalBridgelessDevSupportManager.
//   3. Add "public" modifier
//   4. Revert the comment
//

/**
 * An implementation of {@link com.facebook.react.devsupport.interfaces.DevSupportManager} that
 * extends the functionality in {@link DevSupportManagerBase} with some additional, more flexible
 * APIs for asynchronously loading the JS bundle.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class NonFinalBridgelessDevSupportManager extends DevSupportManagerBase {

    private final ReactHostImpl mReactHost;

    public NonFinalBridgelessDevSupportManager(
            ReactHostImpl host, Context context, @Nullable String packagerPathForJSBundleName) {
        super(
                context.getApplicationContext(),
                createInstanceDevHelper(host),
                packagerPathForJSBundleName,
                true /* enableOnCreate */,
                null /* redBoxHandler */,
                null /* devBundleDownloadListener */,
                2 /* minNumShakes */,
                null /* customPackagerCommandHandlers */,
                null /* surfaceDelegateFactory */,
                null /* devLoadingViewManager */);
        mReactHost = host;
    }

    @Override
    protected String getUniqueTag() {
        return "Bridgeless";
    }

    @Override
    public void loadSplitBundleFromServer(
            final String bundlePath, final DevSplitBundleCallback callback) {
        fetchSplitBundleAndCreateBundleLoader(
                bundlePath,
                new CallbackWithBundleLoader() {
                    @Override
                    public void onSuccess(final JSBundleLoader bundleLoader) {
                        mReactHost
                                .loadBundle(bundleLoader)
                                .onSuccess(
                                        new Continuation<Boolean, Void>() {
                                            @Override
                                            public Void then(Task<Boolean> task) {
                                                if (task.getResult().equals(Boolean.TRUE)) {
                                                    String bundleURL =
                                                            getDevServerHelper().getDevServerSplitBundleURL(bundlePath);
                                                    ReactContext reactContext = mReactHost.getCurrentReactContext();
                                                    if (reactContext != null) {
                                                        reactContext.getJSModule(HMRClient.class).registerBundle(bundleURL);
                                                    }
                                                    callback.onSuccess();
                                                }
                                                return null;
                                            }
                                        });
                    }

                    @Override
                    public void onError(String url, Throwable cause) {
                        callback.onError(url, cause);
                    }
                });
    }

    @Override
    public void handleReloadJS() {
        UiThreadUtil.assertOnUiThread();

        // dismiss redbox if exists
        hideRedboxDialog();
        mReactHost.reload("BridgelessDevSupportManager.handleReloadJS()");

        // 0.74 workaround for https://github.com/facebook/react-native/commit/524e3eec3e73f56746ace8bef569f36802a7a62e
        isPackagerRunning(isMetroRunning -> {
          if (!isMetroRunning) {
            String bundleURL = getDevServerHelper().getDevServerBundleURL(Assertions.assertNotNull(getJSAppBundleName()));
            reloadJSFromServer(bundleURL);
          }
        });
    }

    private static ReactInstanceDevHelper createInstanceDevHelper(final ReactHostImpl reactHost) {
        return new ReactInstanceDevHelper() {
            private WeakReference<ReactSurfaceImpl> logBoxSurface = new WeakReference<>(null);

            @Override
            public void onReloadWithJSDebugger(JavaJSExecutor.Factory proxyExecutorFactory) {
                // Not implemented
            }

            @Override
            public void onJSBundleLoadedFromServer() {
                // Not implemented
            }

            @Override
            public void toggleElementInspector() {
                ReactContext reactContext = reactHost.getCurrentReactContext();
                if (reactContext != null) {
                    reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("toggleElementInspector", null);
                }
            }

            @androidx.annotation.Nullable
            @Override
            public Activity getCurrentActivity() {
                return reactHost.getLastUsedActivity();
            }

            @Override
            public JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
                throw new IllegalStateException("Not implemented for bridgeless mode");
            }

            @androidx.annotation.Nullable
            @Override
            public View createRootView(String appKey) {
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null && !reactHost.isSurfaceWithModuleNameAttached(appKey)) {
                    ReactSurfaceImpl reactSurface =
                            ReactSurfaceImpl.createWithView(currentActivity, appKey, new Bundle());

                    if (appKey.equals("LogBox")) {
                        logBoxSurface = new WeakReference<>(reactSurface);
                    }

                    reactSurface.attach(reactHost);
                    reactSurface.start();

                    return reactSurface.getView();
                }
                return null;
            }

            @Override
            public void destroyRootView(View rootView) {
                // The log box surface is a special case and needs to be detached from the host.
                // The detachment process should be handled by React Native, but it appears to be malfunctioning.
                // This is a temporary solution and should be removed
                // once we identify the root cause of the surface remaining attached after reloads.
                ReactSurfaceImpl logBox = logBoxSurface.get();
                if (logBox != null) {
                  reactHost.detachSurface(logBox);
                  logBoxSurface.clear();
                }
            }
        };
    }
}
