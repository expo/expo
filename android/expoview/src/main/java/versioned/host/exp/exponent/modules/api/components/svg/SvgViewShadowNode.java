/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.Base64;

import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;

/**
 * Shadow node for RNSVG virtual tree root - RNSVGSvgView
 */
public class SvgViewShadowNode extends LayoutShadowNode {
    private boolean mResponsible = false;

    private final Map<String, VirtualNode> mDefinedClipPaths = new HashMap<>();
    private final Map<String, VirtualNode> mDefinedTemplates = new HashMap<>();
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
    private Matrix mInvViewBoxMatrix = new Matrix();
    private boolean mInvertible = true;


    public SvgViewShadowNode() {
        mScale = DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }

    @ReactProp(name = "minX")
    public void setMinX(float minX) {
        mMinX = minX;
        markUpdated();
    }

    @ReactProp(name = "minY")
    public void setMinY(float minY) {
        mMinY = minY;
        markUpdated();
    }

    @ReactProp(name = "vbWidth")
    public void setVbWidth(float vbWidth) {
        mVbWidth = vbWidth;
        markUpdated();
    }

    @ReactProp(name = "vbHeight")
    public void setVbHeight(float vbHeight) {
        mVbHeight = vbHeight;
        markUpdated();
    }

    @ReactProp(name = "bbWidth")
    public void setVbWidth(String bbWidth) {
        mbbWidth = bbWidth;
        markUpdated();
    }

    @ReactProp(name = "bbHeight")
    public void setVbHeight(String bbHeight) {
        mbbHeight = bbHeight;
        markUpdated();
    }

    @ReactProp(name = "align")
    public void setAlign(String align) {
        mAlign = align;
        markUpdated();
    }

    @ReactProp(name = "meetOrSlice")
    public void setMeetOrSlice(int meetOrSlice) {
        mMeetOrSlice = meetOrSlice;
        markUpdated();
    }

    @Override
    public boolean isVirtual() {
        return false;
    }

    @Override
    public boolean isVirtualAnchor() {
        return false;
    }

    @Override
    public void onCollectExtraUpdates(UIViewOperationQueue uiUpdater) {
        super.onCollectExtraUpdates(uiUpdater);
        uiUpdater.enqueueUpdateExtraData(getReactTag(), drawOutput());
    }

    @Override
    public void setReactTag(int reactTag) {
        super.setReactTag(reactTag);
        SvgViewManager.setShadowNode(this);
    }

    private Object drawOutput() {
        int layoutWidth = (int) getLayoutWidth();
        int layoutHeight = (int) getLayoutHeight();
        if(layoutHeight != 0 && layoutWidth != 0) {
            Bitmap bitmap = Bitmap.createBitmap(
                    layoutWidth,
                    layoutHeight,
                    Bitmap.Config.ARGB_8888);

            drawChildren(new Canvas(bitmap));
            return bitmap;
        }
        return null;
    }

    Rect getCanvasBounds() {
        return mCanvas.getClipBounds();
    }

    void drawChildren(final Canvas canvas) {
        mCanvas = canvas;
        if (mAlign != null) {
            RectF vbRect = getViewBox();
            float width;
            float height;
            boolean nested = getNativeParent() instanceof SvgViewShadowNode;
            if (nested) {
                width = Float.parseFloat(mbbWidth) * mScale;
                height = Float.parseFloat(mbbHeight) * mScale;
            } else {
                width = getLayoutWidth();
                height = getLayoutHeight();
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


        traverseChildren(new VirtualNode.NodeRunnable() {
            public void run(ReactShadowNode node) {
                if (node instanceof VirtualNode) {
                    ((VirtualNode)node).saveDefinition();
                }
            }
        });

        traverseChildren(new VirtualNode.NodeRunnable() {
            public void run(ReactShadowNode lNode) {
                if (lNode instanceof VirtualNode) {
                    VirtualNode node = (VirtualNode)lNode;
                    int count = node.saveAndSetupCanvas(canvas);
                    node.draw(canvas, paint, 1f);
                    node.restoreCanvas(canvas, count);
                    node.markUpdateSeen();

                    if (node.isResponsible() && !mResponsible) {
                        mResponsible = true;
                    }
                } else {
                    lNode.calculateLayout();
                }
            }
        });
    }

    private RectF getViewBox() {
        return new RectF(mMinX * mScale, mMinY * mScale, (mMinX + mVbWidth) * mScale, (mMinY + mVbHeight) * mScale);
    }

    String toDataURL() {
        Bitmap bitmap = Bitmap.createBitmap(
                (int) getLayoutWidth(),
                (int) getLayoutHeight(),
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

    int hitTest(Point point) {
        if (!mResponsible || !mInvertible) {
            return -1;
        }

        float[] transformed = { point.x, point.y };
        mInvViewBoxMatrix.mapPoints(transformed);

        int count = getChildCount();
        int viewTag = -1;
        for (int i = count - 1; i >= 0; i--) {
            if (!(getChildAt(i) instanceof VirtualNode)) {
                continue;
            }

            viewTag = ((VirtualNode) getChildAt(i)).hitTest(transformed);
            if (viewTag != -1) {
                break;
            }
        }

        return viewTag;
    }

    void defineClipPath(VirtualNode clipPath, String clipPathRef) {
        mDefinedClipPaths.put(clipPathRef, clipPath);
    }

    VirtualNode getDefinedClipPath(String clipPathRef) {
        return mDefinedClipPaths.get(clipPathRef);
    }

    void defineTemplate(VirtualNode template, String templateRef) {
        mDefinedTemplates.put(templateRef, template);
    }

    VirtualNode getDefinedTemplate(String templateRef) {
        return mDefinedTemplates.get(templateRef);
    }

    void defineBrush(Brush brush, String brushRef) {
        mDefinedBrushes.put(brushRef, brush);
    }

    Brush getDefinedBrush(String brushRef) {
        return mDefinedBrushes.get(brushRef);
    }

    void traverseChildren(VirtualNode.NodeRunnable runner) {
        for (int i = 0; i < getChildCount(); i++) {
            ReactShadowNode child = getChildAt(i);
            runner.run(child);
        }
    }

}
