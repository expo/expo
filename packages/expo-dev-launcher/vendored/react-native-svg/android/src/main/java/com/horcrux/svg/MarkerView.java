/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class MarkerView extends GroupView {

    private SVGLength mRefX;
    private SVGLength mRefY;
    private SVGLength mMarkerWidth;
    private SVGLength mMarkerHeight;
    private String mMarkerUnits;
    private String mOrient;

    private float mMinX;
    private float mMinY;
    private float mVbWidth;
    private float mVbHeight;
    String mAlign;
    int mMeetOrSlice;

    Matrix markerTransform = new Matrix();

    public MarkerView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "refX")
    public void setRefX(Dynamic refX) {
        mRefX = SVGLength.from(refX);
        invalidate();
    }

    @ReactProp(name = "refY")
    public void setRefY(Dynamic refY) {
        mRefY = SVGLength.from(refY);
        invalidate();
    }

    @ReactProp(name = "markerWidth")
    public void setMarkerWidth(Dynamic markerWidth) {
        mMarkerWidth = SVGLength.from(markerWidth);
        invalidate();
    }

    @ReactProp(name = "markerHeight")
    public void setMarkerHeight(Dynamic markerHeight) {
        mMarkerHeight = SVGLength.from(markerHeight);
        invalidate();
    }

    @ReactProp(name = "markerUnits")
    public void setMarkerUnits(String markerUnits) {
        mMarkerUnits = markerUnits;
        invalidate();
    }

    @ReactProp(name = "orient")
    public void setOrient(String orient) {
        mOrient = orient;
        invalidate();
    }

    @ReactProp(name = "minX")
    public void setMinX(float minX) {
        mMinX = minX;
        invalidate();
    }

    @ReactProp(name = "minY")
    public void setMinY(float minY) {
        mMinY = minY;
        invalidate();
    }

    @ReactProp(name = "vbWidth")
    public void setVbWidth(float vbWidth) {
        mVbWidth = vbWidth;
        invalidate();
    }

    @ReactProp(name = "vbHeight")
    public void setVbHeight(float vbHeight) {
        mVbHeight = vbHeight;
        invalidate();
    }

    @ReactProp(name = "align")
    public void setAlign(String align) {
        mAlign = align;
        invalidate();
    }

    @ReactProp(name = "meetOrSlice")
    public void setMeetOrSlice(int meetOrSlice) {
        mMeetOrSlice = meetOrSlice;
        invalidate();
    }

    @Override
    void saveDefinition() {
        if (mName != null) {
            SvgView svg = getSvgView();
            svg.defineMarker(this, mName);
            for (int i = 0; i < getChildCount(); i++) {
                View node = getChildAt(i);
                if (node instanceof VirtualView) {
                    ((VirtualView)node).saveDefinition();
                }
            }
        }
    }

    void renderMarker(Canvas canvas, Paint paint, float opacity, RNSVGMarkerPosition position, float strokeWidth) {
        int count = saveAndSetupCanvas(canvas, mCTM);

        markerTransform.reset();
        Point origin = position.origin;
        markerTransform.setTranslate((float)origin.x * mScale, (float)origin.y * mScale);

        double markerAngle = "auto".equals(mOrient) ? -1 : Double.parseDouble(mOrient);
        float degrees = 180 + (float) (markerAngle == -1 ? position.angle : markerAngle);
        markerTransform.preRotate(degrees);

        boolean useStrokeWidth = "strokeWidth".equals(mMarkerUnits);
        if (useStrokeWidth) {
            markerTransform.preScale(strokeWidth, strokeWidth);
        }

        double width = relativeOnWidth(mMarkerWidth) / mScale;
        double height = relativeOnHeight(mMarkerHeight) / mScale;
        RectF eRect = new RectF(0, 0, (float)width, (float)height);
        if (mAlign != null) {
            RectF vbRect = new RectF(mMinX * mScale, mMinY * mScale, (mMinX + mVbWidth) * mScale, (mMinY + mVbHeight) * mScale);
            Matrix viewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mAlign, mMeetOrSlice);
            float[] values = new float[9];
            viewBoxMatrix.getValues(values);
            markerTransform.preScale(values[Matrix.MSCALE_X], values[Matrix.MSCALE_Y]);
        }

        double x = relativeOnWidth(mRefX);
        double y = relativeOnHeight(mRefY);
        markerTransform.preTranslate((float)-x, (float)-y);

        canvas.concat(markerTransform);

        drawGroup(canvas, paint, opacity);

        restoreCanvas(canvas, count);
    }
}
