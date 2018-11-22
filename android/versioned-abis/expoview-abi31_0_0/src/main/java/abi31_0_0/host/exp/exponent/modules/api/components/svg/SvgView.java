/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi31_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.Base64;
import android.view.View;
import android.view.ViewParent;

import abi31_0_0.com.facebook.react.bridge.ReactContext;
import abi31_0_0.com.facebook.react.uimanager.DisplayMetricsHolder;
import abi31_0_0.com.facebook.react.uimanager.ReactCompoundView;
import abi31_0_0.com.facebook.react.uimanager.ReactCompoundViewGroup;
import abi31_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi31_0_0.com.facebook.react.views.view.ReactViewGroup;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * Custom {@link View} implementation that draws an RNSVGSvg React view and its children.
 */
@SuppressLint("ViewConstructor")
public class SvgView extends ReactViewGroup implements ReactCompoundView, ReactCompoundViewGroup {

    @Override
    public boolean interceptsTouchEvent(float touchX, float touchY) {
        return true;
    }

    @SuppressWarnings("unused")
    public enum Events {
        EVENT_DATA_URL("onDataURL");

        private final String mName;

        Events(final String name) {
            mName = name;
        }

        public String toString() {
            return mName;
        }
    }

    private @Nullable Bitmap mBitmap;

    public SvgView(ReactContext reactContext) {
        super(reactContext);
        mScale = DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }

    @Override
    public void setId(int id) {
        super.setId(id);
        SvgViewManager.setSvgView(id, this);
    }

