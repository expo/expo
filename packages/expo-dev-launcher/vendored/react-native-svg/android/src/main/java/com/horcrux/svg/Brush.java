/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;

class Brush {
    private final BrushType mType;
    private final SVGLength[] mPoints;
    private ReadableArray mColors;
    private final boolean mUseObjectBoundingBox;

    // TODO implement pattern units
    @SuppressWarnings({"unused"})
    private boolean mUseContentObjectBoundingBoxUnits;

    private Matrix mMatrix;
    private Rect mUserSpaceBoundingBox;
    private PatternView mPattern;

    Brush(BrushType type, SVGLength[] points, BrushUnits units) {
        mType = type;
        mPoints = points;
        mUseObjectBoundingBox = units == BrushUnits.OBJECT_BOUNDING_BOX;
    }

    void setContentUnits(BrushUnits units) {
        mUseContentObjectBoundingBoxUnits = units == BrushUnits.OBJECT_BOUNDING_BOX;
    }

    void setPattern(PatternView pattern) {
        mPattern = pattern;
    }

    enum BrushType {
        LINEAR_GRADIENT,
        RADIAL_GRADIENT,
        PATTERN
    }

    enum BrushUnits {
        OBJECT_BOUNDING_BOX,
        USER_SPACE_ON_USE
    }

    private static void parseGradientStops(ReadableArray value, int stopsCount, float[] stops, int[] stopsColors, float opacity) {
        for (int i = 0; i < stopsCount; i++) {
            int stopIndex = i * 2;
            stops[i] = (float) value.getDouble(stopIndex);
            int color = value.getInt(stopIndex + 1);
            int alpha = color >>> 24;
            int combined = Math.round((float)alpha * opacity);
            stopsColors[i] = combined << 24 | (color & 0x00ffffff);
        }
    }

    void setUserSpaceBoundingBox(Rect userSpaceBoundingBox) {
        mUserSpaceBoundingBox = userSpaceBoundingBox;
    }

    void setGradientColors(ReadableArray colors) {
        mColors = colors;
    }

    void setGradientTransform(Matrix matrix) {
        mMatrix = matrix;
    }

    private RectF getPaintRect(RectF pathBoundingBox) {
        RectF rect = mUseObjectBoundingBox ? pathBoundingBox : new RectF(mUserSpaceBoundingBox);
        float width = rect.width();
        float height = rect.height();
        float x = 0f;
        float y = 0f;

        if (mUseObjectBoundingBox) {
            x = rect.left;
            y = rect.top;
        }

        return new RectF(x, y, x + width, y + height);
    }

    private double getVal(SVGLength length, double relative, float scale, float textSize) {
        return PropHelper.fromRelative(length, relative, 0, mUseObjectBoundingBox &&
                length.unit == SVGLength.UnitType.NUMBER ? relative : scale, textSize);
    }

    void setupPaint(Paint paint, RectF pathBoundingBox, float scale, float opacity) {
        RectF rect = getPaintRect(pathBoundingBox);
        float width = rect.width();
        float height = rect.height();
        float offsetX = rect.left;
        float offsetY = rect.top;

        float textSize = paint.getTextSize();
        if (mType == BrushType.PATTERN) {
            double x = getVal(mPoints[0], width, scale, textSize);
            double y = getVal(mPoints[1], height, scale, textSize);
            double w = getVal(mPoints[2], width, scale, textSize);
            double h = getVal(mPoints[3], height, scale, textSize);

            if (!(w > 1 && h > 1)) {
                return;
            }

            Bitmap bitmap = Bitmap.createBitmap(
                    (int) w,
                    (int) h,
                    Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            RectF vbRect = mPattern.getViewBox();
            if (vbRect != null && vbRect.width() > 0 && vbRect.height() > 0) {
                RectF eRect = new RectF((float) x, (float) y, (float) w, (float) h);
                Matrix mViewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mPattern.mAlign, mPattern.mMeetOrSlice);
                canvas.concat(mViewBoxMatrix);
            }

            if (mUseContentObjectBoundingBoxUnits) {
                canvas.scale(width / scale, height / scale);
            }

            mPattern.draw(canvas, new Paint(), opacity);

            Matrix patternMatrix = new Matrix();
            if (mMatrix != null) {
                patternMatrix.preConcat(mMatrix);
            }

            BitmapShader bitmapShader = new BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
            bitmapShader.setLocalMatrix(patternMatrix);
            paint.setShader(bitmapShader);
            return;
        }

        int size = mColors.size();
        if (size == 0) {
            FLog.w(ReactConstants.TAG, "Gradient contains no stops");
            return;
        }
        int stopsCount = size / 2;
        int[] stopsColors = new int[stopsCount];
        float[] stops = new float[stopsCount];
        parseGradientStops(mColors, stopsCount, stops, stopsColors, opacity);

        if (stops.length == 1) {
            // Gradient with only one stop will make LinearGradient/RadialGradient
            // throw. It may happen when source SVG contains only one stop or
            // two stops at the same spot (see lib/extract/extractGradient.js).
            // Although it's mistake SVGs like this can be produced by vector
            // editors or other tools, so let's handle that gracefully.
            stopsColors = new int[] { stopsColors[0], stopsColors[0] };
            stops = new float[] { stops[0], stops[0] };
            FLog.w(ReactConstants.TAG, "Gradient contains only one stop");
        }

        if (mType == BrushType.LINEAR_GRADIENT) {
            double x1 = getVal(mPoints[0], width, scale, textSize) + offsetX;
            double y1 = getVal(mPoints[1], height, scale, textSize) + offsetY;
            double x2 = getVal(mPoints[2], width, scale, textSize) + offsetX;
            double y2 = getVal(mPoints[3], height, scale, textSize) + offsetY;

            Shader linearGradient = new LinearGradient(
                (float) x1,
                (float) y1,
                (float) x2,
                (float) y2,
                stopsColors,
                stops,
                Shader.TileMode.CLAMP);

            if (mMatrix != null) {
                Matrix m = new Matrix();
                m.preConcat(mMatrix);
                linearGradient.setLocalMatrix(m);
            }

            paint.setShader(linearGradient);
        } else if (mType == BrushType.RADIAL_GRADIENT) {
            double rx = getVal(mPoints[2], width, scale, textSize);
            double ry = getVal(mPoints[3], height, scale, textSize);

            double ratio = ry / rx;

            double cx = getVal(mPoints[4], width, scale, textSize) + offsetX;
            double cy = getVal(mPoints[5], height / ratio, scale, textSize) + offsetY / ratio;

            // TODO: support focus point.
            //double fx = PropHelper.fromRelative(mPoints[0], width, offsetX, scale);
            //double fy = PropHelper.fromRelative(mPoints[1], height, offsetY, scale) / (ry / rx);

            Shader radialGradient = new RadialGradient(
                    (float) cx,
                    (float) cy,
                    (float) rx,
                    stopsColors,
                    stops,
                    Shader.TileMode.CLAMP
            );

            Matrix radialMatrix = new Matrix();
            radialMatrix.preScale(1f, (float) ratio);

            if (mMatrix != null) {
                radialMatrix.preConcat(mMatrix);
            }

            radialGradient.setLocalMatrix(radialMatrix);
            paint.setShader(radialGradient);
        }
    }
}
