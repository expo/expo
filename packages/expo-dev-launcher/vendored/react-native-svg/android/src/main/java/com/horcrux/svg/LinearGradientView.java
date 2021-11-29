/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Matrix;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class LinearGradientView extends DefinitionView {

    private SVGLength mX1;
    private SVGLength mY1;
    private SVGLength mX2;
    private SVGLength mY2;
    private ReadableArray mGradient;
    private Brush.BrushUnits mGradientUnits;

    private static final float[] sRawMatrix = new float[]{
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    };
    private Matrix mMatrix = null;

    public LinearGradientView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "x1")
    public void setX1(Dynamic x1) {
        mX1 = SVGLength.from(x1);
        invalidate();
    }

    @ReactProp(name = "y1")
    public void setY1(Dynamic y1) {
        mY1 = SVGLength.from(y1);
        invalidate();
    }

    @ReactProp(name = "x2")
    public void setX2(Dynamic x2) {
        mX2 = SVGLength.from(x2);
        invalidate();
    }

    @ReactProp(name = "y2")
    public void setY2(Dynamic y2) {
        mY2 = SVGLength.from(y2);
        invalidate();
    }

    @ReactProp(name = "gradient")
    public void setGradient(ReadableArray gradient) {
        mGradient = gradient;
        invalidate();
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
        invalidate();
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

        invalidate();
    }

    @Override
    void saveDefinition() {
        if (mName != null) {
            SVGLength[] points = new SVGLength[]{mX1, mY1, mX2, mY2};
            Brush brush = new Brush(Brush.BrushType.LINEAR_GRADIENT, points, mGradientUnits);
            brush.setGradientColors(mGradient);
            if (mMatrix != null) {
                brush.setGradientTransform(mMatrix);
            }

            SvgView svg = getSvgView();
            if (mGradientUnits == Brush.BrushUnits.USER_SPACE_ON_USE) {
                brush.setUserSpaceBoundingBox(svg.getCanvasBounds());
            }

            svg.defineBrush(brush, mName);
        }
    }
}
