/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Path;
import android.graphics.RectF;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.bridge.WritableArray;
import abi29_0_0.com.facebook.react.bridge.WritableMap;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Contains static helper methods for accessing props.
 */
class PropHelper {

    private static final int inputMatrixDataSize = 6;

    /**
     * Converts given {@link ReadableArray} to a matrix data array, {@code float[6]}.
     * Writes result to the array passed in {@param into}.
     * This method will write exactly six items to the output array from the input array.
     *
     * If the input array has a different size, then only the size is returned;
     * Does not check output array size. Ensure space for at least six elements.
     *
     * @param value input array
     * @param sRawMatrix output matrix
     * @param mScale current resolution scaling
     * @return size of input array
     */
    static int toMatrixData(ReadableArray value, float[] sRawMatrix, float mScale) {
        int fromSize = value.size();
        if (fromSize != inputMatrixDataSize) {
            return fromSize;
        }

        sRawMatrix[0] = (float) value.getDouble(0);
        sRawMatrix[1] = (float) value.getDouble(2);
        sRawMatrix[2] = (float) value.getDouble(4) * mScale;
        sRawMatrix[3] = (float) value.getDouble(1);
        sRawMatrix[4] = (float) value.getDouble(3);
        sRawMatrix[5] = (float) value.getDouble(5) * mScale;

        return inputMatrixDataSize;
    }

    static private final Pattern percentageRegExp = Pattern.compile("^(-?\\d+(?:\\.\\d+)?)%$");

    /**
     * Converts length string into px / user units
     * in the current user coordinate system
     *
     * @param length     length string
     * @param relative   relative size for percentages
     * @param offset     offset for all units
     * @param scale      scaling parameter
     * @param fontSize   current font size
     * @return value in the current user coordinate system
     */
    static double fromRelative(String length, double relative, double offset, double scale, double fontSize) {
        /*
            TODO list

            unit  relative to
            em    font size of the element
            ex    x-height of the element’s font
            ch    width of the "0" (ZERO, U+0030) glyph in the element’s font
            rem   font size of the root element
            vw    1% of viewport’s width
            vh    1% of viewport’s height
            vmin  1% of viewport’s smaller dimension
            vmax  1% of viewport’s larger dimension

            relative-size [ larger | smaller ]
            absolute-size: [ xx-small | x-small | small | medium | large | x-large | xx-large ]

            https://www.w3.org/TR/css3-values/#relative-lengths
            https://www.w3.org/TR/css3-values/#absolute-lengths
            https://drafts.csswg.org/css-cascade-4/#computed-value
            https://drafts.csswg.org/css-fonts-3/#propdef-font-size
            https://drafts.csswg.org/css2/fonts.html#propdef-font-size
        */
        length = length.trim();
        int stringLength = length.length();
        int percentIndex = stringLength - 1;
        if (stringLength == 0 || length.equals("normal")) {
            return offset;
        } else if (length.codePointAt(percentIndex) == '%') {
            return Double.valueOf(length.substring(0, percentIndex)) / 100 * relative + offset;
        } else {
            int twoLetterUnitIndex = stringLength - 2;
            if (twoLetterUnitIndex > 0) {
                String lastTwo = length.substring(twoLetterUnitIndex);
                int end = twoLetterUnitIndex;
                double unit = 1;

                switch (lastTwo) {
                    case "px":
                        break;

                    case "em":
                        unit = fontSize;
                        break;

                    /*
                     "1pt" equals "1.25px" (and therefore 1.25 user units)
                     "1pc" equals "15px" (and therefore 15 user units)
                     "1mm" would be "3.543307px" (3.543307 user units)
                     "1cm" equals "35.43307px" (and therefore 35.43307 user units)
                     "1in" equals "90px" (and therefore 90 user units)
                     */

                    case "pt":
                        unit = 1.25d;
                        break;

                    case "pc":
                        unit = 15;
                        break;

                    case "mm":
                        unit = 3.543307d;
                        break;

                    case "cm":
                        unit = 35.43307d;
                        break;

                    case "in":
                        unit = 90;
                        break;

                    default:
                        end = stringLength;
                }

                return Double.valueOf(length.substring(0, end)) * unit * scale + offset;
            } else {
                return Double.valueOf(length) * scale + offset;
            }
        }
    }

    /**
     * Matches if the `string` is percentage-like.
     *
     * @param string percentage string
     * @return if `string` is percentage-like.
     */

    static boolean isPercentage(String string) {
        return percentageRegExp.matcher(string).matches();
    }

