/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi13_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import abi13_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGRectShadowNode extends RNSVGPathShadowNode {

    private String mX;
    private String mY;
    private String mW;
    private String mH;
    private String mRx;
    private String mRy;


    @ReactProp(name = "x")
    public void setX(String x) {
        mX = x;
        markUpdated();
    }

    @ReactProp(name = "y")
    public void setY(String y) {
        mY = y;
        markUpdated();
    }

    @ReactProp(name = "width")
    public void setWidth(String width) {
        mW = width;
        markUpdated();
    }


    @ReactProp(name = "height")
    public void setHeight(String height) {
        mH = height;
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
        float x = PropHelper.fromPercentageToFloat(mX, mCanvasWidth, 0, mScale);
        float y = PropHelper.fromPercentageToFloat(mY, mCanvasHeight, 0, mScale);
        float w = PropHelper.fromPercentageToFloat(mW, mCanvasWidth, 0, mScale);
        float h = PropHelper.fromPercentageToFloat(mH, mCanvasHeight, 0, mScale);
        float rx = PropHelper.fromPercentageToFloat(mRx, mCanvasWidth, 0, mScale);
        float ry = PropHelper.fromPercentageToFloat(mRy, mCanvasHeight, 0, mScale);

        if (rx != 0 || ry != 0) {
            if (rx == 0) {
                rx = ry;
            } else if (ry == 0) {
                ry = rx;
            }

            if (rx > w / 2) {
                rx = w / 2;
            }

            if (ry > h / 2) {
                ry = h / 2;
            }
            path.addRoundRect(new RectF(x, y, x + w, y + h), rx, ry, Path.Direction.CW);
        } else {
            path.addRect(x, y, x + w, y + h, Path.Direction.CW);
        }
        return path;
    }
}
