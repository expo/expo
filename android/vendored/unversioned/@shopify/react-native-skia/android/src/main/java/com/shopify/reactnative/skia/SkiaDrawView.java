package com.shopify.reactnative.skia;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.util.Log;
import android.view.Surface;
import android.view.TextureView;
import android.view.MotionEvent;

import com.facebook.jni.HybridData;
import com.facebook.jni.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactContext;

public class SkiaDrawView extends TextureView implements TextureView.SurfaceTextureListener {

    private static final String TAG = "Java::JniSkiaDrawView";

    @DoNotStrip
    private HybridData mHybridData;

    @DoNotStrip
    private boolean mViewRemoved;

    @DoNotStrip
    private Surface mSurface;

    public SkiaDrawView(Context ctx) {
        super(ctx);
        RNSkiaModule skiaModule = ((ReactContext)ctx).getNativeModule(RNSkiaModule.class);
        mHybridData = initHybrid(skiaModule.getSkiaManager());
        setSurfaceTextureListener(this);
        setOpaque(false);
    }

    @Override
    public void setBackgroundColor(int color) {
        // Texture view does not support setting the background color.
    }

    public void releaseSurface() {
        if(mSurface != null) {
            mSurface.release();
            mSurface = null;
        }
        // We can only reset the native side when the view was removed from screen.
        // releasing the surface can also be done when the view is hidden and then
        // we should only release the surface - and keep the native part around.
        if(mViewRemoved) {
            mHybridData.resetNative();
        }
    }

    void onViewRemoved() {
        mViewRemoved = true;
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        int action = ev.getAction();
        int count = ev.getPointerCount();
        MotionEvent.PointerCoords r = new MotionEvent.PointerCoords();
        double[] points = new double[count*5];
        for (int i = 0; i < count; i++) {
            ev.getPointerCoords(i, r);
            points[i] = r.x;
            points[i+1] = r.y;
            points[i+2] = ev.getPressure(i);
            switch (action) {
                case MotionEvent.ACTION_DOWN:
                case MotionEvent.ACTION_POINTER_DOWN:
                    points[i+3] = 0;
                    break;
                case MotionEvent.ACTION_MOVE:
                    points[i+3] = 1;
                    break;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_POINTER_UP:
                    points[i+3] = 2;
                    break;
                case MotionEvent.ACTION_CANCEL:
                    points[i+3] = 3;
                    break;
            }
            points[i+4] = ev.getPointerId(i);
        }
        updateTouchPoints(points);
        return true;
    }

    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        mSurface = new Surface(surface);
        surfaceAvailable(mSurface, width, height);
    }

    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
        surfaceSizeChanged(width, height);
    }

    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        surfaceDestroyed();
        // https://developer.android.com/reference/android/view/TextureView.SurfaceTextureListener#onSurfaceTextureDestroyed(android.graphics.SurfaceTexture)
        // Invoked when the specified SurfaceTexture is about to be destroyed. If returns true,
        // no rendering should happen inside the surface texture after this method is invoked.
        // If returns false, the client needs to call SurfaceTexture#release().
        return false;
    }

    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surface) {
        // Nothing special to do here
    }

    private native HybridData initHybrid(SkiaManager skiaManager);

    private native void surfaceAvailable(Object surface, int width, int height);

    private native void surfaceSizeChanged(int width, int height);

    private native void surfaceDestroyed();

    private native void setBgColor(int color);

    public native void setMode(String mode);

    public native void setDebugMode(boolean show);

    public native void updateTouchPoints(double[] points);
}
