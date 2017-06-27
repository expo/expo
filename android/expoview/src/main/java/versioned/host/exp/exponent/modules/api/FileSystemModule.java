// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.OutputStreamWriter;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.network.OkHttpClientProvider;

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
import versioned.host.exp.exponent.ReadableObjectUtils;

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
      File file = new File(mScopedContext.toScopedPath(filepath, ReadableObjectUtils.readableToJson(options)));
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
  public void readAsStringAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      promise.resolve(IOUtils.toString(new FileInputStream(
          mScopedContext.toScopedPath(filepath, ReadableObjectUtils.readableToJson(options)))));
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void writeAsStringAsync(String filepath, String string, ReadableMap options, Promise promise) {
    try {
      FileOutputStream out = new FileOutputStream(
          mScopedContext.toScopedPath(filepath, ReadableObjectUtils.readableToJson(options)));
      OutputStreamWriter writer = new OutputStreamWriter(out);
      writer.write(string);
      writer.close();
      out.close();
      promise.resolve(null);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void deleteAsync(String filepath, ReadableMap options, Promise promise) {
    try {
      File file = new File(mScopedContext.toScopedPath(filepath, ReadableObjectUtils.readableToJson(options)));
      if (file.exists()) {
        FileUtils.forceDelete(file);
        promise.resolve(null);
      } else {
        if (options.hasKey("idempotent") && options.getBoolean("idempotent")) {
          promise.resolve(null);
        } else {
          promise.reject("E_FILE_NOT_FOUND",
              "File '" + filepath + "' could not be deleted because it could not be found");
        }
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void moveAsync(ReadableMap options, Promise promise) {
    try {
      if (!options.hasKey("from")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `from` path.");
        return;
      }
      if (!options.hasKey("to")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.");
        return;
      }

      File from = new File(mScopedContext.toScopedPath(options.getString("from"),
          ReadableObjectUtils.readableToJson(options)));
      File to = new File(mScopedContext.toScopedPath(options.getString("to"),
          ReadableObjectUtils.readableToJson(options)));
      if (!from.renameTo(to)) {
        promise.reject("E_FILE_NOT_MOVED",
            "File '" + options.getString("from") + "' could not be moved to '" +
                options.getString("to") + "'");
      }
      promise.resolve(null);
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
          File file = new File(mScopedContext.toScopedPath(filepath, ReadableObjectUtils.readableToJson(options)));
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
