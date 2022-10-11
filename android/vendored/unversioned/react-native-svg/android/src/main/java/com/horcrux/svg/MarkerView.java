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
import android.view.View;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;

@SuppressLint("ViewConstructor")
class MarkerView extends GroupView {

  private SVGLength mRefX;
  private SVGLength mRefY;
  private SVGLength mMarkerWidth;
  private SVGLength mMarkerHeight;
  private String mMarkerUnits;
  private String mOrient;

  private float mMinX;
  private float mMinY;
  private float mVbWidth;
  private float mVbHeight;
  String mAlign;
  int mMeetOrSlice;

  Matrix markerTransform = new Matrix();

  public MarkerView(ReactContext reactContext) {
    super(reactContext);
  }

  public void setRefX(Dynamic refX) {
    mRefX = SVGLength.from(refX);
    invalidate();
  }

  public void setRefX(String refX) {
    mRefX = SVGLength.from(refX);
    invalidate();
  }

  public void setRefX(Double refX) {
    mRefX = SVGLength.from(refX);
    invalidate();
  }

  public void setRefY(Dynamic refY) {
    mRefY = SVGLength.from(refY);
    invalidate();
  }

  public void setRefY(String refY) {
    mRefY = SVGLength.from(refY);
    invalidate();
  }

  public void setRefY(Double refY) {
    mRefY = SVGLength.from(refY);
    invalidate();
  }

  public void setMarkerWidth(Dynamic markerWidth) {
    mMarkerWidth = SVGLength.from(markerWidth);
    invalidate();
  }

  public void setMarkerWidth(String markerWidth) {
    mMarkerWidth = SVGLength.from(markerWidth);
    invalidate();
  }

  public void setMarkerWidth(Double markerWidth) {
    mMarkerWidth = SVGLength.from(markerWidth);
    invalidate();
  }

  public void setMarkerHeight(Dynamic markerHeight) {
    mMarkerHeight = SVGLength.from(markerHeight);
    invalidate();
  }

  public void setMarkerHeight(String markerHeight) {
    mMarkerHeight = SVGLength.from(markerHeight);
    invalidate();
  }

  public void setMarkerHeight(Double markerHeight) {
    mMarkerHeight = SVGLength.from(markerHeight);
    invalidate();
  }

  public void setMarkerUnits(String markerUnits) {
    mMarkerUnits = markerUnits;
    invalidate();
  }

  public void setOrient(String orient) {
    mOrient = orient;
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

  @Override
  void saveDefinition() {
    if (mName != null) {
      SvgView svg = getSvgView();
      svg.defineMarker(this, mName);
      for (int i = 0; i < getChildCount(); i++) {
        View node = getChildAt(i);
        if (node instanceof VirtualView) {
          ((VirtualView) node).saveDefinition();
        }
      }
    }
  }

  void renderMarker(
      Canvas canvas, Paint paint, float opacity, RNSVGMarkerPosition position, float strokeWidth) {
    int count = saveAndSetupCanvas(canvas, mCTM);

    markerTransform.reset();
    Point origin = position.origin;
    markerTransform.setTranslate((float) origin.x * mScale, (float) origin.y * mScale);

    double markerAngle = "auto".equals(mOrient) ? -1 : Double.parseDouble(mOrient);
    float degrees = 180 + (float) (markerAngle == -1 ? position.angle : markerAngle);
    markerTransform.preRotate(degrees);

    boolean useStrokeWidth = "strokeWidth".equals(mMarkerUnits);
    if (useStrokeWidth) {
      markerTransform.preScale(strokeWidth, strokeWidth);
    }

    double width = relativeOnWidth(mMarkerWidth) / mScale;
    double height = relativeOnHeight(mMarkerHeight) / mScale;
    RectF eRect = new RectF(0, 0, (float) width, (float) height);
    if (mAlign != null) {
      RectF vbRect =
          new RectF(
              mMinX * mScale,
              mMinY * mScale,
              (mMinX + mVbWidth) * mScale,
              (mMinY + mVbHeight) * mScale);
      Matrix viewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mAlign, mMeetOrSlice);
      float[] values = new float[9];
      viewBoxMatrix.getValues(values);
      markerTransform.preScale(values[Matrix.MSCALE_X], values[Matrix.MSCALE_Y]);
    }

    double x = relativeOnWidth(mRefX);
    double y = relativeOnHeight(mRefY);
    markerTransform.preTranslate((float) -x, (float) -y);

    canvas.concat(markerTransform);

    drawGroup(canvas, paint, opacity);

    restoreCanvas(canvas, count);
  }
}
