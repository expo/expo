/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi34_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import abi34_0_0.com.facebook.react.bridge.ReactContext;
import abi34_0_0.com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class PathView extends RenderableView {
    private Path mPath;

    public PathView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "d")
    public void setD(String d) {
        PropHelper.PathParser mD = new PropHelper.PathParser(d, mScale);
        mPath = mD.getPath();
        invalidate();
    }

    @Override
    Path getPath(Canvas canvas, Paint paint) {
        return mPath;
    }

}
