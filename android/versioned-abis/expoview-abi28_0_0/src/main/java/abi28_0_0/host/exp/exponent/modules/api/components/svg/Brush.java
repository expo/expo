/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;

import abi28_0_0.com.facebook.react.bridge.ReadableArray;

class Brush {
    private BrushType mType = BrushType.LINEAR_GRADIENT;
    private final ReadableArray mPoints;
    private ReadableArray mColors;
    private final boolean mUseObjectBoundingBox;
    private Matrix mMatrix;
    private Rect mUserSpaceBoundingBox;

    Brush(BrushType type, ReadableArray points, BrushUnits units) {
        mType = type;
        mPoints = points;
        mUseObjectBoundingBox = units == BrushUnits.OBJECT_BOUNDING_BOX;
    }

    enum BrushType {
        LINEAR_GRADIENT(0),
        RADIAL_GRADIENT(1),
        @SuppressWarnings("unused")PATTERN(2);
        BrushType(int ni) {
            nativeInt = ni;
        }

        @SuppressWarnings("unused")
        final int nativeInt;
    }

    enum BrushUnits {
        OBJECT_BOUNDING_BOX(0),
        USER_SPACE_ON_USE(1);
        BrushUnits(int ni) {
            nativeInt = ni;
        }
        @SuppressWarnings("unused")
        final int nativeInt;
    }

    private static void parseGradientStops(ReadableArray value, int stopsCount, float[] stops, int[] stopsColors, float opacity) {
        int startStops = value.size() - stopsCount;
        for (int i = 0; i < stopsCount; i++) {
            stops[i] = (float) value.getDouble(startStops + i);
            stopsColors[i] = Color.argb(
                    (int) (value.getDouble(i * 4 + 3) * 255 * opacity),
                    (int) (value.getDouble(i * 4) * 255),
                    (int) (value.getDouble(i * 4 + 1) * 255),
                    (int) (value.getDouble(i * 4 + 2) * 255));

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

    void setupPaint(Paint paint, RectF pathBoundingBox, float scale, float opacity) {
        RectF rect = getPaintRect(pathBoundingBox);
        float width = rect.width();
        float height = rect.height();
        float offsetX = rect.left;
        float offsetY = rect.top;

        int stopsCount = mColors.size() / 5;
        int[] stopsColors = new int[stopsCount];
        float[] stops = new float[stopsCount];
        parseGradientStops(mColors, stopsCount, stops, stopsColors, opacity);

        if (mType == BrushType.LINEAR_GRADIENT) {
            double x1 = PropHelper.fromRelative(mPoints.getString(0), width, offsetX, scale, paint.getTextSize());
            double y1 = PropHelper.fromRelative(mPoints.getString(1), height, offsetY, scale, paint.getTextSize());
            double x2 = PropHelper.fromRelative(mPoints.getString(2), width, offsetX, scale, paint.getTextSize());
            double y2 = PropHelper.fromRelative(mPoints.getString(3), height, offsetY, scale, paint.getTextSize());

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
            double rx = PropHelper.fromRelative(mPoints.getString(2), width, 0f, scale, paint.getTextSize());
            double ry = PropHelper.fromRelative(mPoints.getString(3), height, 0f, scale, paint.getTextSize());
            double cx = PropHelper.fromRelative(mPoints.getString(4), width, offsetX, scale, paint.getTextSize());
            double cy = PropHelper.fromRelative(mPoints.getString(5), height, offsetY, scale, paint.getTextSize()) / (ry / rx);
            // TODO: support focus point.
            //double fx = PropHelper.fromRelative(mPoints.getString(0), width, offsetX, scale);
            //double fy = PropHelper.fromRelative(mPoints.getString(1), height, offsetY, scale) / (ry / rx);
            Shader radialGradient = new RadialGradient(
                    (float) cx,
                    (float) cy,
                    (float) rx,
                    stopsColors,
                    stops,
                    Shader.TileMode.CLAMP
            );

            Matrix radialMatrix = new Matrix();
            radialMatrix.preScale(1f, (float) (ry / rx));

            if (mMatrix != null) {
                radialMatrix.preConcat(mMatrix);
            }

            radialGradient.setLocalMatrix(radialMatrix);
            paint.setShader(radialGradient);
        }
        // else {
            // todo: pattern support

            //Shader mShader1 = new BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
            //paint.setShader(mShader1);
            //bitmap.recycle();
        // }
    }
}
