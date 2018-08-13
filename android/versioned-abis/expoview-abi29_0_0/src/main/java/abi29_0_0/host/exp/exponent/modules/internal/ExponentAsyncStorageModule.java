// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent.modules.internal;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import abi29_0_0.com.facebook.react.bridge.Callback;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.modules.storage.AsyncStorageModule;
import abi29_0_0.com.facebook.react.modules.storage.ReactDatabaseSupplier;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.KernelProvider;

public class ExponentAsyncStorageModule extends AsyncStorageModule {

  public static String experienceIdToDatabaseName(String experienceId) throws UnsupportedEncodingException {
    String experienceIdEncoded = URLEncoder.encode(experienceId, "UTF-8");
    return "RKStorage-scoped-experience-" + experienceIdEncoded;
  }

  public ExponentAsyncStorageModule(ReactApplicationContext reactContext, JSONObject manifest) {
    super(reactContext);

    try {
      String experienceId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      String databaseName = experienceIdToDatabaseName(experienceId);
      mReactDatabaseSupplier = new ReactDatabaseSupplier(reactContext, databaseName);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("Requires Experience Id");
    } catch (UnsupportedEncodingException e) {
      KernelProvider.getInstance().handleError("Couldn't URL encode Experience Id");
    }
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void multiGet(final ReadableArray keys, final Callback callback) {
    super.multiGet(keys, callback);
  }

  @ReactMethod
  public void multiSet(final ReadableArray keyValueArray, final Callback callback) {
    super.multiSet(keyValueArray, callback);
  }

  @ReactMethod
  public void multiRemove(final ReadableArray keys, final Callback callback) {
    super.multiRemove(keys, callback);
  }

  @ReactMethod
  public void multiMerge(final ReadableArray keyValueArray, final Callback callback) {
    super.multiMerge(keyValueArray, callback);
  }

  @ReactMethod
  public void clear(final Callback callback) {
    super.clear(callback);
  }

  @ReactMethod
  public void getAllKeys(final Callback callback) {
    super.getAllKeys(callback);
  }
}
