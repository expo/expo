// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.common.MapBuilder;

import host.exp.exponent.di.NativeModuleDepsProvider;

// TODO: kill
@Deprecated
public class URLHandlerModule extends ReactContextBaseJavaModule {

  public URLHandlerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(URLHandlerModule.class, this);
  }

  @Override
  public String getName() {
    return "EXURLHandler";
  }

  public Map<String, Object> getConstants() {
    List<String> schemes = new ArrayList<>();
    schemes.add("exp");
    schemes.add("exps");

    Map<String, Object> constants = MapBuilder.of(
        "schemes", schemes,
        "initialURL", null,
        "settingsURL", "http://settings"
    );
    // source application, referrer
    return constants;
  }

  @ReactMethod
  public void openURLAsync(String url, Promise promise) {
    if (url == null) {
      promise.resolve(false);
    }

    Uri uri = Uri.parse(url);
    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
    PackageManager packageManager = getReactApplicationContext().getPackageManager();
    if (intent.resolveActivity(packageManager) != null) {
      getCurrentActivity().startActivity(intent);
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void canOpenURLAsync(String url, Promise promise) {
    if (url == null) {
      promise.resolve(false);
    }

    Uri uri = Uri.parse(url);
    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
    PackageManager packageManager = getReactApplicationContext().getPackageManager();
    promise.resolve(intent.resolveActivity(packageManager) != null);
  }
}
