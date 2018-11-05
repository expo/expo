/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Matrix;

import com.facebook.common.logging.FLog;
import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.bridge.WritableArray;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi30_0_0.com.facebook.react.common.ReactConstants;

import javax.annotation.Nullable;

/**
 * Shadow node for virtual RadialGradient definition view
 */
class RadialGradientShadowNode extends DefinitionShadowNode {
    private String mFx;
    private String mFy;
    private String mRx;
    private String mRy;
    private String mCx;
    private String mCy;
    private ReadableArray mGradient;
    private Brush.BrushUnits mGradientUnits;

    private static final float[] sRawMatrix = new float[]{
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    };
    private Matrix mMatrix = null;

    @ReactProp(name = "fx")
    public void setFx(String fx) {
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

    @ReactProp(name = "gradientTransform")
    public void setGradientTransform(@Nullable ReadableArray matrixArray) {
        if (matrixArray != null) {
            int matrixSize = PropHelper.toMatrixData(matrixArray, sRawMatrix, mScale);
            if (matrixSize == 6) {
                if (mMatrix == null) {
                    mMatrix = new Matrix();
                }
                mMatrix.setValues(sRawMatrix);
            } else if (matrixSize != -1) {
                FLog.w(ReactConstants.TAG, "RNSVG: Transform matrices must be of size 6");
            }
        } else {
            mMatrix = null;
        }

        markUpdated();
    }

    @Override
    protected void saveDefinition() {
        if (mName != null) {
            WritableArray points = Arguments.createArray();
            points.pushString(mFx);
            points.pushString(mFy);
            points.pushString(mRx);
            points.pushString(mRy);
            points.pushString(mCx);
            points.pushString(mCy);

            Brush brush = new Brush(Brush.BrushType.RADIAL_GRADIENT, points, mGradientUnits);
            brush.setGradientColors(mGradient);
            if (mMatrix != null) {
                brush.setGradientTransform(mMatrix);
            }

            SvgViewShadowNode svg = getSvgShadowNode();
            if (mGradientUnits == Brush.BrushUnits.USER_SPACE_ON_USE) {
                brush.setUserSpaceBoundingBox(svg.getCanvasBounds());
            }

            svg.defineBrush(brush, mName);
        }
    }
}
