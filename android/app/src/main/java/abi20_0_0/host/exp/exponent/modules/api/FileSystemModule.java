// Copyright 2015-present 650 Industries. All rights reserved.

package abi20_0_0.host.exp.exponent.modules.api;

import android.net.Uri;
import android.os.AsyncTask;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.HashMap;
import java.util.Map;

import abi20_0_0.com.facebook.react.bridge.Arguments;
import abi20_0_0.com.facebook.react.bridge.Promise;
import abi20_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi20_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi20_0_0.com.facebook.react.bridge.ReactMethod;
import abi20_0_0.com.facebook.react.bridge.ReadableMap;
import abi20_0_0.com.facebook.react.bridge.WritableArray;
import abi20_0_0.com.facebook.react.bridge.WritableMap;
import abi20_0_0.com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import abi20_0_0.com.facebook.react.modules.network.OkHttpClientProvider;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Headers;
import expolib_v1.okhttp3.Interceptor;
import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okio.Buffer;
import expolib_v1.okio.BufferedSink;
import expolib_v1.okio.BufferedSource;
import expolib_v1.okio.ForwardingSource;
import expolib_v1.okio.Okio;
import expolib_v1.okio.Source;

public class FileSystemModule extends ReactContextBaseJavaModule {
  private static final String TAG = FileSystemModule.class.getSimpleName();
  private static final String EXDownloadProgressEventName = "Exponent.downloadProgress";
  private static final long MIN_EVENT_DT_MS = 100;

  private ScopedContext mScopedContext;

  private final Map<String, DownloadResumable> mDownloadResumableMap = new HashMap<>();

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

