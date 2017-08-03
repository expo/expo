// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.net.Uri;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.OutputStreamWriter;
import java.util.HashMap;
import java.util.Map;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.network.OkHttpClientProvider;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.BufferedSink;
import okio.Okio;

public class FileSystemModule extends ReactContextBaseJavaModule {
  private static final String TAG = FileSystemModule.class.getSimpleName();

  private ScopedContext mScopedContext;

  public FileSystemModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
    try {
      ExpFileUtils.ensureDirExists(mScopedContext.getFilesDir());
      ExpFileUtils.ensureDirExists(mScopedContext.getCacheDir());
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  @Override
  public String getName() {
    return "ExponentFileSystem";
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put("documentDirectory", Uri.fromFile(mScopedContext.getFilesDir()).toString() + "/");
    constants.put("cacheDirectory", Uri.fromFile(mScopedContext.getCacheDir()).toString() + "/");
    return constants;
  }

  private File uriToFile(String uri) throws IOException {
    File file = new File(Uri.parse(uri).getPath());
    String fileCanonicalPath = file.getCanonicalPath();
    if (fileCanonicalPath.startsWith(mScopedContext.getFilesDir().getCanonicalPath() + "/") ||
        fileCanonicalPath.startsWith(mScopedContext.getCacheDir().getCanonicalPath() + "/")) {
      return file;
    }
    throw new IOException("Invalid Filesystem URI '" + uri + "', make sure it's in the app's scope.");
  }

  @ReactMethod
  public void getInfoAsync(String uri, ReadableMap options, Promise promise) {
    try {
      File file = uriToFile(uri);
      WritableMap result = Arguments.createMap();
      if (file.exists()) {
        result.putBoolean("exists", true);
        result.putBoolean("isDirectory", file.isDirectory());
        result.putString("uri", ExpFileUtils.uriFromFile(file).toString());
        if (options.hasKey("md5") && options.getBoolean("md5")) {
          result.putString("md5", ExpFileUtils.md5(file));
        }
        result.putDouble("size", file.length());
        result.putDouble("modificationTime", 0.001 * file.lastModified());
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
  public void readAsStringAsync(String uri, ReadableMap options, Promise promise) {
    try {
      promise.resolve(IOUtils.toString(new FileInputStream(uriToFile(uri))));
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void writeAsStringAsync(String uri, String string, ReadableMap options, Promise promise) {
    try {
      FileOutputStream out = new FileOutputStream(uriToFile(uri));
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
  public void deleteAsync(String uri, ReadableMap options, Promise promise) {
    try {
      File file = uriToFile(uri);
      if (file.exists()) {
        FileUtils.forceDelete(file);
        promise.resolve(null);
      } else {
        if (options.hasKey("idempotent") && options.getBoolean("idempotent")) {
          promise.resolve(null);
        } else {
          promise.reject("E_FILE_NOT_FOUND",
              "File '" + uri + "' could not be deleted because it could not be found");
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

      File from = uriToFile(options.getString("from"));
      File to = uriToFile(options.getString("to"));
      if (from.renameTo(to)) {
        promise.resolve(null);
      } else {
        promise.reject("E_FILE_NOT_MOVED",
            "File '" + options.getString("from") + "' could not be moved to '" +
                options.getString("to") + "'");
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void copyAsync(ReadableMap options, Promise promise) {
    try {
      if (!options.hasKey("from")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.copyAsync` needs a `from` path.");
        return;
      }
      if (!options.hasKey("to")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.copyAsync` needs a `to` path.");
        return;
      }

      File from = uriToFile(options.getString("from"));
      File to = uriToFile(options.getString("to"));
      if (from.isDirectory()) {
        FileUtils.copyDirectory(from, to);
        promise.resolve(null);
      } else {
        FileUtils.copyFile(from, to);
        promise.resolve(null);
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void makeDirectoryAsync(String uri, ReadableMap options, Promise promise) {
    try {
      File file = uriToFile(uri);
      boolean success = options.hasKey("intermediates") && options.getBoolean("intermediates") ?
          file.mkdirs() :
          file.mkdir();
      if (success) {
        promise.resolve(null);
      } else {
        promise.reject("E_DIRECTORY_NOT_CREATED",
            "Directory '" + uri + "' could not be created.");
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void readDirectoryAsync(String uri, ReadableMap options, Promise promise) {
    try {
      File file = uriToFile(uri);
      File[] children = file.listFiles();
      if (children != null) {
        WritableArray result = Arguments.createArray();
        for (File child : children) {
          result.pushString(child.getName());
        }
        promise.resolve(result);
      } else {
        promise.reject("E_DIRECTORY_NOT_READ",
            "Directory '" + uri + "' could not be read.");
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void downloadAsync(String url, final String uri, final ReadableMap options, final Promise promise) {
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
          File file = uriToFile(uri);
          file.delete();
          BufferedSink sink = Okio.buffer(Okio.sink(file));
          sink.writeAll(response.body().source());
          sink.close();

          WritableMap result = Arguments.createMap();
          result.putString("uri", ExpFileUtils.uriFromFile(file).toString());
          if (options.hasKey("md5") && options.getBoolean("md5")) {
            result.putString("md5", ExpFileUtils.md5(file));
          }
          result.putInt("status", response.code());
          result.putMap("headers", translateHeaders(response.headers()));
          promise.resolve(result);
        } catch (Exception e) {
          EXL.e(TAG, e.getMessage());
          promise.reject(e);
        }
      }
    });
  }

  // Copied out of React Native's `NetworkingModule.java`
  private static WritableMap translateHeaders(Headers headers) {
    WritableMap responseHeaders = Arguments.createMap();
    for (int i = 0; i < headers.size(); i++) {
      String headerName = headers.name(i);
      // multiple values for the same header
      if (responseHeaders.hasKey(headerName)) {
        responseHeaders.putString(
            headerName,
            responseHeaders.getString(headerName) + ", " + headers.value(i));
      } else {
        responseHeaders.putString(headerName, headers.value(i));
      }
    }
    return responseHeaders;
  }
}
