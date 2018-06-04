// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.internal;

import android.net.Uri;

import abi28_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.modules.intent.IntentModule;

import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.exponent.kernel.services.linking.LinkingKernelService;

public class ExponentIntentModule extends IntentModule {
  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;
  private Map<String, Object> mExperienceProperties;

  public ExponentIntentModule(ReactApplicationContext reactContext, Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(ExponentIntentModule.class, this);

    mExperienceProperties = experienceProperties;
  }

  private LinkingKernelService getKernelService() {
    return mKernelServiceRegistry.getLinkingKernelService();
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void getInitialURL(Promise promise) {
    try {
      promise.resolve(mExperienceProperties.get(KernelConstants.INTENT_URI_KEY));
    } catch (Exception e) {
      promise.reject(new JSApplicationIllegalArgumentException(
          "Could not get the initial URL : " + e.getMessage()));
    }
  }

  @ReactMethod
  public void openURL(String url, final Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }

    final Uri uri = Uri.parse(url);

    if (getKernelService().canOpenURI(uri)) {
      getReactApplicationContext().runOnUiQueueThread(new Runnable() {
        @Override
        public void run() {
          getKernelService().openURI(uri);
          promise.resolve(true);
        }
      });
    } else {
      super.openURL(url, promise);
    }
  }

  @ReactMethod
  public void canOpenURL(String url, Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }

    Uri uri = Uri.parse(url);

    if (mKernelServiceRegistry.getLinkingKernelService().canOpenURI(uri)) {
      promise.resolve(true);
    } else {
      super.canOpenURL(url, promise);
    }
  }
}
