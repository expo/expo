/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import com.facebook.react.bridge.ReactContext;

@SuppressLint("ViewConstructor")
class SymbolView extends GroupView {

  private float mMinX;
  private float mMinY;
  private float mVbWidth;
  private float mVbHeight;
  private String mAlign;
  private int mMeetOrSlice;

  public SymbolView(ReactContext reactContext) {
    super(reactContext);
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

  @Override
  void draw(Canvas canvas, Paint paint, float opacity) {
    saveDefinition();
  }

  void drawSymbol(Canvas canvas, Paint paint, float opacity, float width, float height) {
    if (mAlign != null) {
      RectF vbRect =
          new RectF(
              mMinX * mScale,
              mMinY * mScale,
              (mMinX + mVbWidth) * mScale,
              (mMinY + mVbHeight) * mScale);
      RectF eRect = new RectF(0, 0, width, height);
      Matrix viewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mAlign, mMeetOrSlice);
      canvas.concat(viewBoxMatrix);
      super.draw(canvas, paint, opacity);
    }
  }
}
