// Copyright 2015-present 650 Industries. All rights reserved.

package abi16_0_0.host.exp.exponent.modules.api;

import java.io.IOException;

import org.apache.commons.io.FileUtils;

import java.io.File;

import abi16_0_0.com.facebook.react.bridge.Promise;
import abi16_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi16_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi16_0_0.com.facebook.react.bridge.ReactMethod;
import abi16_0_0.com.facebook.react.bridge.ReadableMap;
import abi16_0_0.com.facebook.react.bridge.WritableMap;
import abi16_0_0.com.facebook.react.bridge.Arguments;
import abi16_0_0.com.facebook.react.modules.network.OkHttpClientProvider;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.BufferedSink;
import okio.Okio;
import abi16_0_0.host.exp.exponent.ScopedReactApplicationContext;

public class FileSystemModule extends ReactContextBaseJavaModule {
  private static final String TAG = FileSystemModule.class.getSimpleName();

  private ScopedContext mScopedContext;

  public FileSystemModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentFileSystem";
  }

  @ReactMethod
  public void getInfoAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(mScopedContext.toScopedPath(filepath, options));
      WritableMap result = Arguments.createMap();
      if (file.exists()) {
        result.putBoolean("exists", true);
        result.putBoolean("isDirectory", file.isDirectory());
        result.putString("uri", ExpFileUtils.uriFromFile(file).toString());
        if (options.hasKey("md5") && options.getBoolean("md5")) {
          result.putString("md5", ExpFileUtils.md5(file));
        }
        promise.resolve(result);
      } else {
        result.putBoolean("exists", false);
        result.putBoolean("isDirectory", false);
        promise.resolve(result);
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void deleteAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(mScopedContext.toScopedPath(filepath, options));
      if (!file.exists()) {
        throw new IOException("File '" + filepath + "' does not exist");
      }
      FileUtils.forceDelete(file);
      promise.resolve(filepath);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void downloadAsync(String url, final String filepath, final ReadableMap options, final Promise promise) {
    OkHttpClient client = OkHttpClientProvider.getOkHttpClient();
    Request request = new Request.Builder().url(url).build();
    client.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        try {
          File file = new File(mScopedContext.toScopedPath(filepath, options));
          file.delete();
          BufferedSink sink = Okio.buffer(Okio.sink(file));
          sink.writeAll(response.body().source());
          sink.close();

          WritableMap result = Arguments.createMap();
          result.putString("uri", ExpFileUtils.uriFromFile(file).toString());
          if (options.hasKey("md5") && options.getBoolean("md5")) {
            result.putString("md5", ExpFileUtils.md5(file));
          }
          promise.resolve(result);
        } catch (Exception e) {
          EXL.e(TAG, e.getMessage());
          promise.reject(e);
        }
      }
    });
  }
}
