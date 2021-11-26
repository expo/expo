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
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.os.Build;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class RectView extends RenderableView {
    private SVGLength mX;
    private SVGLength mY;
    private SVGLength mW;
    private SVGLength mH;
    private SVGLength mRx;
    private SVGLength mRy;

    public RectView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "x")
    public void setX(Dynamic x) {
        mX = SVGLength.from(x);
        invalidate();
    }

    @ReactProp(name = "y")
    public void setY(Dynamic y) {
        mY = SVGLength.from(y);
        invalidate();
    }

    @ReactProp(name = "width")
    public void setWidth(Dynamic width) {
        mW = SVGLength.from(width);
        invalidate();
    }

    @ReactProp(name = "height")
    public void setHeight(Dynamic height) {
        mH = SVGLength.from(height);
        invalidate();
    }

    @ReactProp(name = "rx")
    public void setRx(Dynamic rx) {
        mRx = SVGLength.from(rx);
        invalidate();
    }

    @ReactProp(name = "ry")
    public void setRy(Dynamic ry) {
        mRy = SVGLength.from(ry);
        invalidate();
    }

    @Override
    Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        double x = relativeOnWidth(mX);
        double y = relativeOnHeight(mY);
        double w = relativeOnWidth(mW);
        double h = relativeOnHeight(mH);

        if (mRx != null || mRy != null) {
            double rx = 0d;
            double ry = 0d;
            if (mRx == null) {
                ry = relativeOnHeight(mRy);
                rx = ry;
            } else if (mRy == null) {
                rx = relativeOnWidth(mRx);
                ry = rx;
            } else {
                rx = relativeOnWidth(mRx);
                ry = relativeOnHeight(mRy);
            }

            if (rx > w / 2) {
                rx = w / 2;
            }

            if (ry > h / 2) {
                ry = h / 2;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                path.addRoundRect((float) x, (float) y, (float) (x + w), (float) (y + h), (float) rx, (float) ry, Path.Direction.CW);
            } else {
                path.addRoundRect(new RectF((float) x, (float) y, (float) (x + w), (float) (y + h)), (float) rx, (float) ry, Path.Direction.CW);
            }
        } else {
            path.addRect((float) x, (float) y, (float) (x + w), (float) (y + h), Path.Direction.CW);
            path.close(); // Ensure isSimplePath = false such that rect doesn't become represented using integers
        }
        return path;
    }
}
