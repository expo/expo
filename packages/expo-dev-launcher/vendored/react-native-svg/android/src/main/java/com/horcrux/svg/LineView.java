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

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class LineView extends RenderableView {
    private SVGLength mX1;
    private SVGLength mY1;
    private SVGLength mX2;
    private SVGLength mY2;

    public LineView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "x1")
    public void setX1(Dynamic x1) {
        mX1 = SVGLength.from(x1);
        invalidate();
    }

    @ReactProp(name = "y1")
    public void setY1(Dynamic y1) {
        mY1 = SVGLength.from(y1);
        invalidate();
    }

    @ReactProp(name = "x2")
    public void setX2(Dynamic x2) {
        mX2 = SVGLength.from(x2);
        invalidate();
    }

    @ReactProp(name = "y2")
    public void setY2(Dynamic y2) {
        mY2 = SVGLength.from(y2);
        invalidate();
    }

    @Override
    Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        double x1 = relativeOnWidth(mX1);
        double y1 = relativeOnHeight(mY1);
        double x2 = relativeOnWidth(mX2);
        double y2 = relativeOnHeight(mY2);

        path.moveTo((float) x1, (float) y1);
        path.lineTo((float) x2, (float) y2);
        return path;
    }
}
