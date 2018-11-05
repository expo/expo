/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi24_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

import abi24_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Ellipse view
 */
public class EllipseShadowNode extends RenderableShadowNode {

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
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        float cx = relativeOnWidth(mCx);
        float cy = relativeOnHeight(mCy);
        float rx = relativeOnWidth(mRx);
        float ry = relativeOnHeight(mRy);
        RectF oval = new RectF(cx - rx, cy - ry, cx + rx, cy + ry);
        path.addOval(oval, Path.Direction.CW);

        return path;
    }
}
