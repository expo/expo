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
import com.facebook.react.bridge.ReactContext;

@SuppressLint("ViewConstructor")
class PathView extends RenderableView {
  private Path mPath;

  public PathView(ReactContext reactContext) {
    super(reactContext);
    PathParser.mScale = mScale;
    mPath = new Path();
  }

  public void setD(String d) {
    mPath = PathParser.parse(d);
    elements = PathParser.elements;
    invalidate();
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    return mPath;
  }
}
