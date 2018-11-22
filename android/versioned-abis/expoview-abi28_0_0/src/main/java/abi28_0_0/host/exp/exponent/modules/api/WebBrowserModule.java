// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.support.customtabs.CustomTabsIntent;

import abi28_0_0.com.facebook.infer.annotation.Assertions;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

import de.greenrobot.event.EventBus;
import host.exp.exponent.chrometabs.ChromeTabsManagerActivity;
import host.exp.expoview.Exponent;

public class WebBrowserModule extends ReactContextBaseJavaModule {
  private final static String ERROR_CODE = "EXWebBrowser";

  private @Nullable Promise mOpenBrowserPromise;

  public WebBrowserModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentWebBrowser";
  }

  @ReactMethod
  public void openBrowserAsync(final String url, final Promise promise) {
    if (mOpenBrowserPromise != null) {
      WritableMap result = Arguments.createMap();
      result.putString("type", "cancel");
      mOpenBrowserPromise.resolve(result);
      return;
    }
    mOpenBrowserPromise = promise;

    final Activity activity = Exponent.getInstance().getCurrentActivity();
    if (activity == null) {
      promise.reject(ERROR_CODE, "No activity");
      mOpenBrowserPromise = null;
      return;
    }

    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    CustomTabsIntent customTabsIntent = builder.build();

    Intent intent = customTabsIntent.intent;
    intent.setData(Uri.parse(url));
    intent.putExtra(CustomTabsIntent.EXTRA_TITLE_VISIBILITY_STATE, CustomTabsIntent.NO_TITLE);

    EventBus.getDefault().register(this);

    activity.startActivity(
        ChromeTabsManagerActivity.createStartIntent(activity, intent));
  }

  @ReactMethod
  public void dismissBrowser() {
    if (mOpenBrowserPromise == null) {
      return;
    }

    final Activity activity = Exponent.getInstance().getCurrentActivity();
    if (activity == null) {
      mOpenBrowserPromise.reject(ERROR_CODE, "No activity");
      mOpenBrowserPromise = null;
      return;
    }

    EventBus.getDefault().unregister(this);

    WritableMap result = Arguments.createMap();
    result.putString("type", "dismiss");
    mOpenBrowserPromise.resolve(result);
    mOpenBrowserPromise = null;

    activity.startActivity(
        ChromeTabsManagerActivity.createDismissIntent(activity));
  }

  public void onEvent(ChromeTabsManagerActivity.ChromeTabsDismissedEvent event) {
    EventBus.getDefault().unregister(this);

    Assertions.assertNotNull(mOpenBrowserPromise);

    WritableMap result = Arguments.createMap();
    result.putString("type", "cancel");
    mOpenBrowserPromise.resolve(result);
    mOpenBrowserPromise = null;
  }
}
