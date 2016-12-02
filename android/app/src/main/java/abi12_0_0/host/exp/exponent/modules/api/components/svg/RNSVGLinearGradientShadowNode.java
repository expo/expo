/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi12_0_0.host.exp.exponent.modules.api.components.svg;

import abi12_0_0.com.facebook.react.bridge.JavaOnlyArray;
import abi12_0_0.com.facebook.react.bridge.ReadableArray;
import abi12_0_0.com.facebook.react.bridge.WritableArray;
import abi12_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual LinearGradient definition view
 */
public class RNSVGLinearGradientShadowNode extends RNSVGDefinitionShadowNode {

    private String mX1;
    private String mY1;
    private String mX2;
    private String mY2;
    private ReadableArray mGradient;

    @ReactProp(name = "x1")
    public void setX1(String x1) {
        mX1 = x1;
        markUpdated();
    }

    @ReactProp(name = "y1")
    public void setCx(String y1) {
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

    @Override
    protected void saveDefinition() {
        if (mName != null) {
            WritableArray points = new JavaOnlyArray();
            points.pushString(mX1);
            points.pushString(mY1);
            points.pushString(mX2);
            points.pushString(mY2);

            PropHelper.RNSVGBrush brush = new PropHelper.RNSVGBrush(PropHelper.RNSVGBrush.GradientType.LINEAR_GRADIENT, points, mGradient);
            getSvgShadowNode().defineBrush(brush, mName);
        }
    }
}
