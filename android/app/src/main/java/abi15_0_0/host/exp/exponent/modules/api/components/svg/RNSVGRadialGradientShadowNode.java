/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi15_0_0.host.exp.exponent.modules.api.components.svg;

import abi15_0_0.com.facebook.react.bridge.JavaOnlyArray;
import abi15_0_0.com.facebook.react.bridge.ReadableArray;
import abi15_0_0.com.facebook.react.bridge.WritableArray;
import abi15_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual LinearGradient definition view
 */
public class RNSVGRadialGradientShadowNode extends RNSVGDefinitionShadowNode {
    private String mFx;
    private String mFy;
    private String mRx;
    private String mRy;
    private String mCx;
    private String mCy;
    private ReadableArray mGradient;

    @ReactProp(name = "fx")
    public void setFX(String fx) {
        mFx = fx;
        markUpdated();
    }

    @ReactProp(name = "fy")
    public void setFy(String fy) {
        mFy = fy;
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

    @ReactProp(name = "gradient")
    public void setGradient(ReadableArray gradient) {
        mGradient = gradient;
        markUpdated();
    }

    @Override
    protected void saveDefinition() {
        if (mName != null) {
            WritableArray points = new JavaOnlyArray();
            points.pushString(mFx);
            points.pushString(mFy);
            points.pushString(mRx);
            points.pushString(mRy);
            points.pushString(mCx);
            points.pushString(mCy);

            PropHelper.RNSVGBrush brush = new PropHelper.RNSVGBrush(PropHelper.RNSVGBrush.GradientType.RADIAL_GRADIENT, points, mGradient);
            getSvgShadowNode().defineBrush(brush, mName);
        }
    }
}
