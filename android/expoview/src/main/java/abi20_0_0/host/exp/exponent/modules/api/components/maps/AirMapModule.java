package abi20_0_0.host.exp.exponent.modules.api.components.maps;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.util.Base64;
import android.graphics.Bitmap;
import android.net.Uri;
import android.view.View;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Closeable;

import javax.annotation.Nullable;

import abi20_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi20_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi20_0_0.com.facebook.react.bridge.ReadableMap;
import abi20_0_0.com.facebook.react.bridge.Promise;
import abi20_0_0.com.facebook.react.bridge.ReactMethod;
import abi20_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi20_0_0.com.facebook.react.uimanager.UIBlock;
import abi20_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;

import com.google.android.gms.maps.GoogleMap;

public class AirMapModule extends ReactContextBaseJavaModule {

    private static final String SNAPSHOT_RESULT_FILE = "file";
    private static final String SNAPSHOT_RESULT_BASE64 = "base64";
    private static final String SNAPSHOT_FORMAT_PNG = "png";
    private static final String SNAPSHOT_FORMAT_JPG = "jpg";

    public AirMapModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AirMapModule";
    }

    public Activity getActivity() {
        return getCurrentActivity();
    }

    public static void closeQuietly(Closeable closeable) {
        if (closeable == null) return;
        try {
            closeable.close();
        } catch (IOException ignored) {
        }
    }

    @ReactMethod
    public void takeSnapshot(final int tag, final ReadableMap options, final Promise promise) {

        // Parse and verity options
        final ReactApplicationContext context = getReactApplicationContext();
        final String format = options.hasKey("format") ? options.getString("format") : "png";
        final Bitmap.CompressFormat compressFormat =
            format.equals(SNAPSHOT_FORMAT_PNG) ? Bitmap.CompressFormat.PNG :
            format.equals(SNAPSHOT_FORMAT_JPG) ? Bitmap.CompressFormat.JPEG : null;
        final double quality = options.hasKey("quality") ? options.getDouble("quality") : 1.0;
        final DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
        final Integer width = options.hasKey("width") ? (int)(displayMetrics.density * options.getDouble("width")) : 0;
        final Integer height = options.hasKey("height") ? (int)(displayMetrics.density * options.getDouble("height")) : 0;
        final String result = options.hasKey("result") ? options.getString("result") : "file";

        // Add UI-block so we can get a valid reference to the map-view
        UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
        uiManager.addUIBlock(new UIBlock() {
            public void execute (NativeViewHierarchyManager nvhm) {
                AirMapView view = (AirMapView) nvhm.resolveView(tag);
                if (view == null) {
                    promise.reject("AirMapView not found");
                    return;
                }
                if (view.map == null) {
                    promise.reject("AirMapView.map is not valid");
                    return;
                }
                view.map.snapshot(new GoogleMap.SnapshotReadyCallback() {
                    public void onSnapshotReady(@Nullable Bitmap snapshot) {

                        // Convert image to requested width/height if neccesary
                        if (snapshot == null) {
                            promise.reject("Failed to generate bitmap, snapshot = null");
                            return;
                        }
                        if ((width != 0) && (height != 0) && (width != snapshot.getWidth() || height != snapshot.getHeight())) {
                            snapshot = Bitmap.createScaledBitmap(snapshot, width, height, true);
                        }

                        // Save the snapshot to disk
                        if (result.equals(SNAPSHOT_RESULT_FILE)) {
                            File tempFile;
                            FileOutputStream outputStream;
                            try {
                                tempFile = File.createTempFile("AirMapSnapshot", "." + format, context.getCacheDir());
                                outputStream = new FileOutputStream(tempFile);
                            }
                            catch (Exception e) {
                                promise.reject(e);
                                return;
                            }
                            snapshot.compress(compressFormat, (int)(100.0 * quality), outputStream);
                            closeQuietly(outputStream);
                            String uri = Uri.fromFile(tempFile).toString();
                            promise.resolve(uri);
                        }
                        else if (result.equals(SNAPSHOT_RESULT_BASE64)) {
                            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                            snapshot.compress(compressFormat, (int)(100.0 * quality), outputStream);
                            closeQuietly(outputStream);
                            byte[] bytes = outputStream.toByteArray();
                            String data = Base64.encodeToString(bytes, Base64.NO_WRAP);
                            promise.resolve(data);
                        }
                    }
                });
            }
        });
    }
}
