// Copyright 2015-present 650 Industries. All rights reserved.

package abi7_0_0.host.exp.exponent.modules.api.filesystem;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Map;

import android.content.Context;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.util.SparseArray;

import java.io.File;
import java.net.URL;

import abi7_0_0.com.facebook.react.bridge.Promise;
import abi7_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi7_0_0.com.facebook.react.bridge.ReactContext;
import abi7_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi7_0_0.com.facebook.react.bridge.ReactMethod;
import abi7_0_0.com.facebook.react.bridge.ReadableMap;
import abi7_0_0.com.facebook.react.bridge.WritableMap;
import abi7_0_0.com.facebook.react.bridge.Arguments;
import abi7_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelProvider;

public class FileSystemModule extends ReactContextBaseJavaModule {
  private SparseArray<Downloader> mDownloaders = new SparseArray<Downloader>();
  private String mRootPath;
  private int mNextJobId = 0;

  public static String experienceIdToRootPath(Context context, String experienceId) throws UnsupportedEncodingException {
    return context.getFilesDir() + "/ExperienceData/" + URLEncoder.encode(experienceId, "UTF-8");
  }

  public FileSystemModule(ReactApplicationContext reactContext, JSONObject manifest) {
    super(reactContext);

    try {
      String experienceId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      mRootPath = experienceIdToRootPath(reactContext, experienceId);
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

  private File ensureRootDirExists() throws IOException {
    File rootDir = new File(mRootPath);
    if (!(rootDir.mkdirs() || rootDir.isDirectory())) {
      throw new IOException("Couldn't create root storage directory '" + mRootPath + "'");
    }
    return rootDir;
  }

  private String toScopedPath(String path) throws IOException {
    ensureRootDirExists();
    File file = new File(mRootPath + "/" + path);
    String fileCanonicalPath = file.getCanonicalPath();
    String rootCanonicalPath = new File(mRootPath).getCanonicalPath();
    if (!fileCanonicalPath.startsWith(rootCanonicalPath)) {
      throw new IOException("Path '" + path + "' leads outside root directory of experience");
    }
    return file.getAbsolutePath();
  }

  private boolean deleteRecursive(File file) {
    if (file.isDirectory()) {
      for (File child : file.listFiles()) {
        deleteRecursive(child);
      }
    }
    return file.delete();
  }

  @ReactMethod
  public void deleteAsync(String filepath, Promise promise) {
    try {
      File file = new File(toScopedPath(filepath));
      if (!file.exists()) {
        throw new IOException("File '" + filepath + "' does not exist");
      }
      if (!deleteRecursive(file)) {
        throw new IOException("Couldn't delete '" + filepath + "'");
      }
      promise.resolve(filepath);
    } catch (Exception e) {
      e.printStackTrace();
      promise.reject(e);
    }
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @ReactMethod
  public void downloadAsync(String urlStr, final String filepath, final ReadableMap options, final Promise promise) {
    final int jobId = mNextJobId++;

    try {
      final File file = new File(toScopedPath(filepath));
      URL url = new URL(urlStr);

      DownloadParams params = new DownloadParams();
      
      params.src = url;
      params.dest = file;
      params.maxRedirects = options != null && options.hasKey("maxRedirects") ? options.getInt("maxRedirects") : 20;
      
      params.onTaskCompleted = new DownloadParams.OnTaskCompleted() {
        public void onTaskCompleted(DownloadResult res) {
          if (res.exception == null) {
            WritableMap infoMap = Arguments.createMap();

            infoMap.putString("uri", Uri.fromFile(file).toString());
            infoMap.putInt("jobId", jobId);
            infoMap.putInt("statusCode", res.statusCode);
            infoMap.putInt("bytesWritten", res.bytesWritten);

            promise.resolve(infoMap);
          } else {
            promise.reject(res.exception);
          }
        }
      };
      
      params.onDownloadBegin = new DownloadParams.OnDownloadBegin() {
        public void onDownloadBegin(int statusCode, int contentLength, Map<String, String> headers) {
          WritableMap headersMap = Arguments.createMap();
          
          for (Map.Entry<String, String> entry : headers.entrySet()) {
            headersMap.putString(entry.getKey(), entry.getValue());
          }
          
          WritableMap data = Arguments.createMap();
          
          data.putInt("jobId", jobId);
          data.putInt("statusCode", statusCode);
          data.putInt("contentLength", contentLength);
          data.putMap("headers", headersMap);
          
          sendEvent(getReactApplicationContext(), "DownloadBegin" , data);
        }
      };
      
      params.onDownloadProgress = new DownloadParams.OnDownloadProgress() {
        public void onDownloadProgress(int contentLength, int bytesWritten) {
          WritableMap data = Arguments.createMap();
          data.putInt("contentLength", contentLength);
          data.putInt("bytesWritten", bytesWritten);

          sendEvent(getReactApplicationContext(), "DownloadProgress" , data);
        }
      };

      Downloader downloader = new Downloader();
      
      downloader.execute(params);
      
      mDownloaders.put(jobId, downloader);
    } catch (Exception e) {
      e.printStackTrace();
      promise.reject(e);
    }
  }

  // TODO: Figure out a good stopDownload(...) API and expose to JS
  // @ReactMethod
  public void stopDownload(int jobId) {
    Downloader downloader = mDownloaders.get(jobId);
    
    if (downloader != null) {
      downloader.stop(); 
    }
  }
}
