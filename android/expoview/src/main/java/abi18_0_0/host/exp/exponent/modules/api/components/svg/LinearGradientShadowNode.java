/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi18_0_0.host.exp.exponent.modules.api.components.svg;

import abi18_0_0.com.facebook.react.bridge.Arguments;
import abi18_0_0.com.facebook.react.bridge.ReadableArray;
import abi18_0_0.com.facebook.react.bridge.WritableArray;
import abi18_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual LinearGradient definition view
 */
public class LinearGradientShadowNode extends DefinitionShadowNode {

    private String mX1;
    private String mY1;
    private String mX2;
    private String mY2;
    private ReadableArray mGradient;
    private Brush.BrushUnits mGradientUnits;

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

    @ReactProp(name = "gradient")
    public void setGradient(ReadableArray gradient) {
        mGradient = gradient;
        markUpdated();
    }

    @ReactProp(name = "gradientUnits")
    public void setGradientUnits(int gradientUnits) {
        switch (gradientUnits) {
            case 0:
                mGradientUnits = Brush.BrushUnits.OBJECT_BOUNDING_BOX;
                break;
            case 1:
                mGradientUnits = Brush.BrushUnits.USER_SPACE_ON_USE;
                break;
        }
        markUpdated();
    }

    @Override
    protected void saveDefinition() {
        if (mName != null) {
            WritableArray points = Arguments.createArray();
            points.pushString(mX1);
            points.pushString(mY1);
            points.pushString(mX2);
            points.pushString(mY2);

            Brush brush = new Brush(Brush.BrushType.LINEAR_GRADIENT, points, mGradientUnits);
            brush.setGradientColors(mGradient);

            SvgViewShadowNode svg = getSvgShadowNode();
            if (mGradientUnits == Brush.BrushUnits.USER_SPACE_ON_USE) {
                brush.setUserSpaceBoundingBox(svg.getCanvasBounds());
            }

            svg.defineBrush(brush, mName);
        }
    }
}