  @ReactMethod
  public void downloadResumableStartAsync(String url, final String fileUri, final String uuid, final ReadableMap options, final String resumeData, final Promise promise) {
    final boolean isResume = resumeData != null;

    final ProgressListener progressListener = new ProgressListener() {
      long mLastUpdate = -1;

      @Override public void update(long bytesRead, long contentLength, boolean done) {
        WritableMap downloadProgress = Arguments.createMap();
        WritableMap downloadProgressData = Arguments.createMap();
        long totalBytesWritten = isResume ? bytesRead + Long.parseLong(resumeData):bytesRead;
        long totalBytesExpectedToWrite = isResume ? contentLength + Long.parseLong(resumeData):contentLength;
        long currentTime = System.currentTimeMillis();

        // Throttle events. Sending too many events will block the JS event loop.
        // Make sure to send the last event when we're at 100%.
        if (currentTime > mLastUpdate + MIN_EVENT_DT_MS || totalBytesWritten == totalBytesExpectedToWrite) {
          mLastUpdate = currentTime;
          downloadProgressData.putDouble("totalBytesWritten", totalBytesWritten);
          downloadProgressData.putDouble("totalBytesExpectedToWrite", totalBytesExpectedToWrite);
          downloadProgress.putString("uuid", uuid);
          downloadProgress.putMap("data", downloadProgressData);
          getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
              .emit(EXDownloadProgressEventName, downloadProgress);
        }
      }
    };

    OkHttpClient client = new OkHttpClient.Builder()
      .addNetworkInterceptor(new Interceptor() {
        @Override public Response intercept(Chain chain) throws IOException {
            Response originalResponse = chain.proceed(chain.request());
            return originalResponse.newBuilder()
              .body(new ProgressResponseBody(originalResponse.body(), progressListener))
              .build();
          }
        })
      .build();
    
    Request.Builder requestBuilder = new Request.Builder();
    if (isResume) {
      requestBuilder.addHeader("Range", "bytes=" + resumeData + "-");
    }
    
    Request request = requestBuilder.url(url).build();
    Call call = client.newCall(request);
    DownloadResumable downloadResumable = new DownloadResumable(uuid, url, fileUri, call);
    this.mDownloadResumableMap.put(uuid, downloadResumable);
    
    try {
      File file = uriToFile(fileUri);
      DownloadResumableTaskParams params = new DownloadResumableTaskParams(options, call, file, isResume, promise);
      DownloadResumableTask task = new DownloadResumableTask();
      task.execute(params);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ReactMethod
  public void downloadResumablePauseAsync(final String uuid, final Promise promise) {
    DownloadResumable downloadResumable = this.mDownloadResumableMap.get(uuid);
    if (downloadResumable != null) {
      downloadResumable.call.cancel();
      this.mDownloadResumableMap.remove(downloadResumable.uuid);
      try {
        File file = uriToFile(downloadResumable.fileUri);
        WritableMap result = Arguments.createMap();
        result.putString("resumeData", String.valueOf(file.length()));
        promise.resolve(result);
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
      }
    } else {
      Exception e = new IOException("No download object available");
      EXL.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  private static class DownloadResumableTaskParams {
    ReadableMap options;
    Call call;
    File file;
    boolean isResume;
    Promise promise;

    DownloadResumableTaskParams(ReadableMap options, Call call, File file, boolean isResume, Promise promise) {
      this.options = options;
      this.call = call;
      this.file = file;
      this.isResume = isResume;
      this.promise = promise;
    }
  }

  private class DownloadResumableTask extends AsyncTask<DownloadResumableTaskParams, Void, Void> {
    @Override
    protected Void doInBackground(DownloadResumableTaskParams... params) {
      Call call = params[0].call;
      Promise promise = params[0].promise;
      File file = params[0].file;
      boolean isResume = params[0].isResume;
      ReadableMap options = params[0].options;

      try {
        Response response = call.execute();
        ResponseBody responseBody = response.body();
        BufferedInputStream input = new BufferedInputStream(responseBody.byteStream());
        OutputStream output;

        if (isResume) {
          output = new FileOutputStream(file, true);
        } else {
          output = new FileOutputStream(file, false);    
        }

        byte[] data = new byte[1024];
        int count = 0;
        while ((count = input.read(data)) != -1) {
          output.write(data, 0, count);   
        }

        WritableMap result = Arguments.createMap();
        result.putString("uri", ExpFileUtils.uriFromFile(file).toString());
        if (options.hasKey("md5") && options.getBoolean("md5")) {
          result.putString("md5", ExpFileUtils.md5(file));
        }
        result.putInt("status", response.code());
        result.putMap("headers", translateHeaders(response.headers()));
        
        promise.resolve(result);
        return null;
      } catch (Exception e) {
        EXL.e(TAG, e.getMessage());
        promise.reject(e);
        return null;
      }
    }
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

  private static class DownloadResumable {
    public final String uuid;
    public final String url;
    public final String fileUri;
    public final Call call;

    public DownloadResumable(String uuid, String url, String fileUri, Call call) {
      this.uuid = uuid;
      this.url = url;
      this.fileUri = fileUri;
      this.call = call;
    }
  }

  // https://github.com/square/okhttp/blob/master/samples/guide/src/main/java/okhttp3/recipes/Progress.java
  private static class ProgressResponseBody extends ResponseBody {

    private final ResponseBody responseBody;
    private final ProgressListener progressListener;
    private BufferedSource bufferedSource;

    ProgressResponseBody(ResponseBody responseBody, ProgressListener progressListener) {
      this.responseBody = responseBody;
      this.progressListener = progressListener;
    }

    @Override public MediaType contentType() {
      return responseBody.contentType();
    }

    @Override public long contentLength() {
      return responseBody.contentLength();
    }

    @Override public BufferedSource source() {
      if (bufferedSource == null) {
        bufferedSource = Okio.buffer(source(responseBody.source()));
      }
      return bufferedSource;
    }

    private Source source(Source source) {
      return new ForwardingSource(source) {
        long totalBytesRead = 0L;

        @Override public long read(Buffer sink, long byteCount) throws IOException {
          long bytesRead = super.read(sink, byteCount);
          // read() returns the number of bytes read, or -1 if this source is exhausted.
          totalBytesRead += bytesRead != -1 ? bytesRead : 0;
          progressListener.update(totalBytesRead, responseBody.contentLength(), bytesRead == -1);
          return bytesRead;
        }
      };
    }
  }

  interface ProgressListener {
    void update(long bytesRead, long contentLength, boolean done);
  }
}
