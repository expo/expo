/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi14_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Point;
import android.util.Base64;
import android.util.SparseArray;
import android.graphics.Color;
import android.view.Surface;
import android.graphics.PorterDuff;
import abi14_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi14_0_0.com.facebook.react.uimanager.UIViewOperationQueue;

import javax.annotation.Nullable;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Shadow node for RNSVG virtual tree root - RNSVGSvgView
 */
public class RNSVGSvgViewShadowNode extends LayoutShadowNode {

    private static final SparseArray<RNSVGSvgViewShadowNode> mTagToShadowNode = new SparseArray<>();

    public static RNSVGSvgViewShadowNode getShadowNodeByTag(int tag) {
        return mTagToShadowNode.get(tag);
    }

    private boolean mResponsible = false;
    private static final Map<String, RNSVGVirtualNode> mDefinedClipPaths = new HashMap<>();
    private static final Map<String, RNSVGVirtualNode> mDefinedTemplates = new HashMap<>();
    private static final Map<String, PropHelper.RNSVGBrush> mDefinedBrushes = new HashMap<>();

    @Override
    public boolean isVirtual() {
        return false;
    }

    @Override
    public boolean isVirtualAnchor() {
        return true;
    }

    @Override
    public void onCollectExtraUpdates(UIViewOperationQueue uiUpdater) {
        super.onCollectExtraUpdates(uiUpdater);
        uiUpdater.enqueueUpdateExtraData(getReactTag(), drawOutput());

    }

    @Override
    public void setReactTag(int reactTag) {
        super.setReactTag(reactTag);
        mTagToShadowNode.put(getReactTag(), this);
    }

    public Object drawOutput() {
        Bitmap bitmap = Bitmap.createBitmap(
                (int) getLayoutWidth(),
                (int) getLayoutHeight(),
                Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(bitmap);
        drawChildren(canvas);
        return bitmap;
    }

    private void drawChildren(Canvas canvas) {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        Paint paint = new Paint();

        for (int i = 0; i < getChildCount(); i++) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            RNSVGVirtualNode child = (RNSVGVirtualNode) getChildAt(i);
            child.setupDimensions(canvas);
            child.saveDefinition();
            child.draw(canvas, paint, 1f);
            child.markUpdateSeen();

            if (child.isResponsible() && !mResponsible) {
                mResponsible = true;
            }
        }
    }

    public String getBase64() {
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

    public void enableTouchEvents() {
        if (!mResponsible) {
            mResponsible = true;
        }
    }

    public int hitTest(Point point) {
        if (!mResponsible) {
            return -1;
        }

        int count = getChildCount();
        int viewTag = -1;
        for (int i = count - 1; i >= 0; i--) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            viewTag = ((RNSVGVirtualNode) getChildAt(i)).hitTest(point);
            if (viewTag != -1) {
                break;
            }
        }

        return viewTag;
    }

    public void defineClipPath(RNSVGVirtualNode clipPath, String clipPathRef) {
        mDefinedClipPaths.put(clipPathRef, clipPath);
    }

    public RNSVGVirtualNode getDefinedClipPath(String clipPathRef) {
        return mDefinedClipPaths.get(clipPathRef);
    }

    public void defineTemplate(RNSVGVirtualNode template, String templateRef) {
        mDefinedTemplates.put(templateRef, template);
    }

    public RNSVGVirtualNode getDefinedTemplate(String templateRef) {
        return mDefinedTemplates.get(templateRef);
    }

    public void defineBrush(PropHelper.RNSVGBrush brush, String brushRef) {
        mDefinedBrushes.put(brushRef, brush);
    }

    public PropHelper.RNSVGBrush getDefinedBrush(String brushRef) {
        return mDefinedBrushes.get(brushRef);
    }

    public void finalize() {
        mTagToShadowNode.remove(getReactTag());
    }
}
