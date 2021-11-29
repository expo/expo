/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;

import javax.annotation.Nullable;

// https://www.w3.org/TR/SVG/text.html#TSpanElement
class GlyphContext {

    // Current stack (one per node push/pop)
    final ArrayList<FontData> mFontContext = new ArrayList<>();

    // Unique input attribute lists (only added if node sets a value)
    private final ArrayList<SVGLength[]> mXsContext = new ArrayList<>();
    private final ArrayList<SVGLength[]> mYsContext = new ArrayList<>();
    private final ArrayList<SVGLength[]> mDXsContext = new ArrayList<>();
    private final ArrayList<SVGLength[]> mDYsContext = new ArrayList<>();
    private final ArrayList<double[]> mRsContext = new ArrayList<>();

    // Unique index into attribute list (one per unique list)
    private final ArrayList<Integer> mXIndices = new ArrayList<>();
    private final ArrayList<Integer> mYIndices = new ArrayList<>();
    private final ArrayList<Integer> mDXIndices = new ArrayList<>();
    private final ArrayList<Integer> mDYIndices = new ArrayList<>();
    private final ArrayList<Integer> mRIndices = new ArrayList<>();

    // Index of unique context used (one per node push/pop)
    private final ArrayList<Integer> mXsIndices = new ArrayList<>();
    private final ArrayList<Integer> mYsIndices = new ArrayList<>();
    private final ArrayList<Integer> mDXsIndices = new ArrayList<>();
    private final ArrayList<Integer> mDYsIndices = new ArrayList<>();
    private final ArrayList<Integer> mRsIndices = new ArrayList<>();

    // Calculated on push context, percentage and em length depends on parent font size
    private double mFontSize = FontData.DEFAULT_FONT_SIZE;
    private FontData topFont = FontData.Defaults;

    // Current accumulated values
    // https://www.w3.org/TR/SVG/types.html#DataTypeCoordinate
    // <coordinate> syntax is the same as that for <length>
    private double mX;
    private double mY;

    // https://www.w3.org/TR/SVG/types.html#Length
    private double mDX;
    private double mDY;

    // Current <list-of-coordinates> SVGLengthList
    // https://www.w3.org/TR/SVG/types.html#InterfaceSVGLengthList
    // https://www.w3.org/TR/SVG/types.html#DataTypeCoordinates

    // https://www.w3.org/TR/SVG/text.html#TSpanElementXAttribute
    private SVGLength[] mXs = new SVGLength[]{};

    // https://www.w3.org/TR/SVG/text.html#TSpanElementYAttribute
    private SVGLength[] mYs = new SVGLength[]{};

    // Current <list-of-lengths> SVGLengthList
    // https://www.w3.org/TR/SVG/types.html#DataTypeLengths

    // https://www.w3.org/TR/SVG/text.html#TSpanElementDXAttribute
    private SVGLength[] mDXs = new SVGLength[]{};

    // https://www.w3.org/TR/SVG/text.html#TSpanElementDYAttribute
    private SVGLength[] mDYs = new SVGLength[]{};

    // Current <list-of-numbers> SVGLengthList
    // https://www.w3.org/TR/SVG/types.html#DataTypeNumbers

    // https://www.w3.org/TR/SVG/text.html#TSpanElementRotateAttribute
    private double[] mRs = new double[]{0};

    // Current attribute list index
    private int mXsIndex;
    private int mYsIndex;
    private int mDXsIndex;
    private int mDYsIndex;
    private int mRsIndex;

    // Current value index in current attribute list
    private int mXIndex = -1;
    private int mYIndex = -1;
    private int mDXIndex = -1;
    private int mDYIndex = -1;
    private int mRIndex = -1;

    // Top index of stack
    private int mTop;

    // Constructor parameters
    private final float mScale;
    private final float mWidth;
    private final float mHeight;

    private void pushIndices() {
        mXsIndices.add(mXsIndex);
        mYsIndices.add(mYsIndex);
        mDXsIndices.add(mDXsIndex);
        mDYsIndices.add(mDYsIndex);
        mRsIndices.add(mRsIndex);
    }

    GlyphContext(float scale, float width, float height) {
        mScale = scale;
        mWidth = width;
        mHeight = height;

        mXsContext.add(mXs);
        mYsContext.add(mYs);
        mDXsContext.add(mDXs);
        mDYsContext.add(mDYs);
        mRsContext.add(mRs);

        mXIndices.add(mXIndex);
        mYIndices.add(mYIndex);
        mDXIndices.add(mDXIndex);
        mDYIndices.add(mDYIndex);
        mRIndices.add(mRIndex);

        mFontContext.add(topFont);

        pushIndices();
    }

