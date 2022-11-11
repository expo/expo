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
import android.graphics.Path;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;

@SuppressLint("ViewConstructor")
class UseView extends RenderableView {
  private String mHref;
  private SVGLength mX;
  private SVGLength mY;
  private SVGLength mW;
  private SVGLength mH;

  public UseView(ReactContext reactContext) {
    super(reactContext);
  }

  public void setHref(String href) {
    mHref = href;
    invalidate();
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

  @Override
  void draw(Canvas canvas, Paint paint, float opacity) {
    VirtualView template = getSvgView().getDefinedTemplate(mHref);

    if (template == null) {
      FLog.w(
          ReactConstants.TAG,
          "`Use` element expected a pre-defined svg template as `href` prop, "
              + "template named: "
              + mHref
              + " is not defined.");
      return;
    }

    template.clearCache();
    canvas.translate((float) relativeOnWidth(mX), (float) relativeOnHeight(mY));
    if (template instanceof RenderableView) {
      ((RenderableView) template).mergeProperties(this);
    }

    int count = template.saveAndSetupCanvas(canvas, mCTM);
    clip(canvas, paint);

    if (template instanceof SymbolView) {
      SymbolView symbol = (SymbolView) template;
      symbol.drawSymbol(
          canvas, paint, opacity, (float) relativeOnWidth(mW), (float) relativeOnHeight(mH));
    } else {
      template.draw(canvas, paint, opacity * mOpacity);
    }

    this.setClientRect(template.getClientRect());

    template.restoreCanvas(canvas, count);
    if (template instanceof RenderableView) {
      ((RenderableView) template).resetProperties();
    }
  }

  @Override
  int hitTest(float[] src) {
    if (!mInvertible || !mTransformInvertible) {
      return -1;
    }

    float[] dst = new float[2];
    mInvMatrix.mapPoints(dst, src);
    mInvTransform.mapPoints(dst);

    VirtualView template = getSvgView().getDefinedTemplate(mHref);
    if (template == null) {
      FLog.w(
          ReactConstants.TAG,
          "`Use` element expected a pre-defined svg template as `href` prop, "
              + "template named: "
              + mHref
              + " is not defined.");
      return -1;
    }

    int hitChild = template.hitTest(dst);
    if (hitChild != -1) {
      return (template.isResponsible() || hitChild != template.getId()) ? hitChild : getId();
    }

    return -1;
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    VirtualView template = getSvgView().getDefinedTemplate(mHref);
    if (template == null) {
      FLog.w(
          ReactConstants.TAG,
          "`Use` element expected a pre-defined svg template as `href` prop, "
              + "template named: "
              + mHref
              + " is not defined.");
      return null;
    }
    Path path = template.getPath(canvas, paint);
    Path use = new Path();
    Matrix m = new Matrix();
    m.setTranslate((float) relativeOnWidth(mX), (float) relativeOnHeight(mY));
    path.transform(m, use);
    return use;
  }
}
