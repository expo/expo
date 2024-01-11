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
import android.graphics.Paint;
import android.graphics.Path;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import java.util.ArrayList;

@SuppressLint("ViewConstructor")
class CircleView extends RenderableView {
  private SVGLength mCx;
  private SVGLength mCy;
  private SVGLength mR;

  public CircleView(ReactContext reactContext) {
    super(reactContext);
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

  public void setR(Dynamic r) {
    mR = SVGLength.from(r);
    invalidate();
  }

  public void setR(String r) {
    mR = SVGLength.from(r);
    invalidate();
  }

  public void setR(Double r) {
    mR = SVGLength.from(r);
    invalidate();
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    Path path = new Path();

    double cx = relativeOnWidth(mCx);
    double cy = relativeOnHeight(mCy);
    double r = relativeOnOther(mR);

    path.addCircle((float) cx, (float) cy, (float) r, Path.Direction.CW);

    elements = new ArrayList<>();
    elements.add(
        new PathElement(
            ElementType.kCGPathElementMoveToPoint, new Point[] {new Point(cx, cy - r)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint,
            new Point[] {new Point(cx, cy - r), new Point(cx + r, cy)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint,
            new Point[] {new Point(cx + r, cy), new Point(cx, cy + r)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint,
            new Point[] {new Point(cx, cy + r), new Point(cx - r, cy)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint,
            new Point[] {new Point(cx - r, cy), new Point(cx, cy - r)}));

    return path;
  }
}
