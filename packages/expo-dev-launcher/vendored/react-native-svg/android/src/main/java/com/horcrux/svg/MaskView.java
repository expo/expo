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
class MaskView extends GroupView {

    SVGLength mX;
    SVGLength mY;
    SVGLength mW;
    SVGLength mH;

    // TODO implement proper support for units
    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private Brush.BrushUnits mMaskUnits;
    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private Brush.BrushUnits mMaskContentUnits;

    private static final float[] sRawMatrix = new float[]{
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    };
    private Matrix mMatrix = null;

    public MaskView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "x")
    public void setX(Dynamic x) {
        mX = SVGLength.from(x);
        invalidate();
    }

    @ReactProp(name = "y")
    public void setY(Dynamic y) {
        mY = SVGLength.from(y);
        invalidate();
    }

    @ReactProp(name = "width")
    public void setWidth(Dynamic width) {
        mW = SVGLength.from(width);
        invalidate();
    }

    @ReactProp(name = "height")
    public void setHeight(Dynamic height) {
        mH = SVGLength.from(height);
        invalidate();
    }

    @ReactProp(name = "maskUnits")
    public void setMaskUnits(int maskUnits) {
        switch (maskUnits) {
            case 0:
                mMaskUnits = Brush.BrushUnits.OBJECT_BOUNDING_BOX;
                break;
            case 1:
                mMaskUnits = Brush.BrushUnits.USER_SPACE_ON_USE;
                break;
        }
        invalidate();
    }

    @ReactProp(name = "maskContentUnits")
    public void setMaskContentUnits(int maskContentUnits) {
        switch (maskContentUnits) {
            case 0:
                mMaskContentUnits = Brush.BrushUnits.OBJECT_BOUNDING_BOX;
                break;
            case 1:
                mMaskContentUnits = Brush.BrushUnits.USER_SPACE_ON_USE;
                break;
        }
        invalidate();
    }

    @ReactProp(name = "maskTransform")
    public void setMaskTransform(@Nullable ReadableArray matrixArray) {
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
            SvgView svg = getSvgView();
            svg.defineMask(this, mName);
        }
    }
}
