package com.shopify.reactnative.skia;

import android.app.Application;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Choreographer;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PlatformContext {
    @DoNotStrip
    private final HybridData mHybridData;

    private final ReactContext mContext;

    private boolean _drawLoopActive = false;
    private boolean _isPaused = false;

    private final String TAG = "PlatformContext";

    public PlatformContext(ReactContext reactContext) {
        mContext = reactContext;
        mHybridData = initHybrid(reactContext.getResources().getDisplayMetrics().density);
    }

    private byte[] getStreamAsBytes(InputStream is) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[4 * 0x400];
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    private void postFrameLoop() {
        Choreographer.FrameCallback frameCallback = new Choreographer.FrameCallback() {
            @Override
            public void doFrame(long frameTimeNanos) {
                if (_isPaused) {
                    return;
                }
                notifyDrawLoop();
                if (_drawLoopActive) {
                    postFrameLoop();
                }
            }
        };
        Choreographer.getInstance().postFrameCallback(frameCallback);
    }

    @DoNotStrip
    public void notifyTaskReadyOnMainThread() {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                notifyTaskReady();
            }
        });
    }

    @DoNotStrip
    Object takeScreenshotFromViewTag(int tag) {
        return ViewScreenshotService.makeViewScreenshotFromTag(mContext, tag);
    }

    @DoNotStrip
    public void raise(final String message) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                mContext.handleException(new Exception(message));
            }
        });
    }

    @DoNotStrip
    public void beginDrawLoop() {
        if (_drawLoopActive) {
            return;
        }
        _drawLoopActive = true;
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                postFrameLoop();
            }
        });
    }

    @DoNotStrip
    public void endDrawLoop() {
        if (_drawLoopActive) {
            _drawLoopActive = false;
        }
    }

    @DoNotStrip
    public byte[] getJniStreamFromSource(String sourceUri) throws IOException {
        // First try loading the input as a resource directly
        int resourceId = mContext.getResources().getIdentifier(sourceUri, "drawable", mContext.getPackageName());

        // Test to see if we have a raw resource (for SVG)
        if (resourceId == 0) {
            resourceId = mContext.getResources().getIdentifier(sourceUri, "raw", mContext.getPackageName());
        }

        if (resourceId != 0) {
            // We can just return the input stream directly
            return getStreamAsBytes(mContext.getResources().openRawResource(resourceId));
        }

        // We should try to open a connection and return a stream to download this
        // object
        URI uri = null;
        try {
            uri = new URI(sourceUri);

            String scheme = uri.getScheme();

            if (scheme == null)
                throw new Exception("Invalid URI scheme");

            // TODO: Base64??

            URL url = uri.toURL();
            URLConnection connection = url.openConnection();
            connection.connect();

            BufferedInputStream b = new BufferedInputStream(url.openStream(), 8192);
            return getStreamAsBytes(b);

        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    void onPause() {
        Log.i(TAG, "Paused");
        _isPaused = true;
    }

    void onResume() {
        _isPaused = false;
        Log.i(TAG, "Resume");
        if(_drawLoopActive) {
            // Restart draw loop
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    postFrameLoop();
                }
            });
        }
    }

    @Override
    protected void finalize() throws Throwable {
        mHybridData.resetNative();
        super.finalize();
    }

    // Private c++ native methods
    private native HybridData initHybrid(float pixelDensity);
    private native void notifyDrawLoop();
    private native void notifyTaskReady();
}
