package abi28_0_0.host.exp.exponent.modules.api;

import javax.annotation.Nullable;
import android.graphics.Bitmap;
import android.net.Uri;
import android.util.Base64;
import android.view.View;

import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;
import abi28_0_0.com.facebook.react.uimanager.UIBlock;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import host.exp.exponent.utils.ExpFileUtils;

/**
 * Snapshot utility class allow to screenshot a view.
 */
public class ViewShot implements UIBlock {

    static final String ERROR_UNABLE_TO_SNAPSHOT = "E_UNABLE_TO_SNAPSHOT";

    private int tag;
    private String extension;
    private Bitmap.CompressFormat format;
    private double quality;
    private Integer width;
    private Integer height;
    private File output;
    private String result;
    private Promise promise;

    public ViewShot(
            int tag,
            String extension,
            Bitmap.CompressFormat format,
            double quality,
            @Nullable Integer width,
            @Nullable Integer height,
            File output,
            String result,
            Promise promise) {
        this.tag = tag;
        this.extension = extension;
        this.format = format;
        this.quality = quality;
        this.width = width;
        this.height = height;
        this.output = output;
        this.result = result;
        this.promise = promise;
    }

    @Override
    public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        OutputStream os = null;
        View view = nativeViewHierarchyManager.resolveView(tag);
        if (view == null) {
            promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "No view found with reactTag: "+tag);
            return;
        }
        try {
            if ("file".equals(result)) {
                os = new FileOutputStream(output);
                captureView(view, os);
                String uri = Uri.fromFile(output).toString();
                promise.resolve(uri);
            }
            else if ("base64".equals(result)) {
                os = new ByteArrayOutputStream();
                captureView(view, os);
                byte[] bytes = ((ByteArrayOutputStream) os).toByteArray();
                String data = Base64.encodeToString(bytes, Base64.NO_WRAP);
                promise.resolve(data);
            }
            else if ("data-uri".equals(result)) {
                os = new ByteArrayOutputStream();
                captureView(view, os);
                byte[] bytes = ((ByteArrayOutputStream) os).toByteArray();
                String data = Base64.encodeToString(bytes, Base64.NO_WRAP);
                data = "data:image/"+extension+";base64," + data;
                promise.resolve(data);
            }
            else {
                promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "Unsupported result: "+result+". Try one of: file | base64 | data-uri");
            }
        }
        catch (Exception e) {
            promise.reject(ERROR_UNABLE_TO_SNAPSHOT, "Failed to capture view snapshot");
        }
        finally {
            if (os != null) {
                try {
                    os.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * Screenshot a view and return the captured bitmap.
     * @param view the view to capture
     * @return the screenshot or null if it failed.
     */
    private void captureView (View view, OutputStream os) {
        int w = view.getWidth();
        int h = view.getHeight();
        if (w <= 0 || h <= 0) {
            throw new RuntimeException("Impossible to snapshot the view: view is invalid");
        }
        if (!view.isDrawingCacheEnabled())
          view.setDrawingCacheEnabled(true);

        Bitmap bitmap = view.getDrawingCache();

        if (width != null && height != null && (width != w || height != h)) {
            bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
        }
        if (bitmap == null) {
            throw new RuntimeException("Impossible to snapshot the view");
        }
        bitmap.compress(format, (int)(100.0 * quality), os);
        view.setDrawingCacheEnabled(false);
    }
}
