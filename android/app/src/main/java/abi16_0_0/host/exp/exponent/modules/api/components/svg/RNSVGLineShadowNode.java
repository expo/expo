/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi16_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import abi16_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGLineShadowNode extends RNSVGPathShadowNode {

    private String mX1;
    private String mY1;
    private String mX2;
    private String mY2;

    @ReactProp(name = "x1")
    public void setX1(String x1) {
        mX1 = x1;
        markUpdated();
    }

    @ReactProp(name = "y1")
    public void setY1(String y1) {
        mY1 = y1;
        markUpdated();
    }

    @ReactProp(name = "x2")
    public void setX2(String x2) {
        mX2 = x2;
        markUpdated();
    }

    @ReactProp(name = "y2")
    public void setY2(String y2) {
        mY2 = y2;
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
        float x1 = PropHelper.fromPercentageToFloat(mX1, mCanvasWidth, 0, mScale);
        float y1 = PropHelper.fromPercentageToFloat(mY1, mCanvasHeight, 0, mScale);
        float x2 = PropHelper.fromPercentageToFloat(mX2, mCanvasWidth, 0, mScale);
        float y2 = PropHelper.fromPercentageToFloat(mY2, mCanvasHeight, 0, mScale);

        path.moveTo(x1, y1);
        path.lineTo(x2, y2);
        return path;
    }
}
