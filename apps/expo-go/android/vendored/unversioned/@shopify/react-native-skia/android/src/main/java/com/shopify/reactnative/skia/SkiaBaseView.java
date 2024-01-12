package com.shopify.reactnative.skia;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.util.Log;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.TextureView;

import com.facebook.jni.annotations.DoNotStrip;
import com.facebook.react.views.view.ReactViewGroup;

public abstract class SkiaBaseView extends ReactViewGroup implements TextureView.SurfaceTextureListener {

    @DoNotStrip
    private Surface mSurface;
    private TextureView mTexture;

    private String tag = "SkiaView";

    private boolean manageTexture = false;

    public SkiaBaseView(Context context, boolean manageTexture) {
        super(context);
        this.manageTexture = manageTexture;
        mTexture = new TextureView(context);
        mTexture.setSurfaceTextureListener(this);
        mTexture.setOpaque(false);
        addView(mTexture);
    }

    public void destroySurface() {
        if (mSurface != null) {
            Log.i(tag, "destroySurface");
            surfaceDestroyed();
            mSurface.release();
            mSurface = null;
        }
    }

    private void createSurfaceTexture() {
        if (manageTexture) {
            // This API Level is >= 26, we created our own SurfaceTexture to have a faster time to first frame
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                Log.i(tag, "Create SurfaceTexture");
                SurfaceTexture surface = new SurfaceTexture(false);
                mTexture.setSurfaceTexture(surface);
                this.onSurfaceTextureAvailable(surface, this.getMeasuredWidth(), this.getMeasuredHeight());
            }
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (this.getMeasuredWidth() == 0) {
            createSurfaceTexture();
        }
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        Log.i(tag, "onLayout " + this.getMeasuredWidth() + "/" + this.getMeasuredHeight());
        super.onLayout(changed, left, top, right, bottom);
        mTexture.layout(0, 0, this.getMeasuredWidth(), this.getMeasuredHeight());
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        // https://developer.android.com/training/gestures/multi
        int action = ev.getActionMasked();

        MotionEvent.PointerCoords r = new MotionEvent.PointerCoords();

        double[] points;

        // If this is a pointer_up/down event we need to handle it a bit specialized
        switch (action) {
            case MotionEvent.ACTION_POINTER_DOWN:
            case MotionEvent.ACTION_POINTER_UP: {
                points = new double[5];
                int pointerIndex = ev.getActionIndex();
                ev.getPointerCoords(pointerIndex, r);
                points[0] = r.x;
                points[1] = r.y;
                points[2] = ev.getPressure(pointerIndex);
                points[3] = motionActionToType(action);
                points[4] = ev.getPointerId(pointerIndex);

                updateTouchPoints(points);

                break;
            }
            default: {
                // For the rest we can just handle it like expected
                int count = ev.getPointerCount();
                int pointerIndex = 0;
                points = new double[5 * count];
                for (int i = 0; i < count; i++) {
                    ev.getPointerCoords(i, r);
                    points[pointerIndex++] = r.x;
                    points[pointerIndex++] = r.y;
                    points[pointerIndex++] = ev.getPressure(i);
                    points[pointerIndex++] = motionActionToType(action);
                    points[pointerIndex++] = ev.getPointerId(i);
                }

                updateTouchPoints(points);

                break;
            }
        }

        return true;
    }

    private static int motionActionToType(int action) {
        int actionType = 3;
        switch (action) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_POINTER_DOWN:
                actionType = 0;
                break;
            case MotionEvent.ACTION_MOVE:
                actionType = 1;
                break;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_POINTER_UP:
                actionType = 2;
                break;
            case MotionEvent.ACTION_CANCEL:
                actionType = 3;
                break;
        }
        return actionType;
    }

    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        Log.i(tag, "onSurfaceTextureAvailable " + width + "/" + height);
        mSurface = new Surface(surface);
        surfaceAvailable(mSurface, width, height);
    }

    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
        Log.i(tag, "onSurfaceTextureSizeChanged " + width + "/" + height);
        surfaceSizeChanged(width, height);
    }

    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        Log.i(tag, "onSurfaceTextureDestroyed");
        // https://developer.android.com/reference/android/view/TextureView.SurfaceTextureListener#onSurfaceTextureDestroyed(android.graphics.SurfaceTexture)
        destroySurface();
        createSurfaceTexture();
        return false;
    }

    //private long _prevTimestamp = 0;
    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surface) {
//        long timestamp = surface.getTimestamp();
//        long frameDuration = (timestamp - _prevTimestamp)/1000000;
//        Log.i(tag, "onSurfaceTextureUpdated "+frameDuration+"ms");
//        _prevTimestamp = timestamp;
    }

    protected abstract void surfaceAvailable(Object surface, int width, int height);

    protected abstract void surfaceSizeChanged(int width, int height);

    protected abstract void surfaceDestroyed();

    protected abstract void setMode(String mode);

    protected abstract void setDebugMode(boolean show);

    protected abstract void updateTouchPoints(double[] points);

    protected abstract void registerView(int nativeId);

    protected abstract void unregisterView();
}
