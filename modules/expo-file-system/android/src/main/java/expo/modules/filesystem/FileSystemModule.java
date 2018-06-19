
package expo.modules.filesystem;

import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.CookieHandler;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.interfaces.ExpoMethod;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.Promise;
import expo.core.interfaces.services.EventEmitter;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.Interceptor;
import okhttp3.JavaNetCookieJar;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.Buffer;
import okio.BufferedSink;
import okio.BufferedSource;
import okio.ForwardingSource;
import okio.Okio;
import okio.Source;

public class FileSystemModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String NAME = "ExponentFileSystem";
  private static final String TAG = FileSystemModule.class.getSimpleName();
  private static final String EXDownloadProgressEventName = "Exponent.downloadProgress";
  private static final String SHELL_APP_EMBEDDED_MANIFEST_PATH = "shell-app-manifest.json";
  private static final long MIN_EVENT_DT_MS = 100;
  private static final String HEADER_KEY = "headers";

  private ModuleRegistry mModuleRegistry;

  private final Map<String, DownloadResumable> mDownloadResumableMap = new HashMap<>();

  public FileSystemModule(Context context) {
    super(context);
    try {
      ensureDirExists(getContext().getFilesDir());
      ensureDirExists(getContext().getCacheDir());
    } catch (IOException e) {
      e.printStackTrace();
    }

  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put("documentDirectory", Uri.fromFile(getContext().getFilesDir()).toString() + "/");
    constants.put("cacheDirectory", Uri.fromFile(getContext().getCacheDir()).toString() + "/");
    constants.put("bundleDirectory", "asset:///");
    constants.put("bundledAssets", getBundledAssets());

    return constants;
  }

  private enum Permission {
    READ, WRITE,
  }

  private List<String> getBundledAssets() {
//    // Fastpath, only standalone apps support bundled assets.
//    if (!ConstantsModule.getAppOwnership(mExperienceProperties).equals("standalone")) {
//      return null;
//    }
    try {
      InputStream inputStream = getContext().getAssets().open(SHELL_APP_EMBEDDED_MANIFEST_PATH);
      String jsonString = IOUtils.toString(inputStream);
      JSONObject manifest = new JSONObject(jsonString);
      JSONArray bundledAssetsJSON = manifest.getJSONArray("bundledAssets");
      if (bundledAssetsJSON == null) {
        return null;
      }
      List<String> result = new ArrayList<>();
      for (int i = 0; i < bundledAssetsJSON.length(); i++) {
        result.add(bundledAssetsJSON.getString(i));
      }
      return result;
    } catch (Exception ex) {
      ex.printStackTrace();
      return null;
    }
  }

  private File uriToFile(Uri uri) {
    return new File(uri.getPath());
  }

  private EnumSet<Permission> permissionsForPath(String path) {
    try {
      path = new File(path).getCanonicalPath();
      String filesDir = getContext().getFilesDir().getCanonicalPath();
      if (path.startsWith(filesDir + "/")) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      if (filesDir.equals(path)) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      String cacheDir = getContext().getCacheDir().getCanonicalPath();
      if (path.startsWith(cacheDir + "/")) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      if (cacheDir.equals(path)) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
    } catch (IOException e) {
      return EnumSet.noneOf(Permission.class);
    }
    return EnumSet.noneOf(Permission.class);
  }

  private EnumSet<Permission> permissionsForUri(Uri uri) {
    if ("content".equals(uri.getScheme())) {
      return EnumSet.of(Permission.READ);
    }
    if ("asset".equals(uri.getScheme())) {
      return EnumSet.of(Permission.READ);
    }
    if ("file".equals(uri.getScheme())) {
      return permissionsForPath(uri.getPath());
    }
    return EnumSet.noneOf(Permission.class);
  }

  // For now we only need to ensure one permission at a time, this allows easier error message strings,
  // we can generalize this when needed later

  private void ensurePermission(Uri uri, Permission permission, String errorMsg) throws IOException {
    if (!permissionsForUri(uri).contains(permission)) {
      throw new IOException(errorMsg);
    }
  }

  private void ensurePermission(Uri uri, Permission permission) throws IOException {
    if (permission.equals(Permission.READ)) {
      ensurePermission(uri, permission, "Location '" + uri + "' isn't readable.");
    }
    if (permission.equals(Permission.WRITE)) {
      ensurePermission(uri, permission, "Location '" + uri + "' isn't writable.");
    }
    ensurePermission(uri, permission, "Location '" + uri + "' doesn't have permission '" + permission.name() + "'.");
  }

  private InputStream openAssetInputStream(Uri uri) throws IOException {
    // AssetManager expects no leading slash.
    String asset = uri.getPath().substring(1);
    return getContext().getAssets().open(asset);
  }

  @ExpoMethod
  public void getInfoAsync(String uriStr, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.READ);
      if ("file".equals(uri.getScheme())) {
        File file = uriToFile(uri);
        Bundle result = new Bundle();
        if (file.exists()) {
          result.putBoolean("exists", true);
          result.putBoolean("isDirectory", file.isDirectory());
          result.putString("uri", Uri.fromFile(file).toString());
          if (options.containsKey("md5") && (Boolean) options.get("md5")) {
            result.putString("md5", md5(file));
          }
          result.putDouble("size", file.length());
          result.putDouble("modificationTime", 0.001 * file.lastModified());
          promise.resolve(result);
        } else {
          result.putBoolean("exists", false);
          result.putBoolean("isDirectory", false);
          promise.resolve(result);
        }
      } else if ("content".equals(uri.getScheme()) || "asset".equals(uri.getScheme())) {
        Bundle result = new Bundle();
        try {
          InputStream is = "content".equals(uri.getScheme()) ?
              getContext().getContentResolver().openInputStream(uri) :
              openAssetInputStream(uri);
          if (is == null) {
            throw new FileNotFoundException();
          }
          result.putBoolean("exists", true);
          result.putBoolean("isDirectory", false);
          result.putString("uri", uri.toString());
          // NOTE: `.available()` is supposedly not a reliable source of size info, but it's been
          //       more reliable than querying `OpenableColumns.SIZE` in practice in tests ¯\_(ツ)_/¯
          result.putDouble("size", is.available());
          if (options.containsKey("md5") && (Boolean) options.get("md5")) {
            byte[] md5bytes = DigestUtils.md5(is);
            result.putString("md5", String.valueOf(Hex.encodeHex(md5bytes)));
          }
          promise.resolve(result);
        } catch (FileNotFoundException e)  {
          result.putBoolean("exists", false);
          result.putBoolean("isDirectory", false);
          promise.resolve(result);
        }
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void readAsStringAsync(String uriStr, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.READ);
      if ("file".equals(uri.getScheme())) {
        promise.resolve(IOUtils.toString(new FileInputStream(uriToFile(uri))));
      } else if("asset".equals(uri.getScheme())) {
        promise.resolve(IOUtils.toString(openAssetInputStream(uri)));
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void writeAsStringAsync(String uriStr, String string, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.WRITE);
      if ("file".equals(uri.getScheme())) {
        FileOutputStream out = new FileOutputStream(uriToFile(uri));
        OutputStreamWriter writer = new OutputStreamWriter(out);
        writer.write(string);
        writer.close();
        out.close();
        promise.resolve(null);
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void deleteAsync(String uriStr, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      Uri appendedUri = Uri.withAppendedPath(uri, "..");
      ensurePermission(appendedUri, Permission.WRITE, "Location '" + uri + "' isn't deletable.");
      if ("file".equals(uri.getScheme())) {
        File file = uriToFile(uri);
        if (file.exists()) {
          FileUtils.forceDelete(file);
          promise.resolve(null);
        } else {
          if (options.containsKey("idempotent") && (Boolean) options.get("idempotent")) {
            promise.resolve(null);
          } else {
            promise.reject("E_FILE_NOT_FOUND",
                    "File '" + uri + "' could not be deleted because it could not be found");
          }
        }
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void moveAsync(Map<String, Object> options, Promise promise) {
    try {
      if (!options.containsKey("from")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `from` path.");
        return;
      }
      Uri fromUri = Uri.parse((String) options.get("from"));
      ensurePermission(Uri.withAppendedPath(fromUri, ".."), Permission.WRITE, "Location '" + fromUri + "' isn't movable.");
      if (!options.containsKey("to")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.");
        return;
      }
      Uri toUri = Uri.parse((String) options.get("to"));
      ensurePermission(toUri, Permission.WRITE);

      if ("file".equals(fromUri.getScheme())) {
        File from = uriToFile(fromUri);
        File to = uriToFile(toUri);
        if (from.renameTo(to)) {
          promise.resolve(null);
        } else {
          promise.reject("E_FILE_NOT_MOVED",
                  "File '" + fromUri + "' could not be moved to '" + toUri + "'");
        }
      } else {
        throw new IOException("Unsupported scheme for location '" + fromUri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void copyAsync(Map<String, Object> options, Promise promise) {
    try {
      if (!options.containsKey("from")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `from` path.");
        return;
      }
      Uri fromUri = Uri.parse((String) options.get("from"));
      ensurePermission(fromUri, Permission.READ);
      if (!options.containsKey("to")) {
        promise.reject("E_MISSING_PARAMETER", "`FileSystem.moveAsync` needs a `to` path.");
        return;
      }
      Uri toUri = Uri.parse((String) options.get("to"));
      ensurePermission(toUri, Permission.WRITE);

      if ("file".equals(fromUri.getScheme())) {
        File from = uriToFile(fromUri);
        File to = uriToFile(toUri);
        if (from.isDirectory()) {
          FileUtils.copyDirectory(from, to);
          promise.resolve(null);
        } else {
          FileUtils.copyFile(from, to);
          promise.resolve(null);
        }
      } else if ("content".equals(fromUri.getScheme())) {
        InputStream in = getContext().getContentResolver().openInputStream(fromUri);
        OutputStream out = new FileOutputStream(uriToFile(toUri));
        IOUtils.copy(in, out);
        promise.resolve(null);
      } else if ("asset".equals(fromUri.getScheme())) {
        InputStream in = openAssetInputStream(fromUri);
        OutputStream out = new FileOutputStream(uriToFile(toUri));
        IOUtils.copy(in, out);
        promise.resolve(null);
      } else {
        throw new IOException("Unsupported scheme for location '" + fromUri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void makeDirectoryAsync(String uriStr, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.WRITE);
      if ("file".equals(uri.getScheme())) {
        File file = uriToFile(uri);
        boolean success = options.containsKey("intermediates") && (Boolean) options.get("intermediates") ?
                file.mkdirs() :
                file.mkdir();
        if (success) {
          promise.resolve(null);
        } else {
          promise.reject("E_DIRECTORY_NOT_CREATED",
                  "Directory '" + uri + "' could not be created.");
        }
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void readDirectoryAsync(String uriStr, Map<String, Object> options, Promise promise) {
    try {
      Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.READ);
      if ("file".equals(uri.getScheme())) {
        File file = uriToFile(uri);
        File[] children = file.listFiles();
        if (children != null) {
          List<String> result = new ArrayList<>();
          for (File child : children) {
            result.add(child.getName());
          }
          promise.resolve(result);
        } else {
          promise.reject("E_DIRECTORY_NOT_READ",
                  "Directory '" + uri + "' could not be read.");
        }
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void downloadAsync(String url, final String uriStr, final Map<String, Object> options, final Promise promise) {
    try {
      final Uri uri = Uri.parse(uriStr);
      ensurePermission(uri, Permission.WRITE);
      if ("file".equals(uri.getScheme())) {
        Request request = new Request.Builder().url(url).build();
        getOkHttpClientBuilder().build().newCall(request).enqueue(new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            Log.e(TAG, e.getMessage());
            promise.reject(e);
          }

          @Override
          public void onResponse(Call call, Response response) throws IOException {
            File file = uriToFile(uri);
            file.delete();
            BufferedSink sink = Okio.buffer(Okio.sink(file));
            sink.writeAll(response.body().source());
            sink.close();

            Bundle result = new Bundle();
            result.putString("uri", Uri.fromFile(file).toString());
            if (options != null && options.containsKey("md5") && (Boolean) options.get("md5")) {
              result.putString("md5", md5(file));
            }
            result.putInt("status", response.code());
            result.putBundle("headers", translateHeaders(response.headers()));
            promise.resolve(result);
          }
        });
      } else {
        throw new IOException("Unsupported scheme for location '" + uri +  "'.");
      }
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void downloadResumableStartAsync(String url, final String fileUriStr, final String uuid, final Map<String, Object> options, final String resumeData, final Promise promise) {
    try {
      final Uri fileUri = Uri.parse(fileUriStr);
      if (!("file".equals(fileUri.getScheme()))) {
        throw new IOException("Unsupported scheme for location '" + fileUri +  "'.");
      }

      final boolean isResume = resumeData != null;

      final ProgressListener progressListener = new ProgressListener() {
        long mLastUpdate = -1;

        @Override public void update(long bytesRead, long contentLength, boolean done) {
          EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);
          if (eventEmitter != null) {
            Bundle downloadProgress = new Bundle();
            Bundle downloadProgressData = new Bundle();
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
              downloadProgress.putBundle("data", downloadProgressData);

              eventEmitter.emit(EXDownloadProgressEventName, downloadProgress);
            }
          }
        }
      };

      OkHttpClient client =
        getOkHttpClientBuilder()
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

      if (options != null && options.containsKey(HEADER_KEY)) {
        final Map<String, Object> headers = (Map<String, Object>) options.get(HEADER_KEY);
        for (String key: headers.keySet()) {
          requestBuilder.addHeader(key, headers.get(key).toString());
        }
      }

      Request request = requestBuilder.url(url).build();
      Call call = client.newCall(request);
      DownloadResumable downloadResumable = new DownloadResumable(uuid, url, fileUri, call);
      this.mDownloadResumableMap.put(uuid, downloadResumable);

      File file = uriToFile(fileUri);
      DownloadResumableTaskParams params = new DownloadResumableTaskParams(options, call, file, isResume, promise);
      DownloadResumableTask task = new DownloadResumableTask();
      task.execute(params);
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void downloadResumablePauseAsync(final String uuid, final Promise promise) {
    DownloadResumable downloadResumable = this.mDownloadResumableMap.get(uuid);
    if (downloadResumable != null) {
      downloadResumable.call.cancel();
      this.mDownloadResumableMap.remove(downloadResumable.uuid);
      try {
        File file = uriToFile(downloadResumable.fileUri);
        Bundle result = new Bundle();
        result.putString("resumeData", String.valueOf(file.length()));
        promise.resolve(result);
      } catch (Exception e) {
        Log.e(TAG, e.getMessage());
        promise.reject(e);
      }
    } else {
      Exception e = new IOException("No download object available");
      Log.e(TAG, e.getMessage());
      promise.reject(e);
    }
  }

  private static class DownloadResumableTaskParams {
    Map<String, Object> options;
    Call call;
    File file;
    boolean isResume;
    Promise promise;

    DownloadResumableTaskParams(Map<String, Object> options, Call call, File file, boolean isResume, Promise promise) {
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
      Map<String, Object> options = params[0].options;

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

        Bundle result = new Bundle();
        result.putString("uri", Uri.fromFile(file).toString());
        if (options != null && options.containsKey("md5") && (Boolean) options.get("md5")) {
          result.putString("md5", md5(file));
        }
        result.putInt("status", response.code());
        result.putBundle("headers", translateHeaders(response.headers()));

        promise.resolve(result);
        return null;
      } catch (Exception e) {
        Log.e(TAG, e.getMessage());
        promise.reject(e);
        return null;
      }
    }
  }

  // Copied out of React Native's `NetworkingModule.java`
  private static Bundle translateHeaders(Headers headers) {
    Bundle responseHeaders = new Bundle();
    for (int i = 0; i < headers.size(); i++) {
      String headerName = headers.name(i);
      // multiple values for the same header
      if (responseHeaders.get(headerName) != null) {
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
    public final Uri fileUri;
    public final Call call;

    public DownloadResumable(String uuid, String url, Uri fileUri, Call call) {
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

  private OkHttpClient.Builder getOkHttpClientBuilder() {
    CookieHandler cookieHandler = mModuleRegistry.getModule(CookieHandler.class);
    OkHttpClient.Builder builder = new OkHttpClient.Builder();
    if (cookieHandler != null) {
      builder.cookieJar(new JavaNetCookieJar(cookieHandler));
    }
    return builder;
  }

  private String md5(File file) throws IOException {
    InputStream is = new FileInputStream(file);
    try {
      byte[] md5bytes = DigestUtils.md5(is);
      return String.valueOf(Hex.encodeHex(md5bytes));
    } finally {
      is.close();
    }
  }

  private void ensureDirExists(File dir) throws IOException {
    if (!(dir.isDirectory() || dir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + dir + "'");
    }
  }
}
