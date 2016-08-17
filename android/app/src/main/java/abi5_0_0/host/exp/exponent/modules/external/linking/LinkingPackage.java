// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules.external.linking;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi5_0_0.com.facebook.react.bridge.NativeModule;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.uimanager.ViewManager;

public class LinkingPackage implements ReactPackage {
  private final Context mContext;
  private final String mInitialUri;
  private LinkingModule mModule;

  public LinkingPackage(Context activityContext, String initialUri) {
    mContext = activityContext;
    mInitialUri = initialUri;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    mModule = new LinkingModule(reactContext, mContext, mInitialUri);
    return Arrays.<NativeModule>asList(mModule);
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  public void onNewUri(String uri) {
    if (mModule != null) {
      mModule.onNewUri(uri);
    }
  }
}
