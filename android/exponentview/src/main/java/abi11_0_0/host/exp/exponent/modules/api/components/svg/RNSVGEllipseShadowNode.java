/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi11_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

import abi11_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGEllipseShadowNode extends RNSVGPathShadowNode {

    private String mCx;
    private String mCy;
    private String mRx;
    private String mRy;

    @ReactProp(name = "cx")
    public void setCx(String cx) {
        mCx = cx;
        markUpdated();
    }

    @ReactProp(name = "cy")
    public void setCy(String cy) {
        mCy = cy;
        markUpdated();
    }

    @ReactProp(name = "rx")
    public void setRx(String rx) {
        mRx = rx;
        markUpdated();
    }

    @ReactProp(name = "ry")
    public void setRy(String ry) {
        mRy = ry;
        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        mPath = getPath(canvas, paint);
        super.draw(canvas, paint, opacity);
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        float cx = PropHelper.fromPercentageToFloat(mCx, mCanvasWidth, 0, mScale);
        float cy = PropHelper.fromPercentageToFloat(mCy, mCanvasHeight, 0, mScale);
        float rx = PropHelper.fromPercentageToFloat(mRx, mCanvasWidth, 0, mScale);
        float ry = PropHelper.fromPercentageToFloat(mRy, mCanvasHeight, 0, mScale);
        RectF oval = new RectF(cx - rx, cy - ry, cx + rx, cy + ry);
        path.addOval(oval, Path.Direction.CW);

        return path;
    }
}
