/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi18_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import abi18_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Rect view
 */
public class RectShadowNode extends RenderableShadowNode {

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
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();
        float x = relativeOnWidth(mX);
        float y = relativeOnHeight(mY);
        float w = relativeOnWidth(mW);
        float h = relativeOnHeight(mH);
        float rx = relativeOnWidth(mRx);
        float ry = relativeOnHeight(mRy);

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
