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
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class RadialGradientView extends DefinitionView {
  private SVGLength mFx;
  private SVGLength mFy;
  private SVGLength mRx;
  private SVGLength mRy;
  private SVGLength mCx;
  private SVGLength mCy;
  private ReadableArray mGradient;
  private Brush.BrushUnits mGradientUnits;

  private static final float[] sRawMatrix =
      new float[] {
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      };
  private Matrix mMatrix = null;

  public RadialGradientView(ReactContext reactContext) {
    super(reactContext);
  }

  public void setFx(Dynamic fx) {
    mFx = SVGLength.from(fx);
    invalidate();
  }

  public void setFx(String fx) {
    mFx = SVGLength.from(fx);
    invalidate();
  }

  public void setFx(Double fx) {
    mFx = SVGLength.from(fx);
    invalidate();
  }

  public void setFy(Dynamic fy) {
    mFy = SVGLength.from(fy);
    invalidate();
  }

  public void setFy(String fy) {
    mFy = SVGLength.from(fy);
    invalidate();
  }

  public void setFy(Double fy) {
    mFy = SVGLength.from(fy);
    invalidate();
  }

  public void setRx(Dynamic rx) {
    mRx = SVGLength.from(rx);
    invalidate();
  }

  public void setRx(String rx) {
    mRx = SVGLength.from(rx);
    invalidate();
  }

  public void setRx(Double rx) {
    mRx = SVGLength.from(rx);
    invalidate();
  }

  public void setRy(Dynamic ry) {
    mRy = SVGLength.from(ry);
    invalidate();
  }

  public void setRy(String ry) {
    mRy = SVGLength.from(ry);
    invalidate();
  }

  public void setRy(Double ry) {
    mRy = SVGLength.from(ry);
    invalidate();
  }

  public void setCx(Dynamic cx) {
    mCx = SVGLength.from(cx);
    invalidate();
  }

  public void setCx(String cx) {
    mCx = SVGLength.from(cx);
    invalidate();
  }

  public void setCx(Double cx) {
    mCx = SVGLength.from(cx);
    invalidate();
  }

  public void setCy(Dynamic cy) {
    mCy = SVGLength.from(cy);
    invalidate();
  }

  public void setCy(String cy) {
    mCy = SVGLength.from(cy);
    invalidate();
  }

  public void setCy(Double cy) {
    mCy = SVGLength.from(cy);
    invalidate();
  }

  public void setGradient(ReadableArray gradient) {
    mGradient = gradient;
    invalidate();
  }

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
      SVGLength[] points = new SVGLength[] {mFx, mFy, mRx, mRy, mCx, mCy};
      Brush brush = new Brush(Brush.BrushType.RADIAL_GRADIENT, points, mGradientUnits);
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
