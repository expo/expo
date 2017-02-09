// Copyright 2015-present 650 Industries. All rights reserved.

package abi14_0_0.host.exp.exponent.modules.api;

import android.graphics.Typeface;
import android.net.Uri;

import abi14_0_0.com.facebook.react.bridge.Arguments;
import abi14_0_0.com.facebook.react.bridge.Promise;
import abi14_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi14_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi14_0_0.com.facebook.react.bridge.ReactMethod;
import abi14_0_0.com.facebook.react.views.text.ReactFontManager;

import java.io.File;

public class FontLoaderModule extends ReactContextBaseJavaModule {
  public FontLoaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentFontLoader";
  }

  @ReactMethod
  public void loadAsync(final String fontFamilyName, final String localUri, final Promise promise) {
    try {
      // TODO(nikki): make sure path is in experience's scope
      Typeface typeface = Typeface.createFromFile(new File(Uri.parse(localUri).getPath()));
      ReactFontManager.getInstance().setTypeface("ExponentFont-" + fontFamilyName, Typeface.NORMAL, typeface);
      promise.resolve(Arguments.createMap());
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
