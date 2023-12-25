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
import android.graphics.RectF;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class PatternView extends GroupView {

  private SVGLength mX;
  private SVGLength mY;
  private SVGLength mW;
  private SVGLength mH;
  private Brush.BrushUnits mPatternUnits;
  private Brush.BrushUnits mPatternContentUnits;

  private float mMinX;
  private float mMinY;
  private float mVbWidth;
  private float mVbHeight;
  String mAlign;
  int mMeetOrSlice;

  private static final float[] sRawMatrix =
      new float[] {
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      };
  private Matrix mMatrix = null;

  public PatternView(ReactContext reactContext) {
    super(reactContext);
  }

  public void setX(Dynamic x) {
    mX = SVGLength.from(x);
    invalidate();
  }

  public void setX(String x) {
    mX = SVGLength.from(x);
    invalidate();
  }

  public void setX(Double x) {
    mX = SVGLength.from(x);
    invalidate();
  }

  public void setY(Dynamic y) {
    mY = SVGLength.from(y);
    invalidate();
  }

  public void setY(String y) {
    mY = SVGLength.from(y);
    invalidate();
  }

  public void setY(Double y) {
    mY = SVGLength.from(y);
    invalidate();
  }

  public void setWidth(Dynamic width) {
    mW = SVGLength.from(width);
    invalidate();
  }

  public void setWidth(String width) {
    mW = SVGLength.from(width);
    invalidate();
  }

  public void setWidth(Double width) {
    mW = SVGLength.from(width);
    invalidate();
  }

  public void setHeight(Dynamic height) {
    mH = SVGLength.from(height);
    invalidate();
  }

  public void setHeight(String height) {
    mH = SVGLength.from(height);
    invalidate();
  }

  public void setHeight(Double height) {
    mH = SVGLength.from(height);
    invalidate();
  }

  public void setPatternUnits(int patternUnits) {
    switch (patternUnits) {
      case 0:
        mPatternUnits = Brush.BrushUnits.OBJECT_BOUNDING_BOX;
        break;
      case 1:
        mPatternUnits = Brush.BrushUnits.USER_SPACE_ON_USE;
        break;
    }
    invalidate();
  }

  public void setPatternContentUnits(int patternContentUnits) {
    switch (patternContentUnits) {
      case 0:
        mPatternContentUnits = Brush.BrushUnits.OBJECT_BOUNDING_BOX;
        break;
      case 1:
        mPatternContentUnits = Brush.BrushUnits.USER_SPACE_ON_USE;
        break;
    }
    invalidate();
  }

  public void setPatternTransform(@Nullable ReadableArray matrixArray) {
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

  public void setMinX(float minX) {
    mMinX = minX;
    invalidate();
  }

  public void setMinY(float minY) {
    mMinY = minY;
    invalidate();
  }

  public void setVbWidth(float vbWidth) {
    mVbWidth = vbWidth;
    invalidate();
  }

  public void setVbHeight(float vbHeight) {
    mVbHeight = vbHeight;
    invalidate();
  }

  public void setAlign(String align) {
    mAlign = align;
    invalidate();
  }

  public void setMeetOrSlice(int meetOrSlice) {
    mMeetOrSlice = meetOrSlice;
    invalidate();
  }

  RectF getViewBox() {
    return new RectF(
        mMinX * mScale, mMinY * mScale, (mMinX + mVbWidth) * mScale, (mMinY + mVbHeight) * mScale);
  }

  @Override
  void saveDefinition() {
    if (mName != null) {
      SVGLength[] points = new SVGLength[] {mX, mY, mW, mH};
      Brush brush = new Brush(Brush.BrushType.PATTERN, points, mPatternUnits);
      brush.setContentUnits(mPatternContentUnits);
      brush.setPattern(this);

      if (mMatrix != null) {
        brush.setGradientTransform(mMatrix);
      }

      SvgView svg = getSvgView();
      if (mPatternUnits == Brush.BrushUnits.USER_SPACE_ON_USE
          || mPatternContentUnits == Brush.BrushUnits.USER_SPACE_ON_USE) {
        brush.setUserSpaceBoundingBox(svg.getCanvasBounds());
      }

      svg.defineBrush(brush, mName);
    }
  }
}
