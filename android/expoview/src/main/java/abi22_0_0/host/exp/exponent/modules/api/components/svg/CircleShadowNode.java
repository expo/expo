/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi22_0_0.host.exp.exponent.modules.api.components.svg;


import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import abi22_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Circle view
 */
public class CircleShadowNode extends RenderableShadowNode {

    private String mCx;
    private String mCy;
    private String mR;

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

    @ReactProp(name = "r")
    public void setR(String r) {
        mR = r;
        markUpdated();
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();

        float cx = relativeOnWidth(mCx);
        float cy = relativeOnHeight(mCy);

        float r;
        if (PropHelper.isPercentage(mR)) {
            r = PropHelper.fromPercentageToFloat(mR, 1, 0, 1);
            float powX = (float)Math.pow((getCanvasWidth() * r), 2);
            float powY = (float)Math.pow((getCanvasHeight() * r), 2);
            r = (float)Math.sqrt(powX + powY) / (float)Math.sqrt(2);
        } else {
            r =  Float.parseFloat(mR) * mScale;
        }

        path.addCircle(cx, cy, r, Path.Direction.CW);
        return path;
    }
}
