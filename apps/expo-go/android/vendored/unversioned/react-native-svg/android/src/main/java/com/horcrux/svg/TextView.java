/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import static com.horcrux.svg.TextProperties.AlignmentBaseline;
import static com.horcrux.svg.TextProperties.TextLengthAdjust;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Region;
import android.view.View;
import android.view.ViewParent;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import java.util.ArrayList;
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class TextView extends GroupView {
  SVGLength mInlineSize = null;
  SVGLength mTextLength = null;
  private String mBaselineShift = null;
  TextLengthAdjust mLengthAdjust = TextLengthAdjust.spacing;
  private AlignmentBaseline mAlignmentBaseline;
  @Nullable private ArrayList<SVGLength> mPositionX;
  @Nullable private ArrayList<SVGLength> mPositionY;
  @Nullable private ArrayList<SVGLength> mRotate;
  @Nullable private ArrayList<SVGLength> mDeltaX;
  @Nullable private ArrayList<SVGLength> mDeltaY;
  double cachedAdvance = Double.NaN;

  public TextView(ReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public void invalidate() {
    if (mPath == null) {
      return;
    }
    super.invalidate();
    getTextContainer().clearChildCache();
  }

  void clearCache() {
    cachedAdvance = Double.NaN;
    super.clearCache();
  }

  public void setInlineSize(Dynamic inlineSize) {
    mInlineSize = SVGLength.from(inlineSize);
    invalidate();
  }

  public void setInlineSize(String inlineSize) {
    mInlineSize = SVGLength.from(inlineSize);
    invalidate();
  }

  public void setInlineSize(Double inlineSize) {
    mInlineSize = SVGLength.from(inlineSize);
    invalidate();
  }

  public void setTextLength(Dynamic length) {
    mTextLength = SVGLength.from(length);
    invalidate();
  }

  public void setTextLength(String length) {
    mTextLength = SVGLength.from(length);
    invalidate();
  }

  public void setTextLength(Double length) {
    mTextLength = SVGLength.from(length);
    invalidate();
  }

  public void setLengthAdjust(@Nullable String adjustment) {
    mLengthAdjust = TextLengthAdjust.valueOf(adjustment);
    invalidate();
  }

  public void setMethod(@Nullable String alignment) {
    mAlignmentBaseline = AlignmentBaseline.getEnum(alignment);
    invalidate();
  }

  public void setBaselineShift(Dynamic baselineShift) {
    mBaselineShift = SVGLength.toString(baselineShift);
    invalidate();
  }

  public void setBaselineShift(String baselineShift) {
    mBaselineShift = baselineShift;
    invalidate();
  }

  public void setBaselineShift(Double baselineShift) {
    mBaselineShift = String.valueOf(baselineShift);
    invalidate();
  }

  public void setVerticalAlign(@Nullable String verticalAlign) {
    if (verticalAlign != null) {
      verticalAlign = verticalAlign.trim();
      int i = verticalAlign.lastIndexOf(' ');
      try {
        mAlignmentBaseline = AlignmentBaseline.getEnum(verticalAlign.substring(i));
      } catch (IllegalArgumentException e) {
        mAlignmentBaseline = AlignmentBaseline.baseline;
      }
      try {
        mBaselineShift = verticalAlign.substring(0, i);
      } catch (IndexOutOfBoundsException e) {
        mBaselineShift = null;
      }
    } else {
      mAlignmentBaseline = AlignmentBaseline.baseline;
      mBaselineShift = null;
    }
    invalidate();
  }

  public void setRotate(Dynamic rotate) {
    mRotate = SVGLength.arrayFrom(rotate);
    invalidate();
  }

  public void setRotate(ReadableArray rotate) {
    mRotate = SVGLength.arrayFrom(rotate);
    invalidate();
  }

  public void setDeltaX(Dynamic deltaX) {
    mDeltaX = SVGLength.arrayFrom(deltaX);
    invalidate();
  }

  public void setDeltaX(ReadableArray deltaX) {
    mDeltaX = SVGLength.arrayFrom(deltaX);
    invalidate();
  }

  public void setDeltaY(Dynamic deltaY) {
    mDeltaY = SVGLength.arrayFrom(deltaY);
    invalidate();
  }

  public void setDeltaY(ReadableArray deltaY) {
    mDeltaY = SVGLength.arrayFrom(deltaY);
    invalidate();
  }

  public void setPositionX(Dynamic positionX) {
    mPositionX = SVGLength.arrayFrom(positionX);
    invalidate();
  }

  public void setPositionX(ReadableArray positionX) {
    mPositionX = SVGLength.arrayFrom(positionX);
    invalidate();
  }

  public void setPositionY(Dynamic positionY) {
    mPositionY = SVGLength.arrayFrom(positionY);
    invalidate();
  }

  public void setPositionY(ReadableArray positionY) {
    mPositionY = SVGLength.arrayFrom(positionY);
    invalidate();
  }

  @Override
  void draw(Canvas canvas, Paint paint, float opacity) {
    setupGlyphContext(canvas);
    clip(canvas, paint);
    getGroupPath(canvas, paint);
    pushGlyphContext();
    drawGroup(canvas, paint, opacity);
    popGlyphContext();
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    if (mPath != null) {
      return mPath;
    }
    setupGlyphContext(canvas);
    return getGroupPath(canvas, paint);
  }

  @Override
  Path getPath(Canvas canvas, Paint paint, Region.Op op) {
    return getPath(canvas, paint);
  }

  AlignmentBaseline getAlignmentBaseline() {
    if (mAlignmentBaseline == null) {
      ViewParent parent = this.getParent();
      while (parent != null) {
        if (parent instanceof TextView) {
          TextView node = (TextView) parent;
          final AlignmentBaseline baseline = node.mAlignmentBaseline;
          if (baseline != null) {
            mAlignmentBaseline = baseline;
            return baseline;
          }
        }
        parent = parent.getParent();
      }
    }
    if (mAlignmentBaseline == null) {
      mAlignmentBaseline = AlignmentBaseline.baseline;
    }
    return mAlignmentBaseline;
  }

  String getBaselineShift() {
    if (mBaselineShift == null) {
      ViewParent parent = this.getParent();
      while (parent != null) {
        if (parent instanceof TextView) {
          TextView node = (TextView) parent;
          final String baselineShift = node.mBaselineShift;
          if (baselineShift != null) {
            mBaselineShift = baselineShift;
            return baselineShift;
          }
        }
        parent = parent.getParent();
      }
    }
    return mBaselineShift;
  }

  Path getGroupPath(Canvas canvas, Paint paint) {
    if (mPath != null) {
      return mPath;
    }
    pushGlyphContext();
    mPath = super.getPath(canvas, paint);
    popGlyphContext();

    return mPath;
  }

  @Override
  void pushGlyphContext() {
    boolean isTextNode = !(this instanceof TextPathView) && !(this instanceof TSpanView);
    getTextRootGlyphContext()
        .pushContext(isTextNode, this, mFont, mPositionX, mPositionY, mDeltaX, mDeltaY, mRotate);
  }

  TextView getTextAnchorRoot() {
    GlyphContext gc = getTextRootGlyphContext();
    ArrayList<FontData> font = gc.mFontContext;
    TextView node = this;
    ViewParent parent = this.getParent();
    for (int i = font.size() - 1; i >= 0; i--) {
      if (!(parent instanceof TextView)
          || font.get(i).textAnchor == TextProperties.TextAnchor.start
          || node.mPositionX != null) {
        return node;
      }
      node = (TextView) parent;
      parent = node.getParent();
    }
    return node;
  }

  double getSubtreeTextChunksTotalAdvance(Paint paint) {
    if (!Double.isNaN(cachedAdvance)) {
      return cachedAdvance;
    }
    double advance = 0;
    for (int i = 0; i < getChildCount(); i++) {
      View child = getChildAt(i);
      if (child instanceof TextView) {
        TextView text = (TextView) child;
        advance += text.getSubtreeTextChunksTotalAdvance(paint);
      }
    }
    cachedAdvance = advance;
    return advance;
  }

  TextView getTextContainer() {
    TextView node = this;
    ViewParent parent = this.getParent();
    while (parent instanceof TextView) {
      node = (TextView) parent;
      parent = node.getParent();
    }
    return node;
  }
}
