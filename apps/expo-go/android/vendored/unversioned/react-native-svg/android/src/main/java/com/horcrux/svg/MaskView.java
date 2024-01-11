/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import android.annotation.SuppressLint;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;

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

  public MaskView(ReactContext reactContext) {
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

  @Override
  void saveDefinition() {
    if (mName != null) {
      SvgView svg = getSvgView();
      svg.defineMask(this, mName);
    }
  }
}
