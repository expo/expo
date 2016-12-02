/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi12_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;

import abi12_0_0.com.facebook.react.bridge.ReadableArray;
import abi12_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGViewBoxShadowNode extends RNSVGGroupShadowNode {

    private static final int MOS_MEET = 0;
    private static final int MOS_SLICE = 1;
    private static final int MOS_NONE = 2;

    private String mMinX;
    private String mMinY;
    private String mVbWidth;
    private String mVbHeight;
    private String mBoxWidth;
    private String mBoxHeight;
    private String mAlign;
    private int mMeetOrSlice;
    private boolean mFromSymbol = false;

    @ReactProp(name = "minX")
    public void setMinX(String minX) {
        mMinX = minX;
        markUpdated();
    }

    @ReactProp(name = "minY")
    public void setMinY(String minY) {
        mMinY = minY;
        markUpdated();
    }

    @ReactProp(name = "vbWidth")
    public void setVbWidth(String vbWidth) {
        mVbWidth = vbWidth;
        markUpdated();
    }

    @ReactProp(name = "vbHeight")
    public void setVbHeight(String vbHeight) {
        mVbHeight = vbHeight;
        markUpdated();
    }


    @ReactProp(name = "width")
    public void setWidth(String width) {
        mBoxWidth = width;
        markUpdated();
    }

    @ReactProp(name = "height")
    public void setHeight(String height) {
        mBoxHeight = height;
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
    public void draw(Canvas canvas, Paint paint, float opacity) {
        setupDimensions(canvas);
        mMatrix = getTransform();
        super.draw(canvas, paint, opacity);
    }

    public Matrix getTransform() {
        // based on https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform

        // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height values of the viewBox attribute respectively.
        float vbX = PropHelper.fromPercentageToFloat(mMinX, mCanvasWidth, 0, mScale);
        float vbY = PropHelper.fromPercentageToFloat(mMinY, mCanvasHeight, 0, mScale);
        float vbWidth = PropHelper.fromPercentageToFloat(mVbWidth, mCanvasWidth, 0, mScale);
        float vbHeight = PropHelper.fromPercentageToFloat(mVbHeight, mCanvasHeight, 0, mScale);

        // Let e-x, e-y, e-width, e-height be the position and size of the element respectively.
        float eX = mCanvasX;
        float eY = mCanvasY;
        float eWidth = mBoxWidth != null ? PropHelper.fromPercentageToFloat(mBoxWidth, mCanvasWidth, 0, mScale) : mCanvasWidth;
        float eHeight = mBoxHeight != null ? PropHelper.fromPercentageToFloat(mBoxHeight, mCanvasHeight, 0, mScale) : mCanvasHeight;

        // Initialize scale-x to e-width/vb-width.
        float scaleX = eWidth / vbWidth;

        // Initialize scale-y to e-height/vb-height.
        float scaleY = eHeight / vbHeight;

        // Initialize translate-x to vb-x - e-x.
        // Initialize translate-y to vb-y - e-y.
        float translateX = vbX - eX;
        float translateY = vbY - eY;

        // If align is 'none'
        if (mMeetOrSlice == MOS_NONE) {
            // Let scale be set the smaller value of scale-x and scale-y.
            // Assign scale-x and scale-y to scale.
            float scale = scaleX = scaleY = Math.min(scaleX, scaleY);

            // If scale is greater than 1
            if (scale > 1) {
                // Minus translateX by (eWidth / scale - vbWidth) / 2
                // Minus translateY by (eHeight / scale - vbHeight) / 2
                translateX -= (eWidth / scale - vbWidth) / 2;
                translateY -= (eHeight / scale - vbHeight) / 2;
            } else {
                translateX -= (eWidth - vbWidth * scale) / 2;
                translateY -= (eHeight - vbHeight * scale) / 2;
            }
        } else {
// If align is not 'none' and meetOrSlice is 'meet', set the larger of scale-x and scale-y to the smaller.
            // Otherwise, if align is not 'none' and meetOrSlice is 'slice', set the smaller of scale-x and scale-y to the larger.

            if (!mAlign.equals("none") && mMeetOrSlice == MOS_MEET) {
                scaleX = scaleY = Math.min(scaleX, scaleY);
            } else if (!mAlign.equals("none") && mMeetOrSlice == MOS_SLICE) {
                scaleX = scaleY = Math.max(scaleX, scaleY);
            }

            // If align contains 'xMid', minus (e-width / scale-x - vb-width) / 2 from transform-x.
            if (mAlign.contains("xMid")) {
                translateX -= (eWidth / scaleX - vbWidth) / 2;
            }

            // If align contains 'xMax', minus (e-width / scale-x - vb-width) from transform-x.
            if (mAlign.contains("xMax")) {
                translateX -= eWidth / scaleX - vbWidth;
            }

            // If align contains 'yMid', minus (e-height / scale-y - vb-height) / 2 from transform-y.
            if (mAlign.contains("YMid")) {
                translateY -= (eHeight / scaleY - vbHeight) / 2;
            }

            // If align contains 'yMax', minus (e-height / scale-y - vb-height) from transform-y.
            if (mAlign.contains("YMax")) {
                translateY -= eHeight / scaleY - vbHeight;
            }

        }

        // The transform applied to content contained by the element is given by
        // translate(translate-x, translate-y) scale(scale-x, scale-y).
        Matrix transform = new Matrix();
        transform.postTranslate(-translateX * (mFromSymbol ? scaleX : 1), -translateY * (mFromSymbol ? scaleY : 1));
        transform.postScale(scaleX, scaleY);
        return transform;
    }

    @Override
    public void mergeProperties(RNSVGVirtualNode target, ReadableArray mergeList) {
        if (target instanceof RNSVGUseShadowNode) {
            mFromSymbol = true;
            mBoxWidth = ((RNSVGUseShadowNode)target).getWidth();
            mBoxHeight = ((RNSVGUseShadowNode)target).getHeight();
        }
    }

    @Override
    public void resetProperties() {
        mBoxWidth = mBoxHeight = null;
        mFromSymbol = false;
    }
}
