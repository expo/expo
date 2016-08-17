// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules.external.linking;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.support.annotation.Nullable;

import java.util.List;

import abi5_0_0.com.facebook.react.bridge.Arguments;
import abi5_0_0.com.facebook.react.bridge.Callback;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import abi5_0_0.com.facebook.react.bridge.WritableMap;
import abi5_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

public class LinkingModule extends ReactContextBaseJavaModule {
  private final String EVENT_URL_DID_OPEN = "urlDidOpen";

  private Context mContext;

  @Nullable
  private String mInitialUri;

  public LinkingModule(ReactApplicationContext reactContext, Context activityContext, String initialUri) {
    super(reactContext);
    mContext = activityContext;
    mInitialUri = initialUri;
  }

  @Override
  public String getName() {
    return "LinkingModule";
  }

  @ReactMethod
  public void openURL(String url, final Callback onComplete) {
    boolean success = false;
    if (url != null && canOpenUrl(url)) {
      Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      mContext.startActivity(browserIntent);
      success = true;
    }
    onComplete.invoke(success);
  }

  @ReactMethod
  public void canOpenURL(String url, final Callback callback) {
    callback.invoke(canOpenUrl(url));
  }

  @ReactMethod
  public void popInitialURL(final Callback callback) {
    callback.invoke((mInitialUri == null) ? null : mInitialUri);
  }

  @ReactMethod
  public void addEventListener(String eventDomain, Callback callback) {
    // not implemented-- use DeviceEventEmitter.addListener('urlDidOpen', ...)
  }

  @ReactMethod
  public void removeEventListener(String eventDomain, Callback callback) {
    // not implemented-- use DeviceEventEmitter.removeListener('urlDidOpen', ...)
  }

  public void onNewUri(String uri) {
    if (uri != null) {
      WritableMap map = Arguments.createMap();
      map.putString("url", uri);
      this.getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(EVENT_URL_DID_OPEN, map);
    }
  }

  private boolean canOpenUrl(String url) {
    boolean canOpen = false;
    if (url != null) {
      Intent hypotheticalIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      List<ResolveInfo> activities = mContext.getApplicationContext().getPackageManager().queryIntentActivities(hypotheticalIntent, 0);
      canOpen = (activities != null && activities.size() > 0);
    }
    return canOpen;
  }
}
