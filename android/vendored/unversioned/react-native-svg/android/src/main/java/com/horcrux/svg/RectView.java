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
import android.graphics.RectF;
import android.os.Build;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import java.util.ArrayList;

@SuppressLint("ViewConstructor")
class RectView extends RenderableView {
  private SVGLength mX;
  private SVGLength mY;
  private SVGLength mW;
  private SVGLength mH;
  private SVGLength mRx;
  private SVGLength mRy;

  public RectView(ReactContext reactContext) {
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

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    Path path = new Path();
    double x = relativeOnWidth(mX);
    double y = relativeOnHeight(mY);
    double w = relativeOnWidth(mW);
    double h = relativeOnHeight(mH);

    if (mRx != null || mRy != null) {
      double rx = 0d;
      double ry = 0d;
      if (mRx == null) {
        ry = relativeOnHeight(mRy);
        rx = ry;
      } else if (mRy == null) {
        rx = relativeOnWidth(mRx);
        ry = rx;
      } else {
        rx = relativeOnWidth(mRx);
        ry = relativeOnHeight(mRy);
      }

      if (rx > w / 2) {
        rx = w / 2;
      }

      if (ry > h / 2) {
        ry = h / 2;
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        path.addRoundRect(
            (float) x,
            (float) y,
            (float) (x + w),
            (float) (y + h),
            (float) rx,
            (float) ry,
            Path.Direction.CW);
      } else {
        path.addRoundRect(
            new RectF((float) x, (float) y, (float) (x + w), (float) (y + h)),
            (float) rx,
            (float) ry,
            Path.Direction.CW);
      }
    } else {
      path.addRect((float) x, (float) y, (float) (x + w), (float) (y + h), Path.Direction.CW);
      path.close(); // Ensure isSimplePath = false such that rect doesn't become represented using
      // integers
    }

    elements = new ArrayList<>();
    elements.add(
        new PathElement(ElementType.kCGPathElementMoveToPoint, new Point[] {new Point(x, y)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint, new Point[] {new Point(x + w, y)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint, new Point[] {new Point(x + w, y + h)}));
    elements.add(
        new PathElement(
            ElementType.kCGPathElementAddLineToPoint, new Point[] {new Point(x, y + h)}));
    elements.add(
        new PathElement(ElementType.kCGPathElementAddLineToPoint, new Point[] {new Point(x, y)}));

    return path;
  }
}