    @Override
    public void invalidate() {
        super.invalidate();
        if (mBitmap != null) {
            mBitmap.recycle();
        }
        mBitmap = null;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mBitmap == null) {
            mBitmap = drawOutput();
        }
        if (mBitmap != null)
            canvas.drawBitmap(mBitmap, 0, 0, null);
    }

    @Override
    public int reactTagForTouch(float touchX, float touchY) {
        return hitTest(touchX, touchY);
    }

    private boolean mResponsible = false;

    private final Map<String, VirtualView> mDefinedClipPaths = new HashMap<>();
    private final Map<String, VirtualView> mDefinedTemplates = new HashMap<>();
    private final Map<String, VirtualView> mDefinedMasks = new HashMap<>();
    private final Map<String, Brush> mDefinedBrushes = new HashMap<>();
    private Canvas mCanvas;
    private final float mScale;

    private float mMinX;
    private float mMinY;
    private float mVbWidth;
    private float mVbHeight;
    private String mbbWidth;
    private String mbbHeight;
    private String mAlign;
    private int mMeetOrSlice;
    private final Matrix mInvViewBoxMatrix = new Matrix();
    private boolean mInvertible = true;
    private boolean mRendered = false;
    int mTintColor = 0;

    private void releaseCachedPath() {
        if (!mRendered) {
            return;
        }
        mRendered = false;
        for (int i = 0; i < getChildCount(); i++) {
            View node = getChildAt(i);
            if (node instanceof VirtualView) {
                VirtualView n = ((VirtualView)node);
                n.releaseCachedPath();
            }
        }
    }

    @ReactProp(name = "tintColor", customType = "Color")
    public void setTintColor(@Nullable Integer tintColor) {
        if (tintColor == null) {
            mTintColor = 0;
        } else {
            mTintColor = tintColor;
        }
    }

    @ReactProp(name = "minX")
    public void setMinX(float minX) {
        mMinX = minX;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "minY")
    public void setMinY(float minY) {
        mMinY = minY;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "vbWidth")
    public void setVbWidth(float vbWidth) {
        mVbWidth = vbWidth;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "vbHeight")
    public void setVbHeight(float vbHeight) {
        mVbHeight = vbHeight;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "bbWidth")
    public void setVbWidth(String bbWidth) {
        mbbWidth = bbWidth;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "bbHeight")
    public void setVbHeight(String bbHeight) {
        mbbHeight = bbHeight;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "align")
    public void setAlign(String align) {
        mAlign = align;
        invalidate();
        releaseCachedPath();
    }

    @ReactProp(name = "meetOrSlice")
    public void setMeetOrSlice(int meetOrSlice) {
        mMeetOrSlice = meetOrSlice;
        invalidate();
        releaseCachedPath();
    }

    private Bitmap drawOutput() {
        mRendered = true;
        float width = getWidth();
        float height = getHeight();
        boolean early = Float.isNaN(width) || Float.isNaN(height) || width * height == 0 || (Math.log10(width) + Math.log10(height) > 42);
        if (early) {
            ViewParent viewParent = getParent();
            View parent = null;
            if ((viewParent instanceof View)) {
                parent = (View)viewParent;
            }
            float parentWidth = parent == null ? 0 : parent.getWidth();
            float parentHeight = parent == null ? 0 : parent.getHeight();
            width = (float) PropHelper.fromRelative(mbbWidth, parentWidth, 0, mScale, 12);
            height = (float) PropHelper.fromRelative(mbbHeight, parentHeight, 0, mScale, 12);
            setMeasuredDimension((int)Math.ceil(width), (int)Math.ceil(height));
        }
        if (width == 0 || height == 0) {
            return null;
        }
        Bitmap bitmap = Bitmap.createBitmap(
                (int) width,
                (int) height,
                Bitmap.Config.ARGB_8888);

        drawChildren(new Canvas(bitmap));
        return bitmap;
    }

    Rect getCanvasBounds() {
        return mCanvas.getClipBounds();
    }

    void drawChildren(final Canvas canvas) {
        mCanvas = canvas;
        if (mAlign != null) {
            RectF vbRect = getViewBox();
            float width = canvas.getWidth();
            float height = canvas.getHeight();
            boolean nested = getParent() instanceof VirtualView;
            if (nested) {
                width = (float) PropHelper.fromRelative(mbbWidth, width, 0f, mScale, 12);
                height = (float) PropHelper.fromRelative(mbbHeight, height, 0f, mScale, 12);
            }
            RectF eRect = new RectF(0,0, width, height);
            if (nested) {
                canvas.clipRect(eRect);
            }
            Matrix mViewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mAlign, mMeetOrSlice);
            mInvertible = mViewBoxMatrix.invert(mInvViewBoxMatrix);
            canvas.concat(mViewBoxMatrix);
        }

        final Paint paint = new Paint();

        paint.setFlags(Paint.ANTI_ALIAS_FLAG | Paint.DEV_KERN_TEXT_FLAG | Paint.SUBPIXEL_TEXT_FLAG);

        paint.setTypeface(Typeface.DEFAULT);


        for (int i = 0; i < getChildCount(); i++) {
            View node = getChildAt(i);
            if (node instanceof VirtualView) {
                ((VirtualView)node).saveDefinition();
            }
        }

        for (int i = 0; i < getChildCount(); i++) {
            View lNode = getChildAt(i);
            if (lNode instanceof VirtualView) {
                VirtualView node = (VirtualView)lNode;
                int count = node.saveAndSetupCanvas(canvas);
                node.render(canvas, paint, 1f);
                node.restoreCanvas(canvas, count);

                if (node.isResponsible() && !mResponsible) {
                    mResponsible = true;
                }
            }
        }
    }

    private RectF getViewBox() {
        return new RectF(mMinX * mScale, mMinY * mScale, (mMinX + mVbWidth) * mScale, (mMinY + mVbHeight) * mScale);
    }

    String toDataURL() {
        Bitmap bitmap = Bitmap.createBitmap(
                getWidth(),
                getHeight(),
                Bitmap.Config.ARGB_8888);

        drawChildren(new Canvas(bitmap));
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
        bitmap.recycle();
        byte[] bitmapBytes = stream.toByteArray();
        return Base64.encodeToString(bitmapBytes, Base64.DEFAULT);
    }

    void enableTouchEvents() {
        if (!mResponsible) {
            mResponsible = true;
        }
    }

    private int hitTest(float touchX, float touchY) {
        if (!mResponsible || !mInvertible) {
            return getId();
        }

        float[] transformed = { touchX, touchY };
        mInvViewBoxMatrix.mapPoints(transformed);

        int count = getChildCount();
        int viewTag = -1;
        for (int i = count - 1; i >= 0; i--) {
            View child = getChildAt(i);
            if (!(child instanceof VirtualView)) {
                continue;
            }

            viewTag = ((VirtualView) child).hitTest(transformed);
            if (viewTag != -1) {
                break;
            }
        }

        return viewTag == -1 ? getId() : viewTag;
    }

    void defineClipPath(VirtualView clipPath, String clipPathRef) {
        mDefinedClipPaths.put(clipPathRef, clipPath);
    }

    VirtualView getDefinedClipPath(String clipPathRef) {
        return mDefinedClipPaths.get(clipPathRef);
    }

    void defineTemplate(VirtualView template, String templateRef) {
        mDefinedTemplates.put(templateRef, template);
    }

    VirtualView getDefinedTemplate(String templateRef) {
        return mDefinedTemplates.get(templateRef);
    }

    void defineBrush(Brush brush, String brushRef) {
        mDefinedBrushes.put(brushRef, brush);
    }

    Brush getDefinedBrush(String brushRef) {
        return mDefinedBrushes.get(brushRef);
    }

    void defineMask(VirtualView mask, String maskRef) {
        mDefinedMasks.put(maskRef, mask);
    }

    VirtualView getDefinedMask(String maskRef) {
        return mDefinedMasks.get(maskRef);
    }
}
