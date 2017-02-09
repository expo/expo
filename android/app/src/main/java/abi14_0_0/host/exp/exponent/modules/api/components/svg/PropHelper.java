/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi14_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Color;
import android.graphics.RectF;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.graphics.Matrix;

import javax.annotation.Nullable;

import abi14_0_0.com.facebook.react.bridge.ReadableArray;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Contains static helper methods for accessing props.
 */
/* package */ class PropHelper {

    /**
     * Converts {@link ReadableArray} to an array of {@code float}. Returns newly created array.
     *
     * @return a {@code float[]} if converted successfully, or {@code null} if {@param value} was
     * {@code null}.
     */
  /*package*/
    static
    @Nullable
    float[] toFloatArray(@Nullable ReadableArray value) {
        if (value != null) {
            float[] result = new float[value.size()];
            toFloatArray(value, result);
            return result;
        }
        return null;
    }

    /**
     * Converts given {@link ReadableArray} to an array of {@code float}. Writes result to the array
     * passed in {@param into}. This method will write to the output array up to the number of items
     * from the input array. If the input array is longer than output the remaining part of the input
     * will not be converted.
     *
     * @param value input array
     * @param into  output array
     * @return number of items copied from input to the output array
     */
  /*package*/
    static int toFloatArray(ReadableArray value, float[] into) {
        int length = value.size() > into.length ? into.length : value.size();
        for (int i = 0; i < length; i++) {
            into[i] = (float) value.getDouble(i);
        }
        return value.size();

    }


    /**
     * Converts percentage string into actual based on a relative number
     *
     * @param percentage percentage string
     * @param relative   relative number
     * @param offset     offset number
     * @return actual float based on relative number
     */
  /*package*/
    static float fromPercentageToFloat(String percentage, float relative, float offset, float scale) {
        Matcher matched = Pattern.compile("^(\\-?\\d+(?:\\.\\d+)?)%$").matcher(percentage);
        if (matched.matches()) {
            return Float.valueOf(matched.group(1)) / 100 * relative + offset;
        } else {
            return Float.valueOf(percentage) * scale;
        }
    }

    /**
     * Judge given string is a percentage-like string or not.
     *
     * @param string percentage string
     * @return string is percentage-like or not.
     */

  /*package*/
    static boolean isPercentage(String string) {
        Pattern pattern = Pattern.compile("^(\\-?\\d+(?:\\.\\d+)?)%$");
        return pattern.matcher(string).matches();
    }

    /**
     *
     */
  /*package*/ static class RNSVGBrush {

        private GradientType mType = GradientType.LINEAR_GRADIENT;
        private ReadableArray mPoints;
        private ReadableArray mColors;

        public RNSVGBrush(GradientType type, ReadableArray points, ReadableArray colors) {
            mType = type;
            mPoints = points;
            mColors = colors;
        }

        public enum GradientType {
            LINEAR_GRADIENT(0),
            RADIAL_GRADIENT(1);

            GradientType(int ni) {
                nativeInt = ni;
            }

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

        public void setupPaint(Paint paint, RectF box, float scale, float opacity) {
            float height = box.height();
            float width = box.width();
            float midX = box.centerX();
            float midY = box.centerY();
            float offsetX = (midX - width / 2);
            float offsetY = (midY - height / 2);


            int stopsCount = mColors.size() / 5;
            int[] stopsColors = new int[stopsCount];
            float[] stops = new float[stopsCount];
            parseGradientStops(mColors, stopsCount, stops, stopsColors, opacity);

            if (mType == GradientType.LINEAR_GRADIENT) {
                float x1 = PropHelper.fromPercentageToFloat(mPoints.getString(0), width, offsetX, scale);
                float y1 = PropHelper.fromPercentageToFloat(mPoints.getString(1), height, offsetY, scale);
                float x2 = PropHelper.fromPercentageToFloat(mPoints.getString(2), width, offsetX, scale);
                float y2 = PropHelper.fromPercentageToFloat(mPoints.getString(3), height, offsetY, scale);
                paint.setShader(
                    new LinearGradient(
                        x1,
                        y1,
                        x2,
                        y2,
                        stopsColors,
                        stops,
                        Shader.TileMode.CLAMP));
            } else {
                float rx = PropHelper.fromPercentageToFloat(mPoints.getString(2), width, 0f, scale);
                float ry = PropHelper.fromPercentageToFloat(mPoints.getString(3), height, 0f, scale);
                float cx = PropHelper.fromPercentageToFloat(mPoints.getString(4), width, offsetX, scale);
                float cy = PropHelper.fromPercentageToFloat(mPoints.getString(5), height, offsetY, scale) / (ry / rx);
                // TODO: support focus point.
                //float fx = PropHelper.fromPercentageToFloat(mPoints.getString(0), width, offsetX) * scale;
                //float fy = PropHelper.fromPercentageToFloat(mPoints.getString(1), height, offsetY) * scale / (ry / rx);
                Shader radialGradient = new RadialGradient(
                    cx,
                    cy,
                    rx,
                    stopsColors,
                    stops,
                    Shader.TileMode.CLAMP
                );

                Matrix radialMatrix = new Matrix();
                radialMatrix.preScale(1f, ry / rx);
                radialGradient.setLocalMatrix(radialMatrix);
                paint.setShader(radialGradient);
            }
        }
    }
}