    private void reset() {
        mXsIndex = mYsIndex = mDXsIndex = mDYsIndex = mRsIndex = 0;
        mXIndex = mYIndex = mDXIndex = mDYIndex = mRIndex = -1;
        mX = mY = mDX = mDY = 0;
    }

    FontData getFont() {
        return topFont;
    }

    private FontData getTopOrParentFont(GroupView child) {
        if (mTop > 0) {
            return topFont;
        } else {
            GroupView parentRoot = child.getParentTextRoot();

            while (parentRoot != null) {
                FontData map = parentRoot.getGlyphContext().getFont();
                if (map != FontData.Defaults) {
                    return map;
                }
                parentRoot = parentRoot.getParentTextRoot();
            }

            return FontData.Defaults;
        }
    }

    private void pushNodeAndFont(GroupView node, @Nullable ReadableMap font) {
        FontData parent = getTopOrParentFont(node);
        mTop++;

        if (font == null) {
            mFontContext.add(parent);
            return;
        }

        FontData data = new FontData(font, parent, mScale);
        mFontSize = data.fontSize;
        mFontContext.add(data);
        topFont = data;

    }

    void pushContext(GroupView node, @Nullable ReadableMap font) {
        pushNodeAndFont(node, font);
        pushIndices();
    }

    private SVGLength[] getStringArrayFromReadableArray(ArrayList<SVGLength> readableArray) {
        int size = readableArray.size();
        SVGLength[] strings = new SVGLength[size];
        for (int i = 0; i < size; i++) {
            strings[i] = readableArray.get(i);
        }
        return strings;
    }

    private double[] getDoubleArrayFromReadableArray(ArrayList<SVGLength> readableArray) {
        int size = readableArray.size();
        double[] doubles = new double[size];
        for (int i = 0; i < size; i++) {
            SVGLength length = readableArray.get(i);
            doubles[i] = length.value;
        }
        return doubles;
    }

    void pushContext(
            boolean reset,
            TextView node,
            @Nullable ReadableMap font,
            @Nullable ArrayList<SVGLength> x,
            @Nullable ArrayList<SVGLength> y,
            @Nullable ArrayList<SVGLength> deltaX,
            @Nullable ArrayList<SVGLength> deltaY,
            @Nullable ArrayList<SVGLength> rotate
    ) {
        if (reset) {
            this.reset();
        }

        pushNodeAndFont(node, font);

        if (x != null && x.size() != 0) {
            mXsIndex++;
            mXIndex = -1;
            mXIndices.add(mXIndex);
            mXs = getStringArrayFromReadableArray(x);
            mXsContext.add(mXs);
        }

        if (y != null && y.size() != 0) {
            mYsIndex++;
            mYIndex = -1;
            mYIndices.add(mYIndex);
            mYs = getStringArrayFromReadableArray(y);
            mYsContext.add(mYs);
        }

        if (deltaX != null && deltaX.size() != 0) {
            mDXsIndex++;
            mDXIndex = -1;
            mDXIndices.add(mDXIndex);
            mDXs = getStringArrayFromReadableArray(deltaX);
            mDXsContext.add(mDXs);
        }

        if (deltaY != null && deltaY.size() != 0) {
            mDYsIndex++;
            mDYIndex = -1;
            mDYIndices.add(mDYIndex);
            mDYs = getStringArrayFromReadableArray(deltaY);
            mDYsContext.add(mDYs);
        }

        if (rotate != null && rotate.size() != 0) {
            mRsIndex++;
            mRIndex = -1;
            mRIndices.add(mRIndex);
            mRs = getDoubleArrayFromReadableArray(rotate);
            mRsContext.add(mRs);
        }

        pushIndices();
    }

