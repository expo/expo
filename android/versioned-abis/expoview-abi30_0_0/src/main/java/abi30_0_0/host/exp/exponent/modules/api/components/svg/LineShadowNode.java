/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Line view
 */
class LineShadowNode extends RenderableShadowNode {

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
    protected Path getPath(Canvas canvas, Paint paint) {
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
