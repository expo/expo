
package versioned.host.exp.exponent.modules.api.viewshot;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import androidx.annotation.NonNull;
import android.util.DisplayMetrics;
import android.util.Log;

import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.UIManagerModule;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import host.exp.exponent.utils.ScopedContext;
import versioned.host.exp.exponent.modules.api.viewshot.ViewShot.Formats;
import versioned.host.exp.exponent.modules.api.viewshot.ViewShot.Results;

public class RNViewShotModule extends ReactContextBaseJavaModule {

    public static final String RNVIEW_SHOT = "RNViewShot";

    private final ReactApplicationContext reactContext;
    private final ScopedContext mScopedContext;

    private final Executor executor = Executors.newCachedThreadPool();

    public RNViewShotModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
        super(reactContext);
        this.reactContext = reactContext;
        mScopedContext = scopedContext;
    }

    @Override
    public String getName() {
        return RNVIEW_SHOT;
    }

    @Override
    public Map<String, Object> getConstants() {
        return Collections.emptyMap();
    }

    @Override
    public void invalidate() {
        super.invalidate();
        new CleanTask(getReactApplicationContext()).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    @ReactMethod
    public void releaseCapture(String uri) {
        final String path = Uri.parse(uri).getPath();
        if (path == null) return;
        File file = new File(path);
        if (!file.exists()) return;
        File parent = file.getParentFile();
        if (parent.equals(reactContext.getExternalCacheDir()) || parent.equals(reactContext.getCacheDir())) {
            file.delete();
        }
    }

    @ReactMethod
    public void captureRef(int tag, ReadableMap options, Promise promise) {
        final ReactApplicationContext context = getReactApplicationContext();
        final DisplayMetrics dm = context.getResources().getDisplayMetrics();

        final String extension = options.getString("format");
        final int imageFormat = "jpg".equals(extension)
                ? Formats.JPEG
                : "webm".equals(extension)
                ? Formats.WEBP
                : "raw".equals(extension)
                ? Formats.RAW
                : Formats.PNG;

        final double quality = options.getDouble("quality");
        final Integer scaleWidth = options.hasKey("width") ? options.getInt("width") : null;
        final Integer scaleHeight = options.hasKey("height") ? options.getInt("height") : null;
        final String resultStreamFormat = options.getString("result");
        final String fileName = options.hasKey("fileName") ? options.getString("fileName") : null;
        final Boolean snapshotContentContainer = options.getBoolean("snapshotContentContainer");
        final boolean handleGLSurfaceView = options.hasKey("handleGLSurfaceViewOnAndroid") && options.getBoolean("handleGLSurfaceViewOnAndroid");

        try {
            File outputFile = null;
            if (Results.TEMP_FILE.equals(resultStreamFormat)) {
                outputFile = createTempFile(mScopedContext, extension, fileName);
            }

            final Activity activity = getCurrentActivity();
            final UIManagerModule uiManager = this.reactContext.getNativeModule(UIManagerModule.class);

            uiManager.addUIBlock(new ViewShot(
                    tag, extension, imageFormat, quality,
                    scaleWidth, scaleHeight, outputFile, resultStreamFormat,
                    snapshotContentContainer, reactContext, activity, handleGLSurfaceView, promise, executor)
            );
        } catch (final Throwable ex) {
            Log.e(RNVIEW_SHOT, "Failed to snapshot view tag " + tag, ex);
            promise.reject(ViewShot.ERROR_UNABLE_TO_SNAPSHOT, "Failed to snapshot view tag " + tag);
        }
    }

    @ReactMethod
    public void captureScreen(ReadableMap options, Promise promise) {
        captureRef(-1, options, promise);
    }

    private static final String TEMP_FILE_PREFIX = "ReactNative-snapshot-image";

    /**
     * Asynchronous task that cleans up cache dirs (internal and, if available, external) of cropped
     * image files. This is run when the catalyst instance is being destroyed (i.e. app is shutting
     * down) and when the module is instantiated, to handle the case where the app crashed.
     */
    private static class CleanTask extends GuardedAsyncTask<Void, Void> implements FilenameFilter {
        private final File cacheDir;
        private final File externalCacheDir;

        private CleanTask(ReactContext context) {
            super(context);

            cacheDir = context.getCacheDir();
            externalCacheDir = context.getExternalCacheDir();
        }

        @Override
        protected void doInBackgroundGuarded(Void... params) {
            if (null != cacheDir) {
                cleanDirectory(cacheDir);
            }

            if (externalCacheDir != null) {
                cleanDirectory(externalCacheDir);
            }
        }

        @Override
        public final boolean accept(File dir, String filename) {
            return filename.startsWith(TEMP_FILE_PREFIX);
        }

        private void cleanDirectory(@NonNull final File directory) {
            final File[] toDelete = directory.listFiles(this);

            if (toDelete != null) {
                for (File file : toDelete) {
                    if (file.delete()) {
                        Log.d(RNVIEW_SHOT, "deleted file: " + file.getAbsolutePath());
                    }
                }
            }
        }
    }

    /**
     * Create a temporary file in the cache directory on either internal or external storage,
     * whichever is available and has more free space.
     */
    @NonNull
    private File createTempFile(@NonNull final Context context, @NonNull final String ext, String fileName) throws IOException {
        final File externalCacheDir = context.getExternalCacheDir();
        final File internalCacheDir = context.getCacheDir();
        final File cacheDir;

        if (externalCacheDir == null && internalCacheDir == null) {
            throw new IOException("No cache directory available");
        }

        if (externalCacheDir == null) {
            cacheDir = internalCacheDir;
        } else if (internalCacheDir == null) {
            cacheDir = externalCacheDir;
        } else {
            cacheDir = externalCacheDir.getFreeSpace() > internalCacheDir.getFreeSpace() ?
                    externalCacheDir : internalCacheDir;
        }

        final String suffix = "." + ext;
        if (fileName != null) {
            return File.createTempFile(fileName, suffix, cacheDir);
        }
        return File.createTempFile(TEMP_FILE_PREFIX, suffix, cacheDir);
    }
}