    static class PathParser {
        static private final Pattern PATH_REG_EXP = Pattern.compile("[a-df-z]|[\\-+]?(?:[\\d.]e[\\-+]?|[^\\s\\-+,a-z])+", Pattern.CASE_INSENSITIVE);
        static private final Pattern DECIMAL_REG_EXP = Pattern.compile("(\\.\\d+)(?=-?\\.)");

        private Matcher mMatcher;
        private Path mPath;
        private final String mString;
        private float mPenX = 0f;
        private float mPenY = 0f;
        private float mPenDownX;
        private float mPenDownY;
        private float mPivotX = 0f;
        private float mPivotY = 0f;
        private float mScale = 1f;
        private boolean mValid = true;
        private boolean mPendDownSet = false;

        private String mLastCommand;
        private String mLastValue;
        private WritableArray mBezierCurves;
        private WritableMap mLastStartPoint;

        PathParser(String d, float scale) {
            mScale = scale;
            mString = d;
        }

        private void executeCommand(String command) {
            switch (command) {
                // moveTo command
                case "m":
                    move(getNextFloat(), getNextFloat());
                    break;
                case "M":
                    moveTo(getNextFloat(), getNextFloat());
                    break;

                // lineTo command
                case "l":
                    line(getNextFloat(), getNextFloat());
                    break;
                case "L":
                    lineTo(getNextFloat(), getNextFloat());
                    break;

                // horizontalTo command
                case "h":
                    line(getNextFloat(), 0);
                    break;
                case "H":
                    lineTo(getNextFloat(), mPenY);
                    break;

                // verticalTo command
                case "v":
                    line(0, getNextFloat());
                    break;
                case "V":
                    lineTo(mPenX, getNextFloat());
                    break;

                // curveTo command
                case "c":
                    curve(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;
                case "C":
                    curveTo(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;

                // smoothCurveTo command
                case "s":
                    smoothCurve(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;
                case "S":
                    smoothCurveTo(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;

                // quadraticBezierCurveTo command
                case "q":
                    quadraticBezierCurve(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;
                case "Q":
                    quadraticBezierCurveTo(getNextFloat(), getNextFloat(), getNextFloat(), getNextFloat());
                    break;

                // smoothQuadraticBezierCurveTo command
                case "t":
                    smoothQuadraticBezierCurve(getNextFloat(), getNextFloat());
                    break;
                case "T":
                    smoothQuadraticBezierCurveTo(getNextFloat(), getNextFloat());
                    break;

                // arcTo command
                case "a":
                    arc(getNextFloat(), getNextFloat(), getNextFloat(), getNextBoolean(), getNextBoolean(), getNextFloat(), getNextFloat());
                    break;
                case "A":
                    arcTo(getNextFloat(), getNextFloat(), getNextFloat(), getNextBoolean(), getNextBoolean(), getNextFloat(), getNextFloat());
                    break;

                // close command
                case "Z":
                case "z":
                    close();
                    break;
                default:
                    mLastValue = command;
                    executeCommand(mLastCommand);
                    return;
            }

            mLastCommand = command;

            if (command.equals("m")) {
                mLastCommand = "l";
            } else if (command.equals("M")) {
                mLastCommand = "L";
            }
        }

        public Path getPath() {
            mPath = new Path();
            mBezierCurves = Arguments.createArray();
            mMatcher = PATH_REG_EXP.matcher(DECIMAL_REG_EXP.matcher(mString).replaceAll("$1,"));

            while (mMatcher.find() && mValid) {
                executeCommand(mMatcher.group());
            }
            return mPath;
        }

        private WritableMap getPointMap(float x, float y) {
            WritableMap map = Arguments.createMap();
            map.putDouble("x", x * mScale);
            map.putDouble("y", y * mScale);
            return map;
        }

        private WritableMap clonePointMap(WritableMap map) {
            WritableMap cloned = Arguments.createMap();
            cloned.putDouble("x", map.getDouble("x"));
            cloned.putDouble("y", map.getDouble("y"));
            return cloned;
        }

        private boolean getNextBoolean() {
            if (mMatcher.find()) {
                return mMatcher.group().equals("1");
            } else {
                mValid = false;
                mPath = new Path();
                return false;
            }
        }

        private float getNextFloat() {
            if (mLastValue != null) {
                String lastValue = mLastValue;
                mLastValue = null;
                return Float.parseFloat(lastValue);
            } else if (mMatcher.find()) {
                return Float.parseFloat(mMatcher.group());
            } else {
                mValid = false;
                mPath = new Path();
                return 0;
            }
        }
        private void move(float x, float y) {
            moveTo(x + mPenX, y + mPenY);
        }

        private void moveTo(float x, float y) {
            mPivotX = mPenX = x;
            mPivotY = mPenY = y;
            mPath.moveTo(x * mScale, y * mScale);

            mLastStartPoint = getPointMap(x ,y);
            WritableArray points = Arguments.createArray();
            points.pushMap(getPointMap(x, y));
            mBezierCurves.pushArray(points);
        }

        private void line(float x, float y) {
            lineTo(x + mPenX, y + mPenY);
        }

        private void lineTo(float x, float y) {
            setPenDown();
            mPivotX = mPenX = x;
            mPivotY = mPenY = y;
            mPath.lineTo(x * mScale, y * mScale);

            WritableArray points = Arguments.createArray();
            points.pushMap(getPointMap(x, y));
            points.pushMap(getPointMap(x, y));
            points.pushMap(getPointMap(x, y));
            mBezierCurves.pushArray(points);
        }

        private void curve(float c1x, float c1y, float c2x, float c2y, float ex, float ey) {
            curveTo(c1x + mPenX, c1y + mPenY, c2x + mPenX, c2y + mPenY, ex + mPenX, ey + mPenY);
        }

        private void curveTo(float c1x, float c1y, float c2x, float c2y, float ex, float ey) {
            mPivotX = c2x;
            mPivotY = c2y;
            cubicTo(c1x, c1y, c2x, c2y, ex, ey);
        }

        private void cubicTo(float c1x, float c1y, float c2x, float c2y, float ex, float ey) {
            setPenDown();
            mPenX = ex;
            mPenY = ey;
            mPath.cubicTo(c1x * mScale, c1y * mScale, c2x * mScale, c2y * mScale, ex * mScale, ey * mScale);

            WritableArray points = Arguments.createArray();
            points.pushMap(getPointMap(c1x, c1y));
            points.pushMap(getPointMap(c2x, c2y));
            points.pushMap(getPointMap(ex, ey));
            mBezierCurves.pushArray(points);
        }

        private void smoothCurve(float c1x, float c1y, float ex, float ey) {
            smoothCurveTo(c1x + mPenX, c1y + mPenY, ex + mPenX, ey + mPenY);
        }

        private void smoothCurveTo(float c1x, float c1y, float ex, float ey) {
            float c2x = c1x;
            float c2y = c1y;
            c1x = (mPenX * 2) - mPivotX;
            c1y = (mPenY * 2) - mPivotY;
            mPivotX = c2x;
            mPivotY = c2y;
            cubicTo(c1x, c1y, c2x, c2y, ex, ey);
        }

        private void quadraticBezierCurve(float c1x, float c1y, float c2x, float c2y) {
            quadraticBezierCurveTo(c1x + mPenX, c1y + mPenY, c2x + mPenX, c2y + mPenY);
        }

        private void quadraticBezierCurveTo(float c1x, float c1y, float c2x, float c2y) {
            mPivotX = c1x;
            mPivotY = c1y;
            float ex = c2x;
            float ey = c2y;
            c2x = (ex + c1x * 2) / 3;
            c2y = (ey + c1y * 2) / 3;
            c1x = (mPenX + c1x * 2) / 3;
            c1y = (mPenY + c1y * 2) / 3;
            cubicTo(c1x, c1y, c2x, c2y, ex, ey);
        }

        private void smoothQuadraticBezierCurve(float c1x, float c1y) {
            smoothQuadraticBezierCurveTo(c1x + mPenX, c1y + mPenY);
        }

        private void smoothQuadraticBezierCurveTo(float c1x, float c1y) {
            float c2x = c1x;
            float c2y = c1y;
            c1x = (mPenX * 2) - mPivotX;
            c1y = (mPenY * 2) - mPivotY;
            quadraticBezierCurveTo(c1x, c1y, c2x, c2y);
        }

        private void arc(float rx, float ry, float rotation, boolean outer, boolean clockwise, float x, float y) {
            arcTo(rx, ry, rotation, outer, clockwise, x + mPenX, y + mPenY);
        }

        private void arcTo(float rx, float ry, float rotation, boolean outer, boolean clockwise, float x, float y) {
            float tX = mPenX;
            float tY = mPenY;

            ry = Math.abs(ry == 0 ? (rx == 0 ? (y - tY) : rx) : ry);
            rx = Math.abs(rx == 0 ? (x - tX) : rx);

            if (rx == 0 || ry == 0 || (x == tX && y == tY)) {
                lineTo(x, y);
                return;
            }

            float rad = (float) Math.toRadians(rotation);
            float cos = (float) Math.cos(rad);
            float sin = (float) Math.sin(rad);
            x -= tX;
            y -= tY;

            // Ellipse Center
            float cx = cos * x / 2 + sin * y / 2;
            float cy = -sin * x / 2 + cos * y / 2;
            float rxry = rx * rx * ry * ry;
            float rycx = ry * ry * cx * cx;
            float rxcy = rx * rx * cy * cy;
            float a = rxry - rxcy - rycx;

            if (a < 0){
                a = (float)Math.sqrt(1 - a / rxry);
                rx *= a;
                ry *= a;
                cx = x / 2;
                cy = y / 2;
            } else {
                a = (float)Math.sqrt(a / (rxcy + rycx));

                if (outer == clockwise) {
                    a = -a;
                }
                float cxd = -a * cy * rx / ry;
                float cyd =  a * cx * ry / rx;
                cx = cos * cxd - sin * cyd + x / 2;
                cy = sin * cxd + cos * cyd + y / 2;
            }

            // Rotation + Scale Transform
            float xx =  cos / rx;
            float yx = sin / rx;
            float xy = -sin / ry;
            float yy = cos / ry;

            // Start and End Angle
            float sa = (float) Math.atan2(xy * -cx + yy * -cy, xx * -cx + yx * -cy);
            float ea = (float) Math.atan2(xy * (x - cx) + yy * (y - cy), xx * (x - cx) + yx * (y - cy));

            cx += tX;
            cy += tY;
            x += tX;
            y += tY;

            setPenDown();

            mPenX = mPivotX = x;
            mPenY = mPivotY = y;

            if (rx != ry || rad != 0f) {
                arcToBezier(cx, cy, rx, ry, sa, ea, clockwise, rad);
            } else {

                float start = (float) Math.toDegrees(sa);
                float end = (float) Math.toDegrees(ea);
                float sweep = Math.abs((start - end) % 360);

                if (outer) {
                    if (sweep < 180) {
                        sweep = 360 - sweep;
                    }
                } else {
                    if (sweep > 180) {
                        sweep = 360 - sweep;
                    }
                }

                if (!clockwise) {
                    sweep = -sweep;
                }

                RectF oval = new RectF(
                        (cx - rx) * mScale,
                        (cy - rx) * mScale,
                        (cx + rx) * mScale,
                        (cy + rx) * mScale);

                mPath.arcTo(oval, start, sweep);
            }
        }

        private void close() {
            if (mPendDownSet) {
                mPenX = mPenDownX;
                mPenY = mPenDownY;
                mPendDownSet = false;
                mPath.close();

                WritableArray points = Arguments.createArray();
                points.pushMap(clonePointMap(mLastStartPoint));
                points.pushMap(clonePointMap(mLastStartPoint));
                points.pushMap(clonePointMap(mLastStartPoint));
                mBezierCurves.pushArray(points);
            }
        }

        private void arcToBezier(float cx, float cy, float rx, float ry, float sa, float ea, boolean clockwise, float rad) {
            // Inverse Rotation + Scale Transform
            float cos = (float) Math.cos(rad);
            float sin = (float) Math.sin(rad);
            float xx = cos * rx;
            float yx = -sin * ry;
            float xy = sin * rx;
            float yy =  cos * ry;

            // Bezier Curve Approximation
            float arc = ea - sa;
            if (arc < 0 && clockwise) {
                arc += Math.PI * 2;
            } else if (arc > 0 && !clockwise) {
                arc -= Math.PI * 2;
            }

            int n = (int) Math.ceil(Math.abs(arc / (Math.PI / 2)));

            float step = arc / n;
            float k = (4 / 3) * (float) Math.tan(step / 4);

            float x = (float) Math.cos(sa);
            float y = (float) Math.sin(sa);

            for (int i = 0; i < n; i++){
                float cp1x = x - k * y;
                float cp1y = y + k * x;

                sa += step;
                x = (float) Math.cos(sa);
                y = (float) Math.sin(sa);

                float cp2x = x + k * y;
                float cp2y = y - k * x;

                mPath.cubicTo(
                        (cx + xx * cp1x + yx * cp1y) * mScale,
                        (cy + xy * cp1x + yy * cp1y) * mScale,
                        (cx + xx * cp2x + yx * cp2y) * mScale,
                        (cy + xy * cp2x + yy * cp2y) * mScale,
                        (cx + xx * x + yx * y) * mScale,
                        (cy + xy * x + yy * y) * mScale
                    );
            }
        }

        private void setPenDown() {
            if (!mPendDownSet) {
                mPenDownX = mPenX;
                mPenDownY = mPenY;
                mPendDownSet = true;
            }
        }
    }
}