    void popContext() {
        mFontContext.remove(mTop);
        mXsIndices.remove(mTop);
        mYsIndices.remove(mTop);
        mDXsIndices.remove(mTop);
        mDYsIndices.remove(mTop);
        mRsIndices.remove(mTop);

        mTop--;

        int x = mXsIndex;
        int y = mYsIndex;
        int dx = mDXsIndex;
        int dy = mDYsIndex;
        int r = mRsIndex;

        topFont = mFontContext.get(mTop);
        mXsIndex = mXsIndices.get(mTop);
        mYsIndex = mYsIndices.get(mTop);
        mDXsIndex = mDXsIndices.get(mTop);
        mDYsIndex = mDYsIndices.get(mTop);
        mRsIndex = mRsIndices.get(mTop);

        if (x != mXsIndex) {
            mXsContext.remove(x);
            mXs = mXsContext.get(mXsIndex);
            mXIndex = mXIndices.get(mXsIndex);
        }
        if (y != mYsIndex) {
            mYsContext.remove(y);
            mYs = mYsContext.get(mYsIndex);
            mYIndex = mYIndices.get(mYsIndex);
        }
        if (dx != mDXsIndex) {
            mDXsContext.remove(dx);
            mDXs = mDXsContext.get(mDXsIndex);
            mDXIndex = mDXIndices.get(mDXsIndex);
        }
        if (dy != mDYsIndex) {
            mDYsContext.remove(dy);
            mDYs = mDYsContext.get(mDYsIndex);
            mDYIndex = mDYIndices.get(mDYsIndex);
        }
        if (r != mRsIndex) {
            mRsContext.remove(r);
            mRs = mRsContext.get(mRsIndex);
            mRIndex = mRIndices.get(mRsIndex);
        }
    }

    private static void incrementIndices(ArrayList<Integer> indices, int topIndex) {
        for (int index = topIndex; index >= 0; index--) {
            int xIndex = indices.get(index);
            indices.set(index, xIndex + 1);
        }
    }

    // https://www.w3.org/TR/SVG11/text.html#FontSizeProperty

    /**
     * Get font size from context.
     * <p>
     * ‘font-size’
     * Value:       < absolute-size > | < relative-size > | < length > | < percentage > | inherit
     * Initial:     medium
     * Applies to:  text content elements
     * Inherited:   yes, the computed value is inherited
     * Percentages: refer to parent element's font size
     * Media:       visual
     * Animatable:  yes
     * <p>
     * This property refers to the size of the font from baseline to
     * baseline when multiple lines of text are set solid in a multiline
     * layout environment.
     * <p>
     * For SVG, if a < length > is provided without a unit identifier
     * (e.g., an unqualified number such as 128), the SVG user agent
     * processes the < length > as a height value in the current user
     * coordinate system.
     * <p>
     * If a < length > is provided with one of the unit identifiers
     * (e.g., 12pt or 10%), then the SVG user agent converts the
     * < length > into a corresponding value in the current user
     * coordinate system by applying the rules described in Units.
     * <p>
     * Except for any additional information provided in this specification,
     * the normative definition of the property is in CSS2 ([CSS2], section 15.2.4).
     */
    double getFontSize() {
        return mFontSize;
    }

    double nextX(double advance) {
        incrementIndices(mXIndices, mXsIndex);

        int nextIndex = mXIndex + 1;
        if (nextIndex < mXs.length) {
            mDX = 0;
            mXIndex = nextIndex;
            SVGLength string = mXs[nextIndex];
            mX = PropHelper.fromRelative(string, mWidth, 0, mScale, mFontSize);
        }

        mX += advance;

        return mX;
    }

    double nextY() {
        incrementIndices(mYIndices, mYsIndex);

        int nextIndex = mYIndex + 1;
        if (nextIndex < mYs.length) {
            mDY = 0;
            mYIndex = nextIndex;
            SVGLength string = mYs[nextIndex];
            mY = PropHelper.fromRelative(string, mHeight, 0, mScale, mFontSize);
        }

        return mY;
    }

    double nextDeltaX() {
        incrementIndices(mDXIndices, mDXsIndex);

        int nextIndex = mDXIndex + 1;
        if (nextIndex < mDXs.length) {
            mDXIndex = nextIndex;
            SVGLength string = mDXs[nextIndex];
            double val = PropHelper.fromRelative(string, mWidth, 0, mScale, mFontSize);
            mDX += val;
        }

        return mDX;
    }

    double nextDeltaY() {
        incrementIndices(mDYIndices, mDYsIndex);

        int nextIndex = mDYIndex + 1;
        if (nextIndex < mDYs.length) {
            mDYIndex = nextIndex;
            SVGLength string = mDYs[nextIndex];
            double val = PropHelper.fromRelative(string, mHeight, 0, mScale, mFontSize);
            mDY += val;
        }

        return mDY;
    }

    double nextRotation() {
        incrementIndices(mRIndices, mRsIndex);

        mRIndex = Math.min(mRIndex + 1, mRs.length - 1);

        return mRs[mRIndex];
    }

    float getWidth() {
        return mWidth;
    }

    float getHeight() {
        return mHeight;
    }
}
