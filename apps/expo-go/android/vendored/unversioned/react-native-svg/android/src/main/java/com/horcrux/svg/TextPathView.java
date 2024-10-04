/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import static com.horcrux.svg.TextProperties.*;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class TextPathView extends TextView {

  private String mHref;
  private TextPathSide mSide;
  private TextPathMidLine mMidLine;
  private @Nullable SVGLength mStartOffset;
  private TextPathMethod mMethod = TextPathMethod.align;
  private TextPathSpacing mSpacing = TextPathSpacing.exact;

  public TextPathView(ReactContext reactContext) {
    super(reactContext);
  }

  public void setHref(String href) {
    mHref = href;
    invalidate();
  }

  public void setStartOffset(Dynamic startOffset) {
    mStartOffset = SVGLength.from(startOffset);
    invalidate();
  }

  public void setStartOffset(String startOffset) {
    mStartOffset = SVGLength.from(startOffset);
    invalidate();
  }

  public void setStartOffset(Double startOffset) {
    mStartOffset = SVGLength.from(startOffset);
    invalidate();
  }

  public void setMethod(@Nullable String method) {
    mMethod = TextPathMethod.valueOf(method);
    invalidate();
  }

  public void setSpacing(@Nullable String spacing) {
    mSpacing = TextPathSpacing.valueOf(spacing);
    invalidate();
  }

  public void setSide(@Nullable String side) {
    mSide = TextPathSide.valueOf(side);
    invalidate();
  }

  public void setSharp(@Nullable String midLine) {
    mMidLine = TextPathMidLine.valueOf(midLine);
    invalidate();
  }

  @SuppressWarnings("unused")
  TextPathMethod getMethod() {
    return mMethod;
  }

  @SuppressWarnings("unused")
  TextPathSpacing getSpacing() {
    return mSpacing;
  }

  TextPathSide getSide() {
    return mSide;
  }

  TextPathMidLine getMidLine() {
    return mMidLine;
  }

  SVGLength getStartOffset() {
    return mStartOffset;
  }

  @Override
  void draw(Canvas canvas, Paint paint, float opacity) {
    drawGroup(canvas, paint, opacity);
  }

  Path getTextPath(Canvas canvas, Paint paint) {
    SvgView svg = getSvgView();
    VirtualView template = svg.getDefinedTemplate(mHref);

    if (!(template instanceof RenderableView)) {
      // warning about this.
      return null;
    }

    RenderableView view = (RenderableView) template;
    return view.getPath(canvas, paint);
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    return getGroupPath(canvas, paint);
  }

  @Override
  void pushGlyphContext() {
    // do nothing
  }

  @Override
  void popGlyphContext() {
    // do nothing
  }
}
