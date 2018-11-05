/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;


import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Circle view
 */
class CircleShadowNode extends RenderableShadowNode {

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

        double cx = relativeOnWidth(mCx);
        double cy = relativeOnHeight(mCy);

        double r;
        if (PropHelper.isPercentage(mR)) {
            r = relativeOnOther(mR);
        } else {
            r = Double.parseDouble(mR) * mScale;
        }

        path.addCircle((float) cx, (float) cy, (float) r, Path.Direction.CW);
        return path;
    }
}
