package abi27_0_0.host.exp.exponent.modules.api;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.util.DisplayMetrics;
import android.view.View;

import abi27_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi27_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi27_0_0.com.facebook.react.bridge.ReactMethod;

import abi27_0_0.com.facebook.react.bridge.GuardedAsyncTask;
import abi27_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi27_0_0.com.facebook.react.bridge.Promise;
import abi27_0_0.com.facebook.react.bridge.ReactContext;
import abi27_0_0.com.facebook.react.bridge.ReadableMap;
import abi27_0_0.com.facebook.react.uimanager.UIBlock;
import abi27_0_0.com.facebook.react.uimanager.UIManagerModule;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;

import host.exp.exponent.utils.ScopedContext;

public class RNViewShotModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;
  private ScopedContext mScopedContext;

  public RNViewShotModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    this.reactContext = reactContext;
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "RNViewShot";
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    new CleanTask(getReactApplicationContext()).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ReactMethod
  public void takeSnapshot(int tag, ReadableMap options, Promise promise) {
    ReactApplicationContext context = getReactApplicationContext();
    String format = options.hasKey("format") ? options.getString("format") : "png";
    Bitmap.CompressFormat compressFormat =
        format.equals("png")
            ? Bitmap.CompressFormat.PNG
            : format.equals("jpg")||format.equals("jpeg")
            ? Bitmap.CompressFormat.JPEG
            : format.equals("webm")
            ? Bitmap.CompressFormat.WEBP
            : null;
    if (compressFormat == null) {
      promise.reject(ViewShot.ERROR_UNABLE_TO_SNAPSHOT, "Unsupported image format: "+format+". Try one of: png | jpg | jpeg");
      return;
    }
    double quality = options.hasKey("quality") ? options.getDouble("quality") : 1.0;
    DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
    Integer width = options.hasKey("width") ? (int)(displayMetrics.density * options.getDouble("width")) : null;
    Integer height = options.hasKey("height") ? (int)(displayMetrics.density * options.getDouble("height")) : null;
    String result = options.hasKey("result") ? options.getString("result") : "file";
    try {
      File tmpFile = "file".equals(result) ? createTempFile(mScopedContext, format) : null;
      UIManagerModule uiManager = this.reactContext.getNativeModule(UIManagerModule.class);
      uiManager.addUIBlock(new ViewShot(tag, format, compressFormat, quality, width, height, tmpFile, result, promise));
    }
    catch (Exception e) {
      promise.reject(ViewShot.ERROR_UNABLE_TO_SNAPSHOT, "Failed to snapshot view tag "+ tag + ". " + e.getMessage(), e);
    }
  }

  private static final String TEMP_FILE_PREFIX = "ReactNative_snapshot_image_";

  /**
   * Asynchronous task that cleans up cache dirs (internal and, if available, external) of cropped
   * image files. This is run when the catalyst instance is being destroyed (i.e. app is shutting
   * down) and when the module is instantiated, to handle the case where the app crashed.
   */
  private static class CleanTask extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;

    private CleanTask(ReactContext context) {
      super(context);
      mContext = context;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      cleanDirectory(mContext.getCacheDir());
      File externalCacheDir = mContext.getExternalCacheDir();
      if (externalCacheDir != null) {
        cleanDirectory(externalCacheDir);
      }
    }

    private void cleanDirectory(File directory) {
      File[] toDelete = directory.listFiles(
          new FilenameFilter() {
            @Override
            public boolean accept(File dir, String filename) {
              return filename.startsWith(TEMP_FILE_PREFIX);
            }
          });
      if (toDelete != null) {
        for (File file: toDelete) {
          file.delete();
        }
      }
    }
  }

  private File createTempFile(Context context, String ext)
      throws IOException {
    String suffix = "." + ext;
    return File.createTempFile(TEMP_FILE_PREFIX, suffix, context.getCacheDir());
  }
}
