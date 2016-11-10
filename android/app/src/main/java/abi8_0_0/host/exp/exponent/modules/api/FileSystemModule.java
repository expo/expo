// Copyright 2015-present 650 Industries. All rights reserved.

package abi8_0_0.host.exp.exponent.modules.api;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import org.apache.commons.io.FileUtils;
import android.content.Context;
import android.net.Uri;

import java.io.File;

import abi8_0_0.com.facebook.react.bridge.Promise;
import abi8_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi8_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi8_0_0.com.facebook.react.bridge.ReactMethod;
import abi8_0_0.com.facebook.react.bridge.ReadableMap;
import abi8_0_0.com.facebook.react.bridge.WritableMap;
import abi8_0_0.com.facebook.react.bridge.Arguments;
import abi8_0_0.com.facebook.react.modules.network.OkHttpClientProvider;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelProvider;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.BufferedSink;
import okio.Okio;

public class FileSystemModule extends ReactContextBaseJavaModule {
  private static final String TAG = FileSystemModule.class.getSimpleName();

  private String mRootPath;
  private String mCachePath;

  public FileSystemModule(ReactApplicationContext reactContext, JSONObject manifest) {
    super(reactContext);

    try {
      String experienceId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      mRootPath = rootPathForExperience(reactContext, experienceId);
      mCachePath = cachePathForExperience(reactContext, experienceId);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("Requires Experience Id");
    } catch (UnsupportedEncodingException e) {
      KernelProvider.getInstance().handleError("Couldn't URL encode Experience Id");
    }
  }

  @Override
  public String getName() {
    return "ExponentFileSystem";
  }

  private static String rootPathForExperience(Context context, String experienceId) throws UnsupportedEncodingException {
    return context.getFilesDir() + "/ExperienceData/" + URLEncoder.encode(experienceId, "UTF-8");
  }

  private static String cachePathForExperience(Context context, String experienceId) throws UnsupportedEncodingException {
    return context.getCacheDir() + "/ExperienceData/" + URLEncoder.encode(experienceId, "UTF-8");
  }

  public static void clearDataForExperience(Context context, String experienceId) throws IOException {
    FileUtils.deleteDirectory(new File(rootPathForExperience(context, experienceId)));
    FileUtils.deleteDirectory(new File(cachePathForExperience(context, experienceId)));
  }

  private File ensureDirExists(String path) throws IOException {
    File rootDir = new File(path);
    if (!(rootDir.isDirectory() || rootDir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + path + "'");
    }
    return rootDir;
  }

  private String toScopedPath(String path, ReadableMap options) throws IOException {
    String prefix = options.hasKey("cache") && options.getBoolean("cache") ? mCachePath : mRootPath;
    ensureDirExists(prefix);
    File file = new File(prefix + "/" + path);
    String fileCanonicalPath = file.getCanonicalPath();
    String rootCanonicalPath = new File(prefix).getCanonicalPath();
    if (!fileCanonicalPath.startsWith(rootCanonicalPath)) {
      throw new IOException("Path '" + path + "' leads outside root directory of experience");
    }
    return file.getAbsolutePath();
  }

  @ReactMethod
  public void getInfoAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(toScopedPath(filepath, options));
      WritableMap response = Arguments.createMap();
      if (file.exists()) {
        response.putBoolean("exists", true);
        response.putBoolean("isDirectory", file.isDirectory());
        response.putString("uri", Uri.fromFile(file).toString());
        promise.resolve(response);
      } else {
        response.putBoolean("exists", false);
        response.putBoolean("isDirectory", false);
        promise.resolve(response);
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void deleteAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(toScopedPath(filepath, options));
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
          File file = new File(toScopedPath(filepath, options));
          file.delete();
          BufferedSink sink = Okio.buffer(Okio.sink(file));
          sink.writeAll(response.body().source());
          sink.close();

          WritableMap result = Arguments.createMap();
          result.putString("uri", Uri.fromFile(file).toString());
          promise.resolve(result);
        } catch (Exception e) {
          EXL.e(TAG, e.getMessage());
          promise.reject(e);
        }
      }
    });
  }
}
