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

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class EllipseView extends RenderableView {
    private SVGLength mCx;
    private SVGLength mCy;
    private SVGLength mRx;
    private SVGLength mRy;

    public EllipseView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "cx")
    public void setCx(Dynamic cx) {
        mCx = SVGLength.from(cx);
        invalidate();
    }

    @ReactProp(name = "cy")
    public void setCy(Dynamic cy) {
        mCy = SVGLength.from(cy);
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
        double cx = relativeOnWidth(mCx);
        double cy = relativeOnHeight(mCy);
        double rx = relativeOnWidth(mRx);
        double ry = relativeOnHeight(mRy);
        RectF oval = new RectF((float) (cx - rx), (float) (cy - ry), (float) (cx + rx), (float) (cy + ry));
        path.addOval(oval, Path.Direction.CW);

        return path;
    }
}
